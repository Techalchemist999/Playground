// ---------------------------------------------------------------------------
// schemas/agenda_schemas.js — AgendaItem, ParsedAgenda
// ---------------------------------------------------------------------------

function createAgendaItem({ number, title, description = "", sub_items = [] }) {
  return { number, title, description, sub_items, status: "pending" };
}

function createParsedAgenda({ agenda_id, title, date, items = [] }) {
  return {
    agenda_id,
    title,
    date,
    items: items.map(createAgendaItem),
  };
}

module.exports = { createAgendaItem, createParsedAgenda };
