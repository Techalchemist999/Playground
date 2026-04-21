// Summarize / rephrase a block of discussion text.
// - If VITE_ANTHROPIC_API_KEY is set in .env, calls the Anthropic Messages API
//   (browser-direct) and asks for a concise minutes-style summary.
// - Otherwise falls back to a deterministic sentence-trim stub so the UX still
//   works offline.
//
// `seed` cycles 0, 1, 2, … on repeated clicks so each attempt is a new variant.

const MODEL = 'claude-haiku-4-5-20251001';

async function anthropicSummarize(text, seed) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) throw new Error('no-key');

  const prompt =
    `You are helping draft Canadian municipal meeting minutes. Rewrite the ` +
    `discussion text below as a concise summary suitable for official minutes. ` +
    `Preserve every fact, name, dollar amount, date, and decision. Use formal ` +
    `past-tense minute-taking style. Return ONLY the summary — no preamble, ` +
    `no commentary, no quotation marks.\n\n` +
    `This is attempt #${seed + 1}; try a noticeably different phrasing or ` +
    `emphasis than a typical first draft.\n\n` +
    `Text:\n---\n${text}\n---`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return (data.content?.[0]?.text || '').trim();
}

function stubSummarize(text, seed) {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return text.trim();

  const n = sentences.length;
  const keep = Math.max(1, Math.ceil(n * 0.6));
  const midStart = Math.max(0, Math.floor((n - keep) / 2));

  const variants = [
    sentences.slice(0, keep).join(' '),
    sentences.slice(n - keep).join(' '),
    keep >= 2 ? [sentences[0], sentences[n - 1]].join(' ') : sentences[0],
    sentences.slice(midStart, midStart + keep).join(' '),
  ];
  return variants[seed % variants.length];
}

export async function summarizeText(text, { seed = 0 } = {}) {
  const clean = (text || '').trim();
  if (!clean) return '';
  try {
    return await anthropicSummarize(clean, seed);
  } catch (err) {
    if (err.message !== 'no-key') {
      console.warn('[summarize] LLM call failed, using stub:', err.message);
    }
    return stubSummarize(clean, seed);
  }
}
