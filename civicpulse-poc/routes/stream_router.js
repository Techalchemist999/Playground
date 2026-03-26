// ---------------------------------------------------------------------------
// routes/stream_router.js — SSE real-time event stream
//
// Frontend connects to GET /stream/:session_id and receives a continuous
// stream of topic, transcript, and session events.
// ---------------------------------------------------------------------------

const express = require("express");

function createStreamRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // GET /stream/:session_id — SSE event stream
  // -----------------------------------------------------------------------
  router.get("/stream/:session_id", (req, res) => {
    const session_id = req.params.session_id;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    // Subscribe to events for this session
    const unsubscribe = appState.eventBus.subscribe(session_id, (event) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // 30-second keepalive heartbeat
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      console.log(`[stream] SSE client disconnected from session ${session_id}`);
    });

    console.log(`[stream] SSE client connected to session ${session_id}`);
  });

  return router;
}

module.exports = { createStreamRouter };
