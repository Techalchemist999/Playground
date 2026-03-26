// ---------------------------------------------------------------------------
// services/topic_extractor.js — LLM-powered topic extraction from transcript
//
// Production: sends the transcript window to GPT-4o-mini with the municipal
// extraction prompt and parses the JSON response.
//
// PoC: uses keyword matching to simulate extraction so the pipeline runs
// without Azure OpenAI credentials.
// ---------------------------------------------------------------------------

const { invokeLLM } = require("./llm_adapter");
const { createExtractedTopic, TOPIC_CATEGORIES } = require("../schemas/topic_schemas");
const { SYSTEM_PROMPT } = require("../prompts/municipal_topic_extraction");

// Keyword → topic mapping for simulation
const KEYWORD_RULES = [
  { pattern: /capital budget|budget/i, label: "2024 Capital Budget", category: "budget", confidence: 0.9 },
  { pattern: /water (treatment|infrastructure)|water plant/i, label: "Water Treatment Plant Upgrade", category: "topic", confidence: 0.88 },
  { pattern: /public works/i, label: "Public Works", category: "department", confidence: 0.85 },
  { pattern: /zoning bylaw|zoning amendment/i, label: "Zoning Bylaw Amendment", category: "bylaw", confidence: 0.87 },
  { pattern: /downtown corridor|town centre/i, label: "Downtown Corridor", category: "location", confidence: 0.75 },
  { pattern: /official community plan/i, label: "Official Community Plan", category: "policy", confidence: 0.82 },
  { pattern: /planning department/i, label: "Planning Department", category: "department", confidence: 0.72 },
  { pattern: /recreation|community centre/i, label: "Community Centre Renovation", category: "program", confidence: 0.85 },
  { pattern: /environmental|tree canopy/i, label: "Urban Tree Canopy Program", category: "program", confidence: 0.78 },
  { pattern: /gas tax reserve/i, label: "Gas Tax Reserve", category: "budget", confidence: 0.7 },
  { pattern: /parking/i, label: "Parking Concerns", category: "topic", confidence: 0.65 },
  { pattern: /motion.*(?:approve|refer|moved)/i, label: "Council Motion", category: "motion", confidence: 0.8 },
  { pattern: /director of finance|finance/i, label: "Finance Department", category: "department", confidence: 0.7 },
  { pattern: /density/i, label: "Density Allowances", category: "policy", confidence: 0.72 },
  { pattern: /councillor\s+\w+/i, label: null, category: "person", confidence: 0.6 }, // dynamic label
];

/**
 * Extract topics from a transcript window.
 *
 * @param {string} transcript       - Plain text from the transcript buffer
 * @param {number} timestamp_start  - Window start (seconds)
 * @param {number} timestamp_end    - Window end (seconds)
 * @returns {Array} Array of ExtractedTopic objects
 */
async function extractTopics(transcript, timestamp_start, timestamp_end) {
  // Try real LLM first
  const llmResult = await _tryLLMExtraction(transcript, timestamp_start, timestamp_end);
  if (llmResult) return llmResult;

  // Fall back to keyword simulation
  return _simulateExtraction(transcript, timestamp_start, timestamp_end);
}

async function _tryLLMExtraction(transcript, timestamp_start, timestamp_end) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Transcript window [${timestamp_start}s – ${timestamp_end}s]:\n\n${transcript}` },
  ];
  const reply = await invokeLLM("gpt-4o-mini", messages);
  if (!reply) return null;

  try {
    const parsed = JSON.parse(reply);
    return parsed
      .filter((t) => TOPIC_CATEGORIES.includes(t.category))
      .map((t) => createExtractedTopic({ ...t, timestamp_start, timestamp_end }));
  } catch {
    return null;
  }
}

function _simulateExtraction(transcript, timestamp_start, timestamp_end) {
  const found = [];
  const seen = new Set();

  for (const rule of KEYWORD_RULES) {
    const match = transcript.match(rule.pattern);
    if (!match) continue;

    let label = rule.label;
    if (!label) {
      // Dynamic label (e.g., councillor names)
      label = match[0].trim();
    }
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());

    found.push(
      createExtractedTopic({
        label,
        category: rule.category,
        confidence: rule.confidence + (Math.random() * 0.1 - 0.05), // ±0.05 jitter
        timestamp_start,
        timestamp_end,
      })
    );
  }

  return found;
}

module.exports = { extractTopics };
