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

  /** Generate structured meeting minutes (simulated). */
  _generateMinutes() {
    const topics = this._lifecycle.getAllTopics();
    const transcript = this._state.transcript.map((c) => c.text).join(" ");
    const topicsByCategory = {};
    for (const t of topics) {
      if (!topicsByCategory[t.category]) topicsByCategory[t.category] = [];
      topicsByCategory[t.category].push(t);
    }

    // Build HTML minutes
    let html = `<h1>Meeting Minutes</h1>\n`;
    html += `<p><em>Auto-generated by CivicPulse</em></p>\n`;
    html += `<p>Session: ${this.session_id} | Source: ${this._state.source} | Topics detected: ${topics.length}</p>\n`;
    html += `<hr>\n`;

    let resNum = 1;
    const year = new Date().getFullYear().toString().slice(-2);

    for (const section of MINUTES_SECTIONS) {
      html += `<h2>${section}</h2>\n`;
      switch (section) {
        case "Call to Order":
          html += `<p>The meeting was called to order.</p>\n`;
          break;
        case "Approval of Agenda":
          html += `<p>MOVED and SECONDED THAT the agenda be approved as circulated.</p>\n`;
          html += `<p><strong>Resolution C${String(resNum++).padStart(3, "0")}/${year} — CARRIED</strong></p>\n`;
          break;
        case "Reports":
          if (topicsByCategory.department) {
            for (const t of topicsByCategory.department) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
            }
          } else {
            html += `<p>No department reports recorded.</p>\n`;
          }
          break;
        case "Bylaws":
          if (topicsByCategory.bylaw) {
            for (const t of topicsByCategory.bylaw) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
              html += `<p><strong>Resolution C${String(resNum++).padStart(3, "0")}/${year} — CARRIED</strong></p>\n`;
            }
          } else {
            html += `<p>No bylaw items recorded.</p>\n`;
          }
          break;
        case "New Business":
          const general = [...(topicsByCategory.topic || []), ...(topicsByCategory.program || []), ...(topicsByCategory.budget || [])];
          if (general.length > 0) {
            for (const t of general) {
              html += `<h3>${t.label}</h3>\n<p>${t.summary}</p>\n`;
            }
          } else {
            html += `<p>No new business recorded.</p>\n`;
          }
          break;
        case "Adjournment":
          html += `<p>There being no further business, the meeting was adjourned.</p>\n`;
          html += `<p><strong>Resolution C${String(resNum++).padStart(3, "0")}/${year} — CARRIED</strong></p>\n`;
          break;
        default:
          html += `<p>No items recorded under this section.</p>\n`;
      }
    }

    return html;
  }
}

module.exports = { SessionManager };
