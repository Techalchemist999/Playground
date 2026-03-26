// ---------------------------------------------------------------------------
// services/topic_lifecycle.js — Bubble state machine
//
//   DETECTED → ACTIVE → EXPIRED
//                ↑         ↓
//            REAPPEARED ←──┘
//
// Manages decay scoring, expiry, and bubble cap eviction.
// ---------------------------------------------------------------------------

const { TopicState, createLiveTopic } = require("../schemas/topic_schemas");

class TopicLifecycleManager {
  constructor({ max_concurrent_bubbles = 10, expiry_seconds = 60, decay_lambda = 0.05 } = {}) {
    this._topics = new Map(); // normalized_id → LiveTopic
    this._maxBubbles = max_concurrent_bubbles;
    this._expirySeconds = expiry_seconds;
    this._decayLambda = decay_lambda;
  }

  /**
   * Process a batch of extracted + normalised topics.
   * Returns an array of LifecycleEvent: { topic, transition }
   */
  processBatch(normalisedTopics, currentTimestamp) {
    const events = [];
    const mentionedIds = new Set();

    // 1. Upsert each mentioned topic
    for (const { extracted, normalized_id, label } of normalisedTopics) {
      mentionedIds.add(normalized_id);
      const existing = this._topics.get(normalized_id);

      if (!existing) {
        // Brand new
        const live = createLiveTopic(extracted, { normalized_id, state: TopicState.DETECTED });
        this._topics.set(normalized_id, live);
        events.push({ topic: live, transition: TopicState.DETECTED });
      } else if (existing.state === TopicState.EXPIRED) {
        // Reappeared
        existing.state = TopicState.REAPPEARED;
        existing.decay_score = 1.0;
        existing.mention_count++;
        existing.last_seen = currentTimestamp;
        existing.confidence = Math.max(existing.confidence, extracted.confidence);
        events.push({ topic: existing, transition: TopicState.REAPPEARED });
      } else {
        // Still active — update
        existing.state = TopicState.ACTIVE;
        existing.decay_score = Math.min(1.0, existing.decay_score + 0.3);
        existing.mention_count++;
        existing.last_seen = currentTimestamp;
        existing.confidence = Math.max(existing.confidence, extracted.confidence);
        events.push({ topic: existing, transition: TopicState.ACTIVE });
      }
    }

    // 2. Decay & expire topics not mentioned in this batch
    for (const [id, topic] of this._topics) {
      if (mentionedIds.has(id)) continue;
      if (topic.state === TopicState.EXPIRED || topic.state === TopicState.EVICTED) continue;

      const elapsed = currentTimestamp - topic.last_seen;
      topic.decay_score *= Math.exp(-this._decayLambda * elapsed);

      if (elapsed > this._expirySeconds) {
        topic.state = TopicState.EXPIRED;
        events.push({ topic, transition: TopicState.EXPIRED });
      }
    }

    // 3. Enforce bubble cap — evict weakest if over limit
    const active = [...this._topics.values()].filter(
      (t) => t.state !== TopicState.EXPIRED && t.state !== TopicState.EVICTED
    );
    if (active.length > this._maxBubbles) {
      active.sort((a, b) => a.decay_score - b.decay_score);
      const toEvict = active.slice(0, active.length - this._maxBubbles);
      for (const t of toEvict) {
        t.state = TopicState.EVICTED;
        events.push({ topic: t, transition: TopicState.EVICTED });
      }
    }

    return events;
  }

  /** Get all topics (active + expired). */
  getAllTopics() {
    return [...this._topics.values()];
  }

  /** Get only active (non-expired, non-evicted) topics. */
  getActiveTopics() {
    return [...this._topics.values()].filter(
      (t) => t.state !== TopicState.EXPIRED && t.state !== TopicState.EVICTED
    );
  }
}

module.exports = { TopicLifecycleManager };
