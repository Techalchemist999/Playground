// ---------------------------------------------------------------------------
// schemas/transcript_schemas.js — TranscriptChunk, WordTiming
// ---------------------------------------------------------------------------

/**
 * A single word with timing data from ASR.
 */
function createWordTiming({ word, offset, duration }) {
  return { word, offset: offset ?? 0, duration: duration ?? 0 };
}

/**
 * A chunk of transcribed text emitted by the ASR engine.
 */
function createTranscriptChunk({ text, timestamp_start, timestamp_end, is_final = true, words = [] }) {
  return {
    text: text.trim(),
    timestamp_start,
    timestamp_end,
    is_final,
    words: words.map(createWordTiming),
  };
}

module.exports = { createTranscriptChunk, createWordTiming };
