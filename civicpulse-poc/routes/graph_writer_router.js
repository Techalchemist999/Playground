// ---------------------------------------------------------------------------
// routes/graph_writer_router.js — Neo4j graph writes and queries
// ---------------------------------------------------------------------------

const express = require("express");
const { v4: uuid } = require("uuid");

function createGraphWriterRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // POST /graph/write-session/:id — Write a stopped session to Neo4j
  // -----------------------------------------------------------------------
  router.post("/graph/write-session/:id", async (req, res) => {
    const session = appState.sessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const client = req.application || "default";
    const result = await appState.graphWriter.writeSession(req.params.id, session, client);
    res.json(result);
  });

  // -----------------------------------------------------------------------
  // POST /graph/add-topic — Add a single topic manually
  // -----------------------------------------------------------------------
  router.post("/graph/add-topic", async (req, res) => {
    const { label, category, client } = req.body;
    if (!label || !category) return res.status(400).json({ error: "label and category are required" });

    const uid = `${category}::${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const result = await appState.graphWriter.addTopic(uid, label, category, client || req.application);
    res.json(result);
  });

  // -----------------------------------------------------------------------
  // POST /graph/topic-summary — Generate AI summary for a topic
  // -----------------------------------------------------------------------
  router.post("/graph/topic-summary", async (req, res) => {
    const { label, context } = req.body;
    if (!label) return res.status(400).json({ error: "label is required" });

    // PoC: return a simulated summary
    const summary = `${label} was discussed in the context of municipal governance. ${context ? "Additional context was provided for enrichment." : "No additional context was provided."}`;
    res.json({ label, summary });
  });

  // -----------------------------------------------------------------------
  // POST /graph/batch-write — Batch write topics with AI summaries
  // -----------------------------------------------------------------------
  router.post("/graph/batch-write", async (req, res) => {
    const { topics } = req.body;
    if (!Array.isArray(topics)) return res.status(400).json({ error: "topics array is required" });

    const client = req.application || "default";
    const results = [];
    for (const t of topics) {
      const uid = t.uid || `${t.category}::${t.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const summary = `${t.label} — auto-generated summary for batch write.`;
      await appState.graphWriter.addTopic(uid, t.label, t.category, client);
      results.push({ uid, label: t.label, summary });
    }
    res.json({ written: results.length, topics: results });
  });

  // -----------------------------------------------------------------------
  // GET /graph/sessions — List all persisted sessions from Neo4j
  // -----------------------------------------------------------------------
  router.get("/graph/sessions", (req, res) => {
    const client = req.application || null;
    res.json({ sessions: appState.graphWriter.getSessions(client) });
  });

  // -----------------------------------------------------------------------
  // DELETE /graph/session/:key — Delete a session and its graph data
  // -----------------------------------------------------------------------
  router.delete("/graph/session/:key", (req, res) => {
    const record_id = `civicpulse:${req.params.key}`;
    const result = appState.graphWriter.deleteSession(record_id);
    res.json(result);
  });

  // -----------------------------------------------------------------------
  // DELETE /graph/session/:key/topic/:uid — Remove a single topic
  // -----------------------------------------------------------------------
  router.delete("/graph/session/:key/topic/:uid", (req, res) => {
    const record_id = `civicpulse:${req.params.key}`;
    const result = appState.graphWriter.deleteTopicFromSession(record_id, req.params.uid);
    res.json(result);
  });

  // -----------------------------------------------------------------------
  // PUT /graph/session/:key/minutes — Update minutes HTML on Document node
  // -----------------------------------------------------------------------
  router.put("/graph/session/:key/minutes", (req, res) => {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: "html is required" });

    const record_id = `civicpulse:${req.params.key}`;
    const result = appState.graphWriter.updateMinutes(record_id, html);
    res.json(result);
  });

  return router;
}

module.exports = { createGraphWriterRouter };
