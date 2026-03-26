// ---------------------------------------------------------------------------
// main.js — CivicPulse PoC entry point
//
// FastAPI-equivalent Express server on port 8002.
//
// Startup:
//   1. Initialise credentials, LLM, Speech, registry (simulated in PoC)
//   2. Load GraphRegistry (in-memory topic index)
//   3. Create TopicEventBus (SSE event dispatch)
//   4. Create session managers registry
//
// Shutdown:
//   Stop all running session managers, close connections.
// ---------------------------------------------------------------------------

const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const http = require("http");

const config = require("./shared/config");
const authGate = require("./middleware/auth");

// Services
const { ASRService } = require("./services/asr_service");
const { TopicNormalizer } = require("./services/topic_normalizer");
const { GraphRegistry } = require("./services/graph_registry");
const { GraphWriter } = require("./services/graph_writer");
const { TopicEventBus } = require("./pipeline/event_bus");

// Routers
const { createIngestRouter } = require("./routes/ingest_router");
const { createSessionRouter } = require("./routes/session_router");
const { createStreamRouter } = require("./routes/stream_router");
const { createMinutesRouter } = require("./routes/minutes_router");
const { createGraphRegistryRouter } = require("./routes/graph_registry_router");
const { createGraphWriterRouter } = require("./routes/graph_writer_router");

// =========================================================================
// Bootstrap
// =========================================================================

async function main() {
  const app = express();
  const server = http.createServer(app);

  // --- Middleware ---------------------------------------------------------
  app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(express.json({ limit: "50mb" }));
  app.use(authGate);

  // --- App state (equivalent to FastAPI app.state) -----------------------
  const appState = {
    sessions: new Map(),     // session_id → SessionState
    managers: new Map(),     // session_id → SessionManager
    asrService: new ASRService(),
    normalizer: new TopicNormalizer(),
    graphRegistry: new GraphRegistry(),
    graphWriter: null,       // set after registry loads
    eventBus: new TopicEventBus(),
  };

  // Load graph registry (production: queries Neo4j)
  await appState.graphRegistry.load();
  appState.graphWriter = new GraphWriter(appState.graphRegistry);

  console.log("[startup] App state initialised");
  console.log(`[startup] GraphRegistry: ${appState.graphRegistry.count()} topics loaded`);
  console.log(`[startup] TopicNormalizer: ${appState.normalizer.getAll().length} seed terms`);

  // --- Health check ------------------------------------------------------
  app.get("/healthz", (req, res) => res.json({ status: "ok", service: "civicpulse-poc" }));

  // --- Client metadata ---------------------------------------------------
  app.get("/api/cp/clients-meta", (req, res) => {
    res.json({
      clients: [
        { application: "townofws", name: "Town of West Summerland", active: true },
        { application: "cityofwk", name: "City of West Kelowna", active: true },
      ],
    });
  });

  // --- Mount routers under /api/cp/:application -------------------------
  const prefix = "/api/cp/:application";
  app.use(prefix, createIngestRouter(appState));
  app.use(prefix, createSessionRouter(appState));
  app.use(prefix, createStreamRouter(appState));
  app.use(prefix, createMinutesRouter(appState));
  app.use(prefix, createGraphRegistryRouter(appState));
  app.use(prefix, createGraphWriterRouter(appState));

  // --- WebSocket for live mic streaming ----------------------------------
  const wss = new WebSocketServer({ server, path: /^\/api\/cp\/[^/]+\/session\/[^/]+\/mic-stream$/ });

  wss.on("connection", (ws, req) => {
    // Extract session_id from URL
    const match = req.url.match(/\/session\/([^/]+)\/mic-stream/);
    const session_id = match ? match[1] : null;

    if (!session_id || !appState.managers.has(session_id)) {
      ws.close(4004, "Session not found");
      return;
    }

    console.log(`[ws] Mic stream connected for session ${session_id}`);
    const manager = appState.managers.get(session_id);

    ws.on("message", (data) => {
      // Raw PCM audio bytes → push to ASR
      manager.pushAudio(data);
    });

    ws.on("close", () => {
      console.log(`[ws] Mic stream disconnected for session ${session_id}`);
    });
  });

  // --- Graceful shutdown -------------------------------------------------
  async function shutdown() {
    console.log("\n[shutdown] Stopping all sessions...");
    for (const [id, manager] of appState.managers) {
      try { await manager.stop(); } catch (e) { /* ignore */ }
    }
    appState.asrService.stopAll();
    appState.eventBus = null;
    console.log("[shutdown] Cleanup complete");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // --- Start server ------------------------------------------------------
  server.listen(config.PORT, () => {
    console.log(`\n========================================`);
    console.log(` CivicPulse PoC running on port ${config.PORT}`);
    console.log(` Health:  http://localhost:${config.PORT}/healthz`);
    console.log(` API:     http://localhost:${config.PORT}/api/cp/{application}/...`);
    console.log(`========================================\n`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
