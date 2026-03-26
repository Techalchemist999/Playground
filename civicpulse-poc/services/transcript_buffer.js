// ---------------------------------------------------------------------------
// services/transcript_buffer.js — Rolling transcript window (default 30s)
//
// Holds the most recent N seconds of finalised transcript chunks.  This
// window is what gets sent to the LLM for topic extraction — not the entire
// meeting transcript.
// ---------------------------------------------------------------------------

class TranscriptBuffer {
  constructor(windowSeconds = 30) {
    this._windowSeconds = windowSeconds;
    this._chunks = [];
    this._totalReceived = 0;
  }

  /** Add a TranscriptChunk; drop anything older than the window. */
  addChunk(chunk) {
    if (!chunk.is_final) return; // only finalised text
    this._chunks.push(chunk);
    this._totalReceived++;
    this._prune(chunk.timestamp_end);
  }

  /** Return timestamped lines suitable for LLM context. */
  getContextWindow() {
    return this._chunks.map(
      (c) => `[${fmtTime(c.timestamp_start)}–${fmtTime(c.timestamp_end)}] ${c.text}`
    ).join("\n");
  }

  /** Plain concatenated text. */
  getPlainText() {
    return this._chunks.map((c) => c.text).join(" ");
  }

  /** Snapshot of current buffer state. */
  getState() {
    return {
      chunks: [...this._chunks],
      window_seconds: this._windowSeconds,
      total_received: this._totalReceived,
      current_count: this._chunks.length,
    };
  }

  // -- internals ----------------------------------------------------------

  _prune(latestEnd) {
    const cutoff = latestEnd - this._windowSeconds;
    this._chunks = this._chunks.filter((c) => c.timestamp_end >= cutoff);
  }
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

module.exports = { TranscriptBuffer };
