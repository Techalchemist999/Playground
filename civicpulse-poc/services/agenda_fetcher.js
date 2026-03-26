// ---------------------------------------------------------------------------
// services/agenda_fetcher.js — Fetch agendas from CliDE backend (simulated)
//
// Production: HTTP calls to CliDE backend /agendas/{client}/list and
// /agendas/{client}/{id} endpoints.
//
// PoC: returns pre-built sample agendas.
// ---------------------------------------------------------------------------

const { createParsedAgenda } = require("../schemas/agenda_schemas");

const SAMPLE_AGENDAS = [
  createParsedAgenda({
    agenda_id: "agenda-2024-03-15",
    title: "Regular Council Meeting — March 15, 2024",
    date: "2024-03-15",
    items: [
      { number: "1", title: "Call to Order" },
      { number: "2", title: "Approval of Agenda" },
      { number: "3", title: "Adoption of Minutes from February Meeting" },
      { number: "4", title: "Delegations — Public Input on Zoning Bylaw" },
      { number: "5", title: "2024 Capital Budget Approval", description: "Finance department presentation and vote" },
      { number: "6", title: "Zoning Bylaw Amendment — Downtown Corridor", description: "Density increase proposal" },
      { number: "7", title: "Water Treatment Plant Upgrade Report" },
      { number: "8", title: "Community Centre Renovation Proposal" },
      { number: "9", title: "Environmental Advisory Committee Report" },
      { number: "10", title: "New Business" },
      { number: "11", title: "Question Period" },
      { number: "12", title: "Adjournment" },
    ],
  }),
  createParsedAgenda({
    agenda_id: "agenda-2024-04-05",
    title: "Special Council Meeting — April 5, 2024",
    date: "2024-04-05",
    items: [
      { number: "1", title: "Call to Order" },
      { number: "2", title: "Public Hearing — Official Community Plan Update" },
      { number: "3", title: "Transportation Master Plan Review" },
      { number: "4", title: "Adjournment" },
    ],
  }),
];

/** List available agendas for a client. */
async function listAgendas(application) {
  return SAMPLE_AGENDAS.map((a) => ({
    agenda_id: a.agenda_id,
    title: a.title,
    date: a.date,
    item_count: a.items.length,
  }));
}

/** Fetch and parse a specific agenda. */
async function fetchAgenda(application, agenda_id) {
  return SAMPLE_AGENDAS.find((a) => a.agenda_id === agenda_id) || null;
}

module.exports = { listAgendas, fetchAgenda };
