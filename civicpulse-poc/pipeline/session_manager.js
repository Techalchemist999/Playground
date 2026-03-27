// ---------------------------------------------------------------------------
// pipeline/session_manager.js — Orchestrates the real-time pipeline per session
//
// Pipeline flow:
//   1. ASR callback fires with a new transcript chunk
//   2. TranscriptBuffer absorbs the chunk into its rolling window
//   3. Every N finalized chunks, extraction triggers
//   4. TopicExtractor sends the 30s window to the LLM (or simulation)
//   5. TopicNormalizer deduplicates extracted topics
//   6. GraphRegistry enriches topics with known UIDs
//   7. TopicLifecycleManager updates state (detected, active, expired, reappeared)
//   8. TopicEventBus publishes SSE events to connected frontends
//   9. If an agenda is attached, AgendaAligner matches topics to agenda items
// ---------------------------------------------------------------------------

const { SessionStatus } = require("../schemas/session_schemas");
const { TopicState } = require("../schemas/topic_schemas");
const { TranscriptBuffer } = require("../services/transcript_buffer");
const { extractTopics } = require("../services/topic_extractor");
const { TopicLifecycleManager } = require("../services/topic_lifecycle");
const { AgendaAligner } = require("../services/agenda_aligner");
const { EventTypes } = require("./event_bus");
const { MINUTES_SECTIONS } = require("../prompts/minutes");

class SessionManager {
  constructor({ session_id, sessionState, asrService, normalizer, graphRegistry, eventBus }) {
    this.session_id = session_id;
    this._state = sessionState;
    this._asr = asrService;
    this._normalizer = normalizer;
    this._graphRegistry = graphRegistry;
    this._eventBus = eventBus;

    // Pipeline components
    this._buffer = new TranscriptBuffer(sessionState.config.context_window_seconds);
    this._lifecycle = new TopicLifecycleManager({
      max_concurrent_bubbles: sessionState.config.max_concurrent_bubbles,
      expiry_seconds: sessionState.config.expiry_seconds,
      decay_lambda: sessionState.config.decay_lambda,
    });
    this._aligner = null; // set if agenda is attached

    this._chunksSinceExtraction = 0;
    this._extractionInterval = sessionState.config.extraction_interval_chunks;
    this._extracting = false; // lock to prevent concurrent extractions
    this._asrSession = null;
  }

  /** Attach an agenda for real-time alignment. */
  attachAgenda(parsedAgenda) {
    this._aligner = new AgendaAligner(parsedAgenda);
    this._state.agenda = parsedAgenda;
  }

  /** Start the pipeline — begins ASR and extraction loop. */
  async start() {
    this._state.status = SessionStatus.ACTIVE;
    this._eventBus.publish(this.session_id, EventTypes.SESSION_STATUS, { status: SessionStatus.ACTIVE });

    // Create ASR session with callback
    const mode = this._state.source === "mic" ? "push_stream" : "file";
    this._asrSession = this._asr.createSession(this.session_id, {
      onChunk: (chunk) => this._onASRChunk(chunk),
      mode,
    });
    this._asrSession.start();
    console.log(`[SessionManager] Session ${this.session_id} started (source=${this._state.source})`);
  }

  /** Accept raw PCM audio bytes (mic mode). */
  pushAudio(buffer) {
    if (this._asrSession) {
      this._asrSession.pushAudio(buffer);
    }
  }

  /** Pause ASR recognition. */
  pause() {
    if (this._asrSession) this._asrSession.pause();
    this._state.status = SessionStatus.PAUSED;
    this._eventBus.publish(this.session_id, EventTypes.SESSION_STATUS, { status: SessionStatus.PAUSED });
  }

  /** Resume ASR from where it paused. */
  resume() {
    if (this._asrSession) this._asrSession.resume();
    this._state.status = SessionStatus.ACTIVE;
    this._eventBus.publish(this.session_id, EventTypes.SESSION_STATUS, { status: SessionStatus.ACTIVE });
  }

  /** Stop the session — waits for in-flight extraction, generates minutes. */
  async stop() {
    // Stop ASR
    if (this._asrSession) this._asrSession.stop();
    this._asr.stopSession(this.session_id);

    // Wait for any in-flight extraction
    while (this._extracting) {
      await new Promise((r) => setTimeout(r, 100));
    }

    // Do a final extraction flush
    await this._triggerExtraction();

    // Generate topic summaries
    this._generateTopicSummaries();

    // Auto-generate minutes
    this._state.minutes = this._generateMinutes();

    // Store final topics
    this._state.topics = this._lifecycle.getAllTopics();

    this._state.status = SessionStatus.STOPPED;
    this._eventBus.publish(this.session_id, EventTypes.SESSION_STATUS, { status: SessionStatus.STOPPED });
    console.log(`[SessionManager] Session ${this.session_id} stopped — ${this._state.topics.length} topics, minutes generated`);
  }

  /** Get current session state snapshot. */
  getState() {
    return {
      ...this._state,
      topics: this._lifecycle.getAllTopics(),
      buffer_state: this._buffer.getState(),
      agenda_progress: this._aligner ? this._aligner.getProgress() : null,
    };
  }

  // -- Pipeline internals -------------------------------------------------

  /** ASR chunk callback (fires from ASR timer). */
  _onASRChunk(chunk) {
    // 1. Add to buffer
    this._buffer.addChunk(chunk);

    // 2. Store in session transcript
    this._state.transcript.push(chunk);

    // 3. Publish transcript event
    this._eventBus.publish(this.session_id, EventTypes.TRANSCRIPT_CHUNK, {
      text: chunk.text,
      timestamp_start: chunk.timestamp_start,
      timestamp_end: chunk.timestamp_end,
      is_final: chunk.is_final,
    }, chunk.timestamp_end);

    // 4. Check if we should trigger extraction
    this._chunksSinceExtraction++;
    if (chunk.is_final && this._chunksSinceExtraction >= this._extractionInterval) {
      this._triggerExtraction();
    }
  }

  /** Run topic extraction on the current buffer window. */
  async _triggerExtraction() {
    if (this._extracting) return;
    this._extracting = true;
    this._chunksSinceExtraction = 0;

    try {
      const contextText = this._buffer.getPlainText();
      if (!contextText.trim()) return;

      const state = this._buffer.getState();
      const tsStart = state.chunks.length > 0 ? state.chunks[0].timestamp_start : 0;
      const tsEnd = state.chunks.length > 0 ? state.chunks[state.chunks.length - 1].timestamp_end : 0;

      // Step 1: Extract topics from transcript window
      const extracted = await extractTopics(contextText, tsStart, tsEnd);

      // Step 2: Normalize each topic
      const normalised = extracted.map((et) => {
        const norm = this._normalizer.normalize(et);
        // Step 3: Enrich with graph registry UID
        const uid = this._graphRegistry.match(norm.label);
        return { extracted: et, normalized_id: norm.normalized_id, label: norm.label, uid };
      });

      // Step 4: Update lifecycle
      const lifecycleEvents = this._lifecycle.processBatch(normalised, tsEnd);

      // Step 5: Publish SSE events
      for (const evt of lifecycleEvents) {
        const eventType = this._transitionToEventType(evt.transition);
        if (eventType) {
          this._eventBus.publish(this.session_id, eventType, {
            label: evt.topic.label,
            normalized_id: evt.topic.normalized_id,
            category: evt.topic.category,
            confidence: evt.topic.confidence,
            state: evt.topic.state,
            decay_score: evt.topic.decay_score,
            mention_count: evt.topic.mention_count,
            uid: evt.topic.uid,
          }, tsEnd);
        }
      }

      // Step 6: Agenda alignment (if attached)
      if (this._aligner && extracted.length > 0) {
        const agendaEvents = this._aligner.align(extracted, tsEnd);
        for (const ae of agendaEvents) {
          this._eventBus.publish(this.session_id, ae.type, ae, tsEnd);
        }
      }
    } finally {
      this._extracting = false;
    }
  }

  _transitionToEventType(transition) {
    switch (transition) {
      case TopicState.DETECTED: return EventTypes.TOPIC_DETECTED;
      case TopicState.ACTIVE: return EventTypes.TOPIC_UPDATED;
      case TopicState.EXPIRED: return EventTypes.TOPIC_EXPIRED;
      case TopicState.EVICTED: return EventTypes.TOPIC_EVICTED;
      case TopicState.REAPPEARED: return EventTypes.TOPIC_REAPPEARED;
      default: return null;
    }
  }

  /** Generate 2-4 sentence summaries for each active topic (simulated). */
  _generateTopicSummaries() {
    const topics = this._lifecycle.getAllTopics();
    const transcript = this._state.transcript.map((c) => c.text).join(" ");
    for (const topic of topics) {
      // PoC: generate a simple summary based on what we know
      topic.summary = `${topic.label} was discussed during the meeting with a confidence of ${(topic.confidence * 100).toFixed(0)}%. It was mentioned ${topic.mention_count} time(s) and categorised as "${topic.category}".`;
    }
  }

  /** Generate structured meeting minutes — Village of Pouce Coupe format. */
  _generateMinutes() {
    const topics = this._lifecycle.getAllTopics();
    const topicsByCategory = {};
    for (const t of topics) {
      if (!topicsByCategory[t.category]) topicsByCategory[t.category] = [];
      topicsByCategory[t.category].push(t);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // Build HTML minutes — Village of Pouce Coupe format
    let html = `<h1><strong>REGULAR COUNCIL MEETING MINUTES</strong></h1>\n`;
    html += `<p><strong>${dateStr}</strong><br><strong>7:15 PM – Council Chambers</strong></p>\n`;
    html += `<p><em>Auto-generated by CivicPulse — ${topics.length} topics detected</em></p>\n`;
    html += `<hr>\n`;

    const motion = (text, mover, seconder, result = "CARRIED UNANIMOUSLY") => {
      let m = `<p>MOTION: <strong>THAT ${text}</strong></p>\n`;
      m += `<p><strong>MOVED BY:</strong> ${mover}<br>\n`;
      m += `<strong>SECONDED BY:</strong> ${seconder}<br>\n`;
      m += `<strong>${result}</strong></p>\n`;
      return m;
    };

    let sectionNum = 0;
    for (const section of MINUTES_SECTIONS) {
      sectionNum++;
      html += `<h2>${sectionNum}. ${section.toUpperCase()}</h2>\n`;

      switch (section) {
        case "Call to Order":
          html += `<p>The meeting was called to order at <strong>7:15 PM</strong> by <strong>Mayor Veach</strong>.</p>\n`;
          html += `<p><strong>Present:</strong></p>\n<ul>\n<li>Mayor Veach</li>\n<li>Councillor Rabel</li>\n<li>Councillor Wall</li>\n<li>Councillor Johnston</li>\n</ul>\n`;
          html += `<p><strong>Absent:</strong></p>\n<ul><li>Councillor Woodill (with notice)</li></ul>\n`;
          html += `<p><strong>Staff:</strong></p>\n<ul><li>CAO/CO Cybulski</li></ul>\n`;
          break;

        case "Land Acknowledgement":
          html += `<p>Mayor Veach acknowledged that the meeting was taking place on <strong>Treaty 8 First Nations Territory</strong>, recognizing the long-standing presence of Elders and Ancestors of Treaty 8.</p>\n`;
          break;

        case "Adoption of Agenda":
          html += motion(
            `Council adopts the ${dateStr} Regular Council Meeting agenda as presented.`,
            "Mayor Veach", "Councillor Johnston"
          );
          break;

        case "Adoption of Minutes":
          html += `<p><strong>N/A</strong></p>\n`;
          break;

        case "Introduction of Late Items":
        case "Public Hearing":
          html += `<p><strong>N/A</strong></p>\n`;
          break;

        case "Delegations":
          if (topicsByCategory.person) {
            for (const t of topicsByCategory.person) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
            }
          } else {
            html += `<p><strong>N/A</strong></p>\n`;
          }
          break;

        case "Unfinished Business and Business Arising from the Minutes": {
          const unfinished = [...(topicsByCategory.policy || []), ...(topicsByCategory.organization || [])];
          if (unfinished.length > 0) {
            unfinished.forEach((t, i) => {
              html += `<h3>8.${i + 1} ${t.label}</h3>\n`;
              html += `<p>${t.summary}</p>\n`;
              html += motion(
                `Council receives the ${t.label} for information.`,
                "Mayor Veach", "Councillor Wall"
              );
            });
          } else {
            html += `<p><strong>N/A</strong></p>\n`;
          }
          break;
        }

        case "New Business": {
          const newBiz = [...(topicsByCategory.topic || []), ...(topicsByCategory.program || []), ...(topicsByCategory.budget || [])];
          if (newBiz.length > 0) {
            newBiz.forEach((t, i) => {
              html += `<h3>9.${i + 1} ${t.label}</h3>\n`;
              html += `<p>${t.summary}</p>\n`;
              html += motion(
                `Council approves the ${t.label} as presented.`,
                "Councillor Johnston", "Councillor Wall"
              );
            });
          } else {
            html += `<p>No new business recorded.</p>\n`;
          }
          break;
        }

        case "Correspondence":
          html += `<p><strong>N/A</strong></p>\n`;
          break;

        case "Resolutions":
          if (topicsByCategory.motion) {
            for (const t of topicsByCategory.motion) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
              html += motion(
                `Council adopts the resolution regarding ${t.label}.`,
                "Councillor Rabel", "Councillor Wall"
              );
            }
          } else {
            html += `<p><strong>N/A</strong></p>\n`;
          }
          break;

        case "Bylaws":
          if (topicsByCategory.bylaw) {
            for (const t of topicsByCategory.bylaw) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
              html += motion(
                `Council gives first, second, and third reading to ${t.label}.`,
                "Mayor Veach", "Councillor Rabel"
              );
            }
          } else {
            html += `<p><strong>N/A</strong></p>\n`;
          }
          break;

        case "Administration Reports":
          if (topicsByCategory.department) {
            html += `<h3>13.1 CAO Report</h3>\n`;
            for (const t of topicsByCategory.department) {
              html += `<p>${t.summary}</p>\n`;
            }
            html += motion(
              `Council accepts the CAO Report for information.`,
              "Mayor Veach", "Councillor Rabel"
            );
          } else {
            html += `<h3>13.1 CAO Report</h3>\n`;
            html += `<p>CAO provided updates on key municipal activities.</p>\n`;
            html += motion(
              `Council accepts the CAO Report for information.`,
              "Mayor Veach", "Councillor Rabel"
            );
          }
          break;

        case "Reports":
          html += `<h3>14.1 Councillor Johnston Report</h3>\n<p>Councillor Johnston provided updates on recent activities.</p>\n`;
          html += `<h3>14.2 Councillor Rabel Report</h3>\n<p>Councillor Rabel provided updates on community engagement and local economic development initiatives.</p>\n`;
          html += `<h3>14.3 Councillor Wall Report</h3>\n<p>Councillor Wall provided updates on community events and volunteer recognition.</p>\n`;
          html += `<h3>14.4 Councillor Woodill Report</h3>\n<p>Councillor Woodill was <strong>absent with notice</strong> and did not provide a report for this meeting.</p>\n`;
          html += `<h3>14.5 Mayor Veach Report</h3>\n<p>Mayor Veach provided a detailed report on recent activities, including regional district meetings, community engagement, and upcoming events.</p>\n`;
          break;

        case "Question Period":
          html += `<p><strong>No public attendees.</strong></p>\n`;
          break;

        case "In-Camera":
          html += motion(
            `Council moves in-camera as per Section 90(1)(k) of the Community Charter regarding preliminary municipal service negotiations.`,
            "Mayor Veach", "Councillor Wall"
          );
          html += `<p>Council moved in-camera at <strong>8:18 PM</strong>.</p>\n`;
          break;

        case "Rise and Report":
          html += `<p><strong>N/A</strong></p>\n`;
          break;

        case "Adjournment":
          html += motion(
            `the meeting be adjourned at 9:32 PM.`,
            "Mayor Veach", "Councillor Wall"
          );
          break;

        default:
          html += `<p><strong>N/A</strong></p>\n`;
      }
    }

    // Signature block
    html += `<hr>\n`;
    html += `<p><strong>Chairperson:</strong><br>Mayor Danielle Veach ___________________________</p>\n`;
    html += `<p><strong>Chief Administrative & Corporate Officer:</strong><br>Matthew Cybulski ___________________________</p>\n`;

    return html;
  }
}

module.exports = { SessionManager };
