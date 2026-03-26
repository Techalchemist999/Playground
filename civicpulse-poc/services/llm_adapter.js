// ---------------------------------------------------------------------------
// services/llm_adapter.js — LLM invocation with fallback
//
// PoC: simulates LLM calls.  In production this wraps Azure OpenAI via
// either a direct client or the AI_Services_Load_Balancer.
// ---------------------------------------------------------------------------

/**
 * Invoke the LLM (simulated in PoC).
 *
 * @param {string} model   - Model name (e.g. "gpt-4o-mini")
 * @param {Array}  messages - Chat-completion messages [{role, content}]
 * @returns {string|null} The assistant reply, or null on failure.
 */
async function invokeLLM(model, messages) {
  // In a real deployment this would call Azure OpenAI.
  // The PoC returns null so callers fall back to their simulation logic.
  console.log(`[llm_adapter] invokeLLM called (model=${model}) — returning null (PoC stub)`);
  return null;
}

module.exports = { invokeLLM };
