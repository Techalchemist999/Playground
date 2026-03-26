// ---------------------------------------------------------------------------
// services/graph_writer.js — Batched Neo4j writes (simulated)
//
// Production: uses UNWIND Cypher queries to merge Topic nodes, Document
// nodes, MENTIONED_IN and CO_OCCURS relationships.
//
// PoC: stores everything in-memory and logs what would be written.
// ---------------------------------------------------------------------------

const { v4: uuid } = require("uuid");

class GraphWriter {
  constructor(registry) {
    this._registry = registry;
    // In-memory graph store
    this._documents = new Map(); // record_id → document data
    this._topicNodes = new Map(); // uid → topic data
    this._mentionedIn = []; // { topic_uid, record_id, ...props }
    this._coOccurs = []; // { topic_a, topic_b, weight }
  }

  /**
   * Write a complete session to the graph.
   * In production: batched UNWIND Cypher queries.
   */
  async writeSession(session_id, sessionState, client) {
    const record_id = `civicpulse:${session_id}`;

    // 1. Merge Document node
    this._documents.set(record_id, {
      record_id,
      title: `CivicPulse Session ${session_id}`,
      source: sessionState.source,
      client,
      created_at: sessionState.created_at,
      minutes_html: sessionState.minutes || null,
    });

    // 2. Merge Topic nodes + MENTIONED_IN relationships
    const topicUids = [];
    for (const topic of sessionState.topics) {
      const uid = topic.uid || `${topic.category}::${topic.normalized_id}`;
      topicUids.push(uid);

      this._topicNodes.set(uid, {
        uid,
        label: topic.label,
        category: topic.category,
        client,
      });

      this._mentionedIn.push({
        topic_uid: uid,
        record_id,
        span_text: topic.label,
        context_summary: topic.summary || "",
        tag_category: topic.category,
        confidence: topic.confidence,
      });

      // Register in GraphRegistry
      this._registry.register(uid, topic.label, topic.category);
    }

    // 3. CO_OCCURS edges (all pairs within session)
    for (let i = 0; i < topicUids.length; i++) {
      for (let j = i + 1; j < topicUids.length; j++) {
        this._coOccurs.push({
          topic_a: topicUids[i],
          topic_b: topicUids[j],
          weight: 1,
        });
      }
    }

    console.log(`[GraphWriter] Wrote session ${session_id}: ${topicUids.length} topics, ${this._coOccurs.length} co-occurrence edges`);
    return { record_id, topic_count: topicUids.length };
  }

  /** Add a single topic to the graph. */
  async addTopic(uid, label, category, client) {
    this._topicNodes.set(uid, { uid, label, category, client });
    this._registry.register(uid, label, category);
    return { uid };
  }

  /** List all persisted sessions. */
  getSessions(client) {
    return [...this._documents.values()]
      .filter((d) => !client || d.client === client)
      .map((d) => ({
        record_id: d.record_id,
        title: d.title,
        source: d.source,
        created_at: d.created_at,
        has_minutes: !!d.minutes_html,
      }));
  }

  /** Delete a session and its relationships. */
  deleteSession(record_id) {
    this._documents.delete(record_id);
    this._mentionedIn = this._mentionedIn.filter((r) => r.record_id !== record_id);
    // In production: also clean up orphaned topic nodes
    return { deleted: true };
  }

  /** Delete a single topic from a session. */
  deleteTopicFromSession(record_id, topic_uid) {
    this._mentionedIn = this._mentionedIn.filter(
      (r) => !(r.record_id === record_id && r.topic_uid === topic_uid)
    );
    return { deleted: true };
  }

  /** Update minutes HTML on a document node. */
  updateMinutes(record_id, minutesHtml) {
    const doc = this._documents.get(record_id);
    if (doc) doc.minutes_html = minutesHtml;
    return { updated: !!doc };
  }
}

module.exports = { GraphWriter };
