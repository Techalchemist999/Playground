// ---------------------------------------------------------------------------
// services/agenda_fetcher.js — Fetch agendas from CliDE backend (simulated)
//
// Production: HTTP calls to CliDE backend /agendas/{client}/list and
// /agendas/{client}/{id} endpoints.
//
// PoC: returns pre-built sample agendas — Village of Pouce Coupe format.
// ---------------------------------------------------------------------------

const { createParsedAgenda } = require("../schemas/agenda_schemas");

const SAMPLE_AGENDAS = [
  createParsedAgenda({
    agenda_id: "agenda-2025-08-27",
    title: "Regular Council Meeting — August 27, 2025",
    date: "2025-08-27",
    items: [
      { number: "1", title: "Call to Order" },
      { number: "2", title: "Land Acknowledgement" },
      { number: "3", title: "Adoption of Agenda" },
      { number: "4", title: "Adoption of Minutes", description: "August 13 COTW, August 13 SCM, July 31 SCM, July 23 RCM, May 28 RCM, April 22 RCM" },
      { number: "5", title: "Introduction of Late Items" },
      { number: "6", title: "Public Hearing" },
      { number: "7", title: "Delegations", description: "Mr. Tim Doonan — Hart Hotel and Taxes for Property Purchased at Tax Sale" },
      { number: "8", title: "Unfinished Business and Business Arising from the Minutes" },
      { number: "8.1", title: "Pouce Coupe Seniors Support Services MOUs", description: "Better at Home programming agreements" },
      { number: "9", title: "New Business" },
      { number: "9.1", title: "Temporary Use Permit No. TUP2025-01 — LMV Energy Services", description: "5601 52 Street — tented structure and sea can container" },
      { number: "9.2", title: "Notification of Contract Award — Paving" },
      { number: "10", title: "Correspondence" },
      { number: "11", title: "Resolutions" },
      { number: "11.1", title: "UBCM Strategic Priorities Fund — Capital Stream (Fire Truck)" },
      { number: "11.2", title: "UBCM Strategic Priorities Fund — Capacity Building Stream" },
      { number: "11.3", title: "NDIT Community Places Grant Application" },
      { number: "12", title: "Bylaws" },
      { number: "13", title: "Administration Reports" },
      { number: "14", title: "Reports" },
      { number: "15", title: "Question Period" },
      { number: "16", title: "In-Camera" },
      { number: "17", title: "Rise and Report" },
      { number: "18", title: "Adjournment" },
    ],
  }),
  createParsedAgenda({
    agenda_id: "agenda-2025-01-22",
    title: "Regular Council Meeting — January 22, 2025",
    date: "2025-01-22",
    items: [
      { number: "1", title: "Call to Order" },
      { number: "2", title: "Land Acknowledgement" },
      { number: "3", title: "Adoption of Agenda" },
      { number: "4", title: "Adoption of Minutes", description: "December 18, 2024 RCM Minutes" },
      { number: "5", title: "Introduction of Late Items" },
      { number: "6", title: "Public Hearing" },
      { number: "7", title: "Delegations" },
      { number: "8", title: "Unfinished Business and Business Arising from the Minutes" },
      { number: "8.1", title: "Council Portfolio Liaison Letters & Internal Committee Overview" },
      { number: "8.2", title: "Water Service Increase — Drafted Resident Notice" },
      { number: "9", title: "New Business" },
      { number: "9.1", title: "Family Day Community Event Proposal — VoPC & Library", description: "Skating, tobogganing, snow art, bonfire, hot chocolate" },
      { number: "10", title: "Correspondence" },
      { number: "10.1", title: "Bylaw Officer Report" },
      { number: "10.2", title: "Proclamation Request — BC Epilepsy Society (Purple Day)" },
      { number: "10.3", title: "ICBA Letter — Protecting Taxpayers from Overspending" },
      { number: "11", title: "Resolutions" },
      { number: "12", title: "Bylaws" },
      { number: "13", title: "Administration Reports" },
      { number: "13.1", title: "CAO Report" },
      { number: "14", title: "Reports" },
      { number: "15", title: "Question Period" },
      { number: "16", title: "In-Camera", description: "Section 90(1)(k) — preliminary municipal service negotiations" },
      { number: "17", title: "Rise and Report" },
      { number: "18", title: "Adjournment" },
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
