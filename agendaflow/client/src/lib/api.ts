const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export const api = {
  getMeetings: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/meetings${qs}`);
  },
  getMeeting: (id: number) => request<any>(`/meetings/${id}`),
  createMeeting: (data: any) => request<any>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  updateMeeting: (id: number, data: any) => request<any>(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMeeting: (id: number) => request<void>(`/meetings/${id}`, { method: 'DELETE' }),
  publishMeeting: (id: number) => request<any>(`/meetings/${id}/publish`, { method: 'PUT' }),

  getAgendaItems: (meetingId: number) => request<any[]>(`/meetings/${meetingId}/agenda-items`),
  createAgendaItem: (meetingId: number, data: any) => request<any>(`/meetings/${meetingId}/agenda-items`, { method: 'POST', body: JSON.stringify(data) }),
  updateAgendaItem: (id: number, data: any) => request<any>(`/agenda-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgendaItem: (id: number) => request<void>(`/agenda-items/${id}`, { method: 'DELETE' }),
  reorderItems: (items: { id: number; sort_order: number }[]) => request<void>('/agenda-items/reorder', { method: 'POST', body: JSON.stringify({ items }) }),

  getBylaws: (meetingId: number) => request<any[]>(`/meetings/${meetingId}/bylaws`),
  createBylaw: (meetingId: number, data: any) => request<any>(`/meetings/${meetingId}/bylaws`, { method: 'POST', body: JSON.stringify(data) }),
  updateBylaw: (id: number, data: any) => request<any>(`/bylaws/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getResolutions: (meetingId: number) => request<any[]>(`/meetings/${meetingId}/resolutions`),
  createResolution: (meetingId: number, data: any) => request<any>(`/meetings/${meetingId}/resolutions`, { method: 'POST', body: JSON.stringify(data) }),
  updateResolution: (id: number, data: any) => request<any>(`/resolutions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getDelegations: (meetingId: number) => request<any[]>(`/meetings/${meetingId}/delegations`),
  createDelegation: (meetingId: number, data: any) => request<any>(`/meetings/${meetingId}/delegations`, { method: 'POST', body: JSON.stringify(data) }),
  updateDelegation: (id: number, data: any) => request<any>(`/delegations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  search: (q: string) => request<any>(`/search?q=${encodeURIComponent(q)}`),
  getPendingItems: () => request<any[]>('/items/pending'),

  uploadAttachment: async (itemId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/agenda-items/${itemId}/attachments`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
