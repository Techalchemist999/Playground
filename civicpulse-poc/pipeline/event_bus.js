// ---------------------------------------------------------------------------
// pipeline/event_bus.js — SSE event bus for streaming to frontend
//
// Per-session, queue-based listener pattern.  Each SSE subscriber gets its
// own bounded queue; oldest events are dropped on overflow.
// ---------------------------------------------------------------------------

const { EventEmitter } = require("events");

/** Event types emitted through the bus */
const EventTypes = {
  TOPIC_DETECTED: "topic.detected",
  TOPIC_UPDATED: "topic.updated",
  TOPIC_EXPIRED: "topic.expired",
  TOPIC_EVICTED: "topic.evicted",
  TOPIC_REAPPEARED: "topic.reappeared",
  TRANSCRIPT_CHUNK: "transcript.chunk",
  SESSION_STATUS: "session.status",
  AGENDA_ITEM_STARTED: "agenda.item_started",
  AGENDA_ITEM_CHANGED: "agenda.item_changed",
};

/**
 * Envelope for every event sent over SSE.
 */
function createStreamEvent({ type, session_id, data, audio_position = null }) {
  return {
    type,
    session_id,
    data,
    timestamp: new Date().toISOString(),
    audio_position,
  };
}

/**
 * TopicEventBus — per-session pub/sub for real-time events.
 */
class TopicEventBus {
  constructor() {
    this._emitter = new EventEmitter();
    this._emitter.setMaxListeners(100);
  }

  /**
   * Publish an event for a session.
   */
  publish(session_id, type, data, audio_position = null) {
    const event = createStreamEvent({ type, session_id, data, audio_position });
    this._emitter.emit(`session:${session_id}`, event);
  }

  /**
   * Subscribe to events for a session.  Returns an unsubscribe function.
   * `callback(streamEvent)` is invoked for every published event.
   */
  subscribe(session_id, callback) {
    const channel = `session:${session_id}`;
    this._emitter.on(channel, callback);
    return () => this._emitter.removeListener(channel, callback);
  }

  /**
   * Remove all listeners for a session (cleanup on stop).
   */
  removeSession(session_id) {
    this._emitter.removeAllListeners(`session:${session_id}`);
  }
}

module.exports = { TopicEventBus, EventTypes, createStreamEvent };
