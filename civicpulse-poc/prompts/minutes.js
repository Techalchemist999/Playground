// ---------------------------------------------------------------------------
// prompts/minutes.js — Full minutes generation (11 sections)
//
// Standard format following West Kelowna City Council style.
// Resolution numbering: C###/YY format.
// ---------------------------------------------------------------------------

const MINUTES_SECTIONS = [
  "Call to Order",
  "Approval of Agenda",
  "Adoption of Minutes",
  "Delegations",
  "Reports",
  "Bylaws",
  "New Business",
  "Unfinished Business",
  "Notices of Motion",
  "Question Period",
  "Adjournment",
];

const MINUTES_SYSTEM_PROMPT = `You are a professional municipal clerk generating formal meeting minutes.

Follow the West Kelowna City Council style:
- Use resolution numbering format C###/YY (e.g., C001/24)
- Use formal parliamentary language: "MOVED by Councillor X, SECONDED by Councillor Y"
- Include "THAT" clauses for motions
- Record votes as "CARRIED" or "DEFEATED"
- Use past tense throughout

Generate the minutes in HTML format with the following 11 sections:
${MINUTES_SECTIONS.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Base the content on the provided transcript and detected topics.`;

const SECTION_REGEN_PROMPT = `You are a professional municipal clerk. Regenerate ONLY the following section of the meeting minutes based on the transcript and topic data provided. Output HTML for this single section only.`;

module.exports = { MINUTES_SECTIONS, MINUTES_SYSTEM_PROMPT, SECTION_REGEN_PROMPT };
