// ---------------------------------------------------------------------------
// schemas/session_schemas.js — SessionConfig, SessionState, SessionStatus
// ---------------------------------------------------------------------------

const config = require("../shared/config");

const SessionStatus = {
  READY: "READY",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
};

function createSessionConfig(overrides = {}) {
  return { ...config.DEFAULT_SESSION_CONFIG, ...overrides };
}

function createSessionState({ session_id, source, status = SessionStatus.READY, sessionConfig = {} }) {
  return {
    session_id,
    source, // "youtube" | "upload" | "mic"
    status,
    config: createSessionConfig(sessionConfig),
    created_at: new Date().toISOString(),
    topics: [],         // LiveTopic[]
    transcript: [],     // TranscriptChunk[]
    minutes: null,      // generated minutes HTML
    agenda: null,       // ParsedAgenda | null
    audio_url: null,
  };
}

module.exports = { SessionStatus, createSessionConfig, createSessionState };
