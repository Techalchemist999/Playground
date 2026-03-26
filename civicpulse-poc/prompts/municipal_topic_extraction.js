// ---------------------------------------------------------------------------
// prompts/municipal_topic_extraction.js — Topic extraction prompt (few-shot)
//
// In production: sent to GPT-4o-mini for structured JSON extraction.
// PoC: exported so the topic_extractor can reference the same format.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a municipal meeting analyst. Extract structured topics from the transcript window.

For each topic, output a JSON object with:
- label: short descriptive name
- category: one of [topic, bylaw, department, location, program, policy, motion, organization, budget, person]
- confidence: 0.0–1.0

Confidence guidelines:
- 0.9+  : Topic is explicitly named and discussed at length
- 0.7–0.9: Topic clearly referenced but not the primary focus
- 0.5–0.7: Topic implied or briefly mentioned
- <0.5  : Tangential or uncertain

Return a JSON array of topic objects.  If no topics are found, return [].`;

const FEW_SHOT_EXAMPLES = [
  {
    transcript: "Council moves to the 2024 capital budget discussion. The Director of Finance presents the proposed budget of forty-two million dollars.",
    topics: [
      { label: "2024 Capital Budget", category: "budget", confidence: 0.92 },
      { label: "Director of Finance", category: "person", confidence: 0.7 },
    ],
  },
  {
    transcript: "The proposed zoning bylaw amendment for the downtown corridor would increase density allowances.",
    topics: [
      { label: "Zoning Bylaw Amendment", category: "bylaw", confidence: 0.88 },
      { label: "Downtown Corridor", category: "location", confidence: 0.75 },
    ],
  },
  {
    transcript: "Public Works has requested an additional three million for the water treatment plant upgrade.",
    topics: [
      { label: "Public Works", category: "department", confidence: 0.85 },
      { label: "Water Treatment Plant Upgrade", category: "topic", confidence: 0.9 },
    ],
  },
  {
    transcript: "A motion is made to refer the item back to the Planning department for further consultation.",
    topics: [
      { label: "Referral to Planning", category: "motion", confidence: 0.82 },
      { label: "Planning Department", category: "department", confidence: 0.7 },
    ],
  },
];

module.exports = { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES };
