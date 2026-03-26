// ---------------------------------------------------------------------------
// shared/config.js — Centralised configuration constants
// ---------------------------------------------------------------------------

const config = {
  PORT: parseInt(process.env.PORT || "8002", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5175",

  // LLM model names (mirrors shared/llm_config.py)
  MODEL_DEFAULT: process.env.LLM_MODEL_DEFAULT || "gpt-4o-mini",
  MODEL_LARGE: process.env.LLM_MODEL_LARGE || "gpt-4.1",
  MODEL_FAST: process.env.LLM_MODEL_FAST || "gpt-4o-mini",

  // Session defaults (mirrors schemas/session_schemas.py SessionConfig)
  DEFAULT_SESSION_CONFIG: {
    max_concurrent_bubbles: 10,
    expiry_seconds: 60,
    confidence_threshold: 0.2,
    decay_lambda: 0.05,
    context_window_seconds: 30,
    extraction_interval_chunks: 2,
  },

  // Topic normalizer
  FUZZY_THRESHOLD: 82, // RapidFuzz ratio equivalent
  GRAPH_FUZZY_THRESHOLD: 80,

  // Agenda aligner
  AGENDA_MATCH_THRESHOLD: 70,

  // Neo4j (stubs in PoC — real config would come from env)
  NEO4J_URI: process.env.NEO4J_URI || "bolt://localhost:7687",
  NEO4J_USER: process.env.NEO4J_USER || "neo4j",
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || "password",
};

module.exports = config;
