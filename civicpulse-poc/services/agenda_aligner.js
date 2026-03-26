// ---------------------------------------------------------------------------
// services/agenda_aligner.js — Real-time topic ↔ agenda item matching
//
// Fuzzy-matches extracted topics against agenda items to track meeting
// progress: pending → active → discussed.
// ---------------------------------------------------------------------------

const stringSimilarity = require("string-similarity");
const config = require("../shared/config");

class AgendaAligner {
  constructor(parsedAgenda) {
    this._agenda = parsedAgenda;
    // Per-item state
    this._itemStates = new Map();
    for (const item of parsedAgenda.items) {
      this._itemStates.set(item.number, {
        ...item,
        status: "pending",
        matched_topics: [],
        last_matched_at: null,
      });
    }
    this._currentItem = null;
  }

  /**
   * Align a batch of extracted topics against agenda items.
   * Returns agenda events: { type, item, ... }
   */
  align(extractedTopics, currentTimestamp) {
    const events = [];
    const threshold = config.AGENDA_MATCH_THRESHOLD / 100;
    const itemTitles = this._agenda.items.map((i) => i.title.toLowerCase());

    for (const topic of extractedTopics) {
      const best = stringSimilarity.findBestMatch(
        topic.label.toLowerCase(),
        itemTitles
      );

      if (best.bestMatch.rating < threshold) continue;

      const matchedItem = this._agenda.items[best.bestMatchIndex];
      const state = this._itemStates.get(matchedItem.number);

      if (!state.matched_topics.includes(topic.label)) {
        state.matched_topics.push(topic.label);
      }
      state.last_matched_at = currentTimestamp;

      if (state.status === "pending") {
        state.status = "active";
        events.push({ type: "agenda.item_started", item: { ...state } });
      }

      // Track current item
      if (this._currentItem !== matchedItem.number) {
        // Mark previous as discussed
        if (this._currentItem) {
          const prev = this._itemStates.get(this._currentItem);
          if (prev && prev.status === "active") {
            prev.status = "discussed";
          }
        }
        this._currentItem = matchedItem.number;
        events.push({ type: "agenda.item_changed", item: { ...state }, current_number: matchedItem.number });
      }
    }

    return events;
  }

  /** Get the full agenda progress snapshot. */
  getProgress() {
    const items = [...this._itemStates.values()];
    const discussed = items.filter((i) => i.status === "discussed").length;
    const active = items.filter((i) => i.status === "active").length;
    return {
      agenda_id: this._agenda.agenda_id,
      title: this._agenda.title,
      total_items: items.length,
      discussed_count: discussed,
      active_count: active,
      current_item: this._currentItem,
      items,
    };
  }
}

module.exports = { AgendaAligner };
