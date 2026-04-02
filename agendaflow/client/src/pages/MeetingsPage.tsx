import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  special: 'Special',
  closed: 'Closed (In-Camera)',
  committee_of_whole: 'Committee of the Whole',
};

const STATUS_STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  draft: { bg: '#f1f5f9', fg: '#64748b', border: '#e2e8f0' },
  published: { bg: '#eff6ff', fg: '#2563eb', border: '#bfdbfe' },
  in_progress: { bg: '#f0fdf4', fg: '#16a34a', border: '#bbf7d0' },
  completed: { bg: '#f8fafc', fg: '#475569', border: '#e2e8f0' },
  cancelled: { bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' },
};

export default function MeetingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    type: 'regular', title: '', date: '', time: '19:00', location: 'Council Chambers',
    quorum_required: 3, purpose: '',
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings', filter],
    queryFn: () => api.getMeetings(Object.fromEntries(Object.entries(filter).filter(([_, v]) => v))),
  });

  const createMeeting = useMutation({
    mutationFn: (data: any) => api.createMeeting(data),
    onSuccess: (m: any) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowCreate(false);
      navigate(`/builder/${m.id}`);
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: (id: number) => api.deleteMeeting(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 -tracking-wide">Meetings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage council meetings and their agendas</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="glass-btn-primary flex items-center gap-2 text-sm">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Meeting
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-panel p-5 mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Create New Meeting</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Type</label>
              <select className="glass-input w-full text-xs" value={newMeeting.type}
                onChange={e => setNewMeeting({ ...newMeeting, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Title</label>
              <input className="glass-input w-full text-xs" value={newMeeting.title}
                onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                placeholder="Regular Council Meeting" />
            </div>
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Date</label>
              <input className="glass-input w-full text-xs" type="date" value={newMeeting.date}
                onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })} />
            </div>
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Time</label>
              <input className="glass-input w-full text-xs" type="time" value={newMeeting.time}
                onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })} />
            </div>
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Location</label>
              <input className="glass-input w-full text-xs" value={newMeeting.location}
                onChange={e => setNewMeeting({ ...newMeeting, location: e.target.value })} />
            </div>
            <div>
              <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Quorum Required</label>
              <input className="glass-input w-full text-xs" type="number" min="1" value={newMeeting.quorum_required}
                onChange={e => setNewMeeting({ ...newMeeting, quorum_required: Number(e.target.value) })} />
            </div>
            {newMeeting.type === 'special' && (
              <div className="col-span-3">
                <label className="text-[8px] font-bold tracking-widest uppercase text-slate-400 block mb-1">Purpose (required for special meetings)</label>
                <input className="glass-input w-full text-xs" value={newMeeting.purpose}
                  onChange={e => setNewMeeting({ ...newMeeting, purpose: e.target.value })}
                  placeholder="Budget review and approval" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="glass-btn-primary text-xs" onClick={() => createMeeting.mutate(newMeeting)}>
              Create Meeting
            </button>
            <button className="glass-btn-secondary text-xs" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select className="glass-input text-xs" value={filter.type}
          onChange={e => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="glass-input text-xs" value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Meetings table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="glass-header">
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Meeting</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Type</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Date</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Status</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Items</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
            ) : meetings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No meetings found</td></tr>
            ) : meetings.map((m: any) => {
              const st = STATUS_STYLES[m.status] || STATUS_STYLES.draft;
              return (
                <tr key={m.id} className="border-t border-black/[0.03] hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => navigate(`/builder/${m.id}`)}>
                  <td className="px-4 py-3">
                    <div className="text-xs font-semibold text-slate-700">{m.title}</div>
                    <div className="text-[9px] text-slate-400">{m.location}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{TYPE_LABELS[m.type] || m.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{m.date} {m.time}</td>
                  <td className="px-4 py-3">
                    <span className="text-[8px] font-bold px-2 py-1 rounded uppercase"
                      style={{ background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{m.item_count ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button className="text-[9px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-white/30"
                        onClick={() => navigate(`/builder/${m.id}`)}>
                        Edit
                      </button>
                      {m.status === 'draft' && (
                        <button className="text-[9px] text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50/50"
                          onClick={() => { if (confirm('Delete this meeting?')) deleteMeeting.mutate(m.id); }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
