// ---------------------------------------------------------------------------
// services/topic_normalizer.js — Fuzzy dedup with string-similarity
//
// Resolution chain (tried in order):
//   1. Exact normalized ID match
//   2. Exact label match (lowercased)
//   3. Fuzzy match (string-similarity ≥ 0.82)
//   4. Register as new topic
// ---------------------------------------------------------------------------

const stringSimilarity = require("string-similarity");
const { slugify } = require("../schemas/topic_schemas");
const config = require("../shared/config");

const MUNICIPAL_SEED_TERMS = [
  "Public Works", "Planning Department", "Finance Department",
  "Parks and Recreation", "Engineering Services", "Fire Department",
  "RCMP", "Bylaw Enforcement", "Building Inspection",
  "Zoning Bylaw", "Noise Bylaw", "Parking Bylaw",
  "Official Community Plan", "Transportation Master Plan",
  "Capital Budget", "Operating Budget",
  "Water Treatment", "Sewer Infrastructure",
  "Community Centre", "Library Services",
  "Development Permit", "Subdivision Application",
  "Tax Rate", "User Fees",
  "Council Motion", "Public Hearing",
  "Advisory Committee", "Board of Variance",
];

class TopicNormalizer {
  constructor() {
    this._registry = new Map(); // normalized_id → { label, category }
    // Pre-seed
    for (const term of MUNICIPAL_SEED_TERMS) {
      const id = slugify(term);
      this._registry.set(id, { label: term, category: "topic" });
    }
  }

  /**
   * Normalize a topic — returns { normalized_id, label, is_new }.
   */
  normalize(extractedTopic) {
    const inputLabel = extractedTopic.label;
    const inputId = slugify(inputLabel);

    // 1. Exact ID match
    if (this._registry.has(inputId)) {
      const existing = this._registry.get(inputId);
      return { normalized_id: inputId, label: existing.label, is_new: false };
    }

    // 2. Exact label match (lowercased)
    for (const [id, entry] of this._registry) {
      if (entry.label.toLowerCase() === inputLabel.toLowerCase()) {
        return { normalized_id: id, label: entry.label, is_new: false };
      }
    }

    // 3. Fuzzy match
    const threshold = config.FUZZY_THRESHOLD / 100; // convert to 0-1
    const allLabels = [...this._registry.values()].map((e) => e.label);
    if (allLabels.length > 0) {
      const best = stringSimilarity.findBestMatch(inputLabel.toLowerCase(), allLabels.map((l) => l.toLowerCase()));
      if (best.bestMatch.rating >= threshold) {
        const matchedLabel = allLabels[best.bestMatchIndex];
        const matchedId = slugify(matchedLabel);
        return { normalized_id: matchedId, label: matchedLabel, is_new: false };
      }
    }

    // 4. Register new
    this._registry.set(inputId, { label: inputLabel, category: extractedTopic.category });
    return { normalized_id: inputId, label: inputLabel, is_new: true };
  }

  /** Return all known entries. */
  getAll() {
    return [...this._registry.entries()].map(([id, e]) => ({ normalized_id: id, ...e }));
  }
}

module.exports = { TopicNormalizer, MUNICIPAL_SEED_TERMS };
