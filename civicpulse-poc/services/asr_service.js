// ---------------------------------------------------------------------------
// services/asr_service.js — Azure Speech SDK transcription (simulated)
//
// In production: wraps Azure Cognitive Services Speech SDK continuous
// recognition in two modes — file mode and push-stream mode.
//
// PoC: simulates ASR by emitting pre-built transcript chunks on a timer,
// demonstrating the callback-driven pipeline without requiring Azure creds.
// ---------------------------------------------------------------------------

const { v4: uuid } = require("uuid");
const { createTranscriptChunk } = require("../schemas/transcript_schemas");

// Simulated council-meeting transcript fragments
const SIMULATED_CHUNKS = [
  "The meeting is called to order at seven p.m.",
  "First on the agenda is the approval of last month's minutes.",
  "Council moves to the two thousand twenty-four capital budget discussion.",
  "The Director of Finance presents the proposed capital budget of forty-two million dollars.",
  "Councillor Smith asks about the water infrastructure allocation.",
  "The Public Works department has requested an additional three million for the water treatment plant upgrade.",
  "A motion is moved to approve the capital budget as presented.",
  "Discussion now turns to the proposed zoning bylaw amendment for the downtown corridor.",
  "The Planning department recommends increasing density allowances in the town centre.",
  "Several residents have submitted letters of concern about parking.",
  "Councillor Jones raises the Official Community Plan and its alignment with the proposed changes.",
  "The Environmental Advisory Committee report is presented on the urban tree canopy program.",
  "A motion is made to refer the zoning amendment back to the Planning department for further consultation.",
  "Council moves to new business. The Recreation department requests approval for the community centre renovation.",
  "The estimated cost is twelve point five million with funding from the gas tax reserve.",
  "Councillor Williams asks about the timeline for the recreation centre project.",
  "Staff indicate construction could begin in the fall of twenty twenty-five.",
  "There being no further business, the meeting is adjourned at nine fifteen p.m.",
];

class ASRSession {
  constructor(session_id, { onChunk, mode = "file" }) {
    this.session_id = session_id;
    this.mode = mode; // "file" | "push_stream"
    this._onChunk = onChunk;
    this._timer = null;
    this._index = 0;
    this._audioPos = 0;
    this._paused = false;
    this._stopped = false;
  }

  /** Start emitting simulated chunks. */
  start() {
    if (this._stopped) return;
    const interval = 3000; // one chunk every 3 seconds
    this._timer = setInterval(() => {
      if (this._paused || this._stopped) return;
      if (this._index >= SIMULATED_CHUNKS.length) {
        this.stop();
        return;
      }
      const text = SIMULATED_CHUNKS[this._index];
      const start = this._audioPos;
      const duration = 2 + Math.random() * 2; // 2-4s per chunk
      const end = start + duration;
      const chunk = createTranscriptChunk({
        text,
        timestamp_start: start,
        timestamp_end: end,
        is_final: true,
      });
      this._audioPos = end;
      this._index++;
      this._onChunk(chunk);
    }, interval);
  }

  /** Accept raw PCM bytes (push-stream mode). PoC: no-op. */
  pushAudio(buffer) {
    // In production: feeds bytes into Azure Speech SDK push stream
  }

  pause() { this._paused = true; }
  resume() { this._paused = false; }

  stop() {
    this._stopped = true;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

/**
 * ASRService — factory managing multiple ASRSession instances.
 */
class ASRService {
  constructor() {
    this._sessions = new Map();
  }

  createSession(session_id, { onChunk, mode = "file" }) {
    const session = new ASRSession(session_id, { onChunk, mode });
    this._sessions.set(session_id, session);
    return session;
  }

  getSession(session_id) {
    return this._sessions.get(session_id) || null;
  }

  stopSession(session_id) {
    const s = this._sessions.get(session_id);
    if (s) { s.stop(); this._sessions.delete(session_id); }
  }

  stopAll() {
    for (const s of this._sessions.values()) s.stop();
    this._sessions.clear();
  }
}

module.exports = { ASRService, ASRSession };
