// ---------------------------------------------------------------------------
// services/td_bridge.js — CivicPulse → Topic Disambiguation adapter
//
// Translates CivicPulse's topic format to TD-compatible structures so both
// systems can share the same Neo4j knowledge graph.
// ---------------------------------------------------------------------------

// CivicPulse category → TD { category, subcategory }
const CATEGORY_MAP = {
  bylaw: { category: "Governance", subcategory: "Bylaws" },
  department: { category: "Government", subcategory: "Municipal Departments" },
  location: { category: "Geography", subcategory: "Local Infrastructure" },
  budget: { category: "Finance", subcategory: "Municipal Budget" },
  motion: { category: "Governance", subcategory: "Council Motions" },
  policy: { category: "Governance", subcategory: "Municipal Policies" },
  program: { category: "Services", subcategory: "Municipal Programs" },
  organization: { category: "Government", subcategory: "Organizations" },
  person: { category: "People", subcategory: "Municipal Officials" },
  topic: { category: "General", subcategory: "Municipal Topics" },
};

/** Convert a LiveTopic to a TD-compatible TopicNode dict. */
function topicToTopicNode(liveTopic) {
  const mapped = CATEGORY_MAP[liveTopic.category] || CATEGORY_MAP.topic;
  return {
    uid: liveTopic.uid || `${liveTopic.category}::${liveTopic.normalized_id}`,
    label: liveTopic.label,
    category: mapped.category,
    subcategory: mapped.subcategory,
    confidence: liveTopic.confidence,
    mention_count: liveTopic.mention_count,
  };
}

/** Convert a LiveTopic to a TD-compatible ClusterResult dict. */
function topicToClusterResult(liveTopic) {
  const node = topicToTopicNode(liveTopic);
  return {
    cluster_id: node.uid,
    representative_label: node.label,
    category: node.category,
    subcategory: node.subcategory,
    member_count: node.mention_count,
    confidence: node.confidence,
  };
}

/** Export all session topics as a TD ExtractionResult. */
function exportSessionTopics(sessionState) {
  return {
    document_id: `civicpulse:${sessionState.session_id}`,
    source: sessionState.source,
    extracted_at: new Date().toISOString(),
    topics: sessionState.topics.map(topicToTopicNode),
    clusters: sessionState.topics.map(topicToClusterResult),
  };
}

module.exports = { topicToTopicNode, topicToClusterResult, exportSessionTopics, CATEGORY_MAP };
