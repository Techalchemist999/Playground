// ---------------------------------------------------------------------------
// routes/minutes_router.js — Minutes generation, editing, export
//
// Two formats: standard (11-section) and agenda-structured.
// ---------------------------------------------------------------------------

const express = require("express");
const { SessionStatus } = require("../schemas/session_schemas");

function createMinutesRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // POST /session/:id/generate-minutes — Generate full minutes
  // -----------------------------------------------------------------------
  router.post("/session/:id/generate-minutes", async (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Minutes are auto-generated on stop; this endpoint allows re-generation
    const manager = appState.managers.get(req.params.id);
    if (manager) {
      const state = manager.getState();
      res.json({ session_id: req.params.id, minutes: state.minutes || session.minutes });
    } else {
      res.json({ session_id: req.params.id, minutes: session.minutes });
    }
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/generate-section — Regenerate a single section
  // -----------------------------------------------------------------------
  router.post("/session/:id/generate-section", async (req, res) => {
    const { section_name } = req.body;
    if (!section_name) return res.status(400).json({ error: "section_name is required" });

    // PoC: return a stub regenerated section
    const html = `<h2>${section_name}</h2>\n<p><em>(Regenerated section — in production this would be an LLM call targeting only this section.)</em></p>`;
    res.json({ session_id: req.params.id, section: section_name, html });
  });

  // -----------------------------------------------------------------------
  // PUT /session/:id/minutes — Save edited minutes from TipTap editor
  // -----------------------------------------------------------------------
  router.put("/session/:id/minutes", (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { html } = req.body;
    if (!html) return res.status(400).json({ error: "html is required" });

    session.minutes = html;
    res.json({ session_id: req.params.id, saved: true });
  });

  // -----------------------------------------------------------------------
  // GET /session/:id/minutes — Retrieve saved minutes
  // -----------------------------------------------------------------------
  router.get("/session/:id/minutes", (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ session_id: req.params.id, minutes: session.minutes });
  });

  // -----------------------------------------------------------------------
  // GET /session/:id/export-html — Download minutes as HTML
  // -----------------------------------------------------------------------
  router.get("/session/:id/export-html", (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session || !session.minutes) {
      return res.status(404).json({ error: "Minutes not found" });
    }
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Meeting Minutes — ${req.params.id}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:2em auto;line-height:1.6}
h1{border-bottom:2px solid #333}h2{color:#1a5276;border-bottom:1px solid #ccc}
h3{color:#2c3e50}p{margin:0.5em 0}hr{margin:2em 0}</style>
</head><body>${session.minutes}</body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="minutes-${req.params.id}.html"`);
    res.send(fullHtml);
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/export-pdf — Download minutes as PDF (stub)
  // -----------------------------------------------------------------------
  router.post("/session/:id/export-pdf", (req, res) => {
    // PoC: PDF generation would use xhtml2pdf in production (Python)
    // In Node.js, puppeteer or pdfkit could be used
    res.json({
      session_id: req.params.id,
      message: "PDF export stub — in production, this converts HTML minutes to PDF via xhtml2pdf",
    });
  });

  // -----------------------------------------------------------------------
  // POST /session/:id/save-minutes-to-graph — Write to Neo4j + CliDE
  // -----------------------------------------------------------------------
  router.post("/session/:id/save-minutes-to-graph", async (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const client = req.application || "default";

    // 1. Write session to graph
    const result = await appState.graphWriter.writeSession(req.params.id, session, client);

    // 2. In production: bridge to CliDE via HTTP POST /minutes/{client}/bridge-create
    console.log(`[minutes] Bridged session ${req.params.id} to CliDE (simulated)`);

    res.json({
      session_id: req.params.id,
      graph: result,
      clide_bridge: "simulated",
      message: "Written to Neo4j graph and bridged to CliDE backend",
    });
  });

  return router;
}

module.exports = { createMinutesRouter };
