// ---------------------------------------------------------------------------
// schemas/topic_schemas.js — ExtractedTopic, LiveTopic, TopicState
// ---------------------------------------------------------------------------

const TOPIC_CATEGORIES = [
  "topic",
  "bylaw",
  "department",
  "location",
  "program",
  "policy",
  "motion",
  "organization",
  "budget",
  "person",
];

/** Enum for topic lifecycle states */
const TopicState = {
  DETECTED: "DETECTED",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REAPPEARED: "REAPPEARED",
  EVICTED: "EVICTED",
};

/**
 * Validate & create an ExtractedTopic (output from the LLM).
 */
function createExtractedTopic({ label, category, confidence, timestamp_start, timestamp_end }) {
  if (!label || typeof label !== "string") throw new Error("label is required");
  if (!TOPIC_CATEGORIES.includes(category)) throw new Error(`Invalid category: ${category}`);
  return {
    label: label.trim(),
    category,
    confidence: Math.max(0, Math.min(1, confidence ?? 0.5)),
    timestamp_start: timestamp_start ?? 0,
    timestamp_end: timestamp_end ?? 0,
  };
}

/**
 * Create a LiveTopic — the enriched, lifecycle-managed version of a topic.
 */
function createLiveTopic(extracted, { normalized_id, uid = null, state = TopicState.DETECTED, decay_score = 1.0, summary = null } = {}) {
  return {
    ...extracted,
    normalized_id: normalized_id || slugify(extracted.label),
    uid, // graph UID if matched
    state,
    decay_score,
    summary,
    first_seen: extracted.timestamp_start,
    last_seen: extracted.timestamp_end,
    mention_count: 1,
  };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

module.exports = { TOPIC_CATEGORIES, TopicState, createExtractedTopic, createLiveTopic, slugify };
