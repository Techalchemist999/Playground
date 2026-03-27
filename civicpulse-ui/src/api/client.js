const APP = 'townofws';
const BASE = `/api/cp/${APP}`;

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Ingest
export const ingestYouTube = (url) => request('POST', '/ingest/youtube', { url });

export const ingestUpload = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/ingest/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const ingestMic = () => request('POST', '/ingest/mic');

// Session
export const startSession = (session_id, agenda_id) =>
  request('POST', '/session/start', { session_id, agenda_id });

export const pauseSession = (id) => request('POST', `/session/${id}/pause`);
export const resumeSession = (id) => request('POST', `/session/${id}/resume`);
export const stopSession = (id) => request('POST', `/session/${id}/stop`);
export const getSessionState = (id) => request('GET', `/session/${id}/state`);
export const getTopics = (id) => request('GET', `/session/${id}/topics`);

// Agendas
export const listAgendas = () => request('GET', '/agendas');
export const getAgendaProgress = (id) => request('GET', `/session/${id}/agenda`);

// Minutes
export const generateMinutes = (id) => request('POST', `/session/${id}/generate-minutes`);
export const regenerateSection = (id, section_name) =>
  request('POST', `/session/${id}/generate-section`, { section_name });
export const saveMinutes = (id, html) => request('PUT', `/session/${id}/minutes`, { html });
export const getMinutes = (id) => request('GET', `/session/${id}/minutes`);

export const exportHtml = async (id) => {
  const res = await fetch(`${BASE}/session/${id}/export-html`);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `minutes-${id}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

// Graph
export const writeToGraph = (id) => request('POST', `/graph/write-session/${id}`);

// Clients
export const getClientsMeta = () => fetch('/api/cp/clients-meta').then(r => r.json());
