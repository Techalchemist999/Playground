// ---------------------------------------------------------------------------
// services/graph_registry.js — In-memory topic index from Neo4j
//
// At startup (production): queries Neo4j for all known topic UIDs.
// PoC: pre-seeded with sample municipal topics to demonstrate enrichment.
// ---------------------------------------------------------------------------

const stringSimilarity = require("string-similarity");
const config = require("../shared/config");

class GraphRegistry {
  constructor() {
    // uid → { canonical_label, category }
    this._index = new Map();
  }

  /** Load initial topics (production: from Neo4j query). */
  async load() {
    // PoC: seed with sample topics that might already exist in the graph
    const seeds = [
      { uid: "budget::capital-budget-2024", label: "2024 Capital Budget", category: "budget" },
      { uid: "bylaw::zoning-bylaw", label: "Zoning Bylaw", category: "bylaw" },
      { uid: "department::public-works", label: "Public Works", category: "department" },
      { uid: "policy::official-community-plan", label: "Official Community Plan", category: "policy" },
      { uid: "topic::water-treatment-plant", label: "Water Treatment Plant", category: "topic" },
      { uid: "department::planning-department", label: "Planning Department", category: "department" },
    ];
    for (const s of seeds) {
      this._index.set(s.uid, { canonical_label: s.label, category: s.category });
    }
    console.log(`[GraphRegistry] Loaded ${this._index.size} topic UIDs`);
  }

  /** Try to match a label to an existing graph UID. Returns uid or null. */
  match(label) {
    // 1. Exact canonical match
    for (const [uid, entry] of this._index) {
      if (entry.canonical_label.toLowerCase() === label.toLowerCase()) return uid;
    }

    // 2. Fuzzy match
    const threshold = config.GRAPH_FUZZY_THRESHOLD / 100;
    const labels = [...this._index.values()].map((e) => e.canonical_label);
    if (labels.length === 0) return null;

    const best = stringSimilarity.findBestMatch(label.toLowerCase(), labels.map((l) => l.toLowerCase()));
    if (best.bestMatch.rating >= threshold) {
      const matchedIdx = best.bestMatchIndex;
      const uid = [...this._index.keys()][matchedIdx];
      return uid;
    }

    return null;
  }

  /** Add a new UID after a graph write. */
  register(uid, label, category) {
    this._index.set(uid, { canonical_label: label, category });
  }

  count() { return this._index.size; }

  getAll() {
    return [...this._index.entries()].map(([uid, e]) => ({ uid, ...e }));
  }
}

module.exports = { GraphRegistry };
