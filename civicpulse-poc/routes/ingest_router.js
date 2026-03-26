// ---------------------------------------------------------------------------
// routes/ingest_router.js — Audio ingestion (YouTube, upload, mic)
//
// Three input sources all converge: once ingested, POST /session/start
// kicks off the pipeline.
// ---------------------------------------------------------------------------

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const { createSessionState, SessionStatus } = require("../schemas/session_schemas");

const upload = multer({ dest: path.join(__dirname, "..", "tmp") });

function createIngestRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // POST /ingest/youtube — YouTube audio extraction
  // -----------------------------------------------------------------------
  router.post("/ingest/youtube", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    const session_id = uuid();
    const session = createSessionState({
      session_id,
      source: "youtube",
      status: SessionStatus.READY,
    });
    session.audio_url = url; // In production: yt-dlp downloads the audio track

    appState.sessions.set(session_id, session);

    console.log(`[ingest] YouTube session ${session_id} created for ${url}`);
    res.json({
      session_id,
      status: SessionStatus.READY,
      audio_url: url,
      message: "PoC: YouTube download simulated. Call POST /session/start to begin.",
    });
  });

  // -----------------------------------------------------------------------
  // POST /ingest/upload — File upload
  // -----------------------------------------------------------------------
  router.post("/ingest/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const session_id = uuid();
    const session = createSessionState({
      session_id,
      source: "upload",
      status: SessionStatus.READY,
    });
    session.audio_url = `/api/cp/${req.application}/ingest/audio/${session_id}`;
    session._filePath = req.file.path;

    appState.sessions.set(session_id, session);

    console.log(`[ingest] Upload session ${session_id} created (${req.file.originalname})`);
    res.json({
      session_id,
      status: SessionStatus.READY,
      audio_url: session.audio_url,
      filename: req.file.originalname,
    });
  });

  // -----------------------------------------------------------------------
  // POST /ingest/mic — Create mic push-stream session
  // -----------------------------------------------------------------------
  router.post("/ingest/mic", async (req, res) => {
    const session_id = uuid();
    const session = createSessionState({
      session_id,
      source: "mic",
      status: SessionStatus.READY,
    });

    appState.sessions.set(session_id, session);

    console.log(`[ingest] Mic session ${session_id} created`);
    res.json({
      session_id,
      status: SessionStatus.READY,
      ws_url: `/api/cp/${req.application}/session/${session_id}/mic-stream`,
    });
  });

  // -----------------------------------------------------------------------
  // GET /ingest/audio/:session_id — Serve audio for browser playback
  // -----------------------------------------------------------------------
  router.get("/ingest/audio/:session_id", (req, res) => {
    const session = appState.sessions.get(req.params.session_id);
    if (!session || !session._filePath) {
      return res.status(404).json({ error: "Audio not found" });
    }
    res.sendFile(path.resolve(session._filePath));
  });

  return router;
}

module.exports = { createIngestRouter };
