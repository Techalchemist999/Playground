// ---------------------------------------------------------------------------
// routes/session_router.js — Session lifecycle (start/pause/resume/stop)
//
// State machine:
//   READY → ACTIVE → PAUSED → ACTIVE → STOPPED
//                                        (can also stop from ACTIVE)
// ---------------------------------------------------------------------------

const express = require("express");
const { SessionStatus } = require("../schemas/session_schemas");
const { SessionManager } = require("../pipeline/session_manager");
const { fetchAgenda, listAgendas } = require("../services/agenda_fetcher");
const { exportSessionTopics } = require("../services/td_bridge");

function createSessionRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // POST /session/start — Start the pipeline
  // -----------------------------------------------------------------------
  router.post("/session/start", async (req, res) => {
    const { session_id, agenda_id, config: sessionConfig } = req.body;
    if (!session_id) return res.status(400).json({ error: "session_id is required" });

    const session = appState.sessions.get(session_id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== SessionStatus.READY) {
      return res.status(409).json({ error: `Session is ${session.status}, expected READY` });
    }

    // Apply config overrides
    if (sessionConfig) Object.assign(session.config, sessionConfig);

    // Create SessionManager
    const manager = new SessionManager({
      session_id,
      sessionState: session,
      asrService: appState.asrService,
      normalizer: appState.normalizer,
      graphRegistry: appState.graphRegistry,
      eventBus: appState.eventBus,
    });

    // Attach agenda if requested
    if (agenda_id) {
      const agenda = await fetchAgenda(req.application, agenda_id);
      if (agenda) manager.attachAgenda(agenda);
    }

    appState.managers.set(session_id, manager);
    await manager.start();

    res.json({ session_id, status: SessionStatus.ACTIVE });
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/pause
  // -----------------------------------------------------------------------
  router.post("/session/:id/pause", (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (!manager) return res.status(404).json({ error: "Session not found" });
    manager.pause();
    res.json({ session_id: req.params.id, status: SessionStatus.PAUSED });
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/resume
  // -----------------------------------------------------------------------
  router.post("/session/:id/resume", (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (!manager) return res.status(404).json({ error: "Session not found" });
    manager.resume();
    res.json({ session_id: req.params.id, status: SessionStatus.ACTIVE });
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/stop — Stop + auto-minutes
  // -----------------------------------------------------------------------
  router.post("/session/:id/stop", async (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (!manager) return res.status(404).json({ error: "Session not found" });
    await manager.stop();
    const state = manager.getState();
    res.json({
      session_id: req.params.id,
      status: SessionStatus.STOPPED,
      topic_count: state.topics.length,
      has_minutes: !!state.minutes,
    });
  });

  // -----------------------------------------------------------------------
  // GET /session/:id/state — Session state snapshot
  // -----------------------------------------------------------------------
  router.get("/session/:id/state", (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (manager) return res.json(manager.getState());

    const session = appState.sessions.get(req.params.id);
    if (session) return res.json(session);

    res.status(404).json({ error: "Session not found" });
  });

  // -----------------------------------------------------------------------
  // GET /session/:id/topics — All detected topics
  // -----------------------------------------------------------------------
  router.get("/session/:id/topics", (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (!manager) {
      const session = appState.sessions.get(req.params.id);
      if (session) return res.json({ topics: session.topics });
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ topics: manager.getState().topics });
  });

  // -----------------------------------------------------------------------
  // GET /agendas — List available agendas from CliDE
  // -----------------------------------------------------------------------
  router.get("/agendas", async (req, res) => {
    const agendas = await listAgendas(req.application);
    res.json({ agendas });
  });

  // -----------------------------------------------------------------------
  // GET /session/:id/agenda — Agenda alignment progress
  // -----------------------------------------------------------------------
  router.get("/session/:id/agenda", (req, res) => {
    const manager = appState.managers.get(req.params.id);
    if (!manager) return res.status(404).json({ error: "Session not found" });
    const state = manager.getState();
    if (!state.agenda_progress) return res.json({ agenda: null, message: "No agenda attached" });
    res.json({ agenda: state.agenda_progress });
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/export — Export as TD format
  // -----------------------------------------------------------------------
  router.post("/session/:id/export", (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const exported = exportSessionTopics(session);
    res.json(exported);
  });

  return router;
}

module.exports = { createSessionRouter };
