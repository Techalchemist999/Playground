// ---------------------------------------------------------------------------
// routes/graph_registry_router.js — Topic registry lookups
// ---------------------------------------------------------------------------

const express = require("express");

function createGraphRegistryRouter(appState) {
  const router = express.Router();

  // -----------------------------------------------------------------------
  // GET /graph/registry/count — Topic count in graph
  // -----------------------------------------------------------------------
  router.get("/graph/registry/count", (req, res) => {
    res.json({ count: appState.graphRegistry.count() });
  });

  // -----------------------------------------------------------------------
  // GET /graph/registry/match — Fuzzy topic lookup
  // -----------------------------------------------------------------------
  router.get("/graph/registry/match", (req, res) => {
    const { label } = req.query;
    if (!label) return res.status(400).json({ error: "label query param is required" });

    const uid = appState.graphRegistry.match(label);
    if (uid) {
      res.json({ matched: true, uid, label });
    } else {
      res.json({ matched: false, uid: null, label });
    }
  });

  return router;
}

module.exports = { createGraphRegistryRouter };
