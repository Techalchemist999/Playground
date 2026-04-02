import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'search' | 'pending'>('search');
  const navigate = useNavigate();

  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2,
  });

  const { data: pendingItems = [] } = useQuery({
    queryKey: ['pending-items'],
    queryFn: () => api.getPendingItems(),
    enabled: tab === 'pending',
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-extrabold text-slate-800 mb-4">Search & Pending Items</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['search', 'pending'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? 'bg-white/60 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/30'
            }`}>
            {t === 'search' ? 'Search' : 'Pending Items (Tabled/Deferred)'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
          <div className="mb-4">
            <input className="glass-input w-full text-sm" placeholder="Search meetings, agenda items, bylaws, resolutions..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          {results && (
            <div className="glass-panel p-4">
              {results.meetings?.length > 0 && (
                <div className="mb-4">
                  <div className="text-[8px] font-bold tracking-widest uppercase text-slate-400 mb-2">Meetings</div>
                  {results.meetings.map((m: any) => (
                    <div key={m.id} onClick={() => navigate(`/builder/${m.id}`)}
                      className="px-3 py-2 hover:bg-white/30 rounded cursor-pointer">
                      <div className="text-xs font-semibold text-slate-700">{m.title}</div>
                      <div className="text-[9px] text-slate-400">{m.date} · {m.type}</div>
                    </div>
                  ))}
                </div>
              )}
              {results.items?.length > 0 && (
                <div>
                  <div className="text-[8px] font-bold tracking-widest uppercase text-slate-400 mb-2">Agenda Items</div>
                  {results.items.map((i: any) => (
                    <div key={i.id} onClick={() => navigate(`/builder/${i.meeting_id}`)}
                      className="px-3 py-2 hover:bg-white/30 rounded cursor-pointer">
                      <div className="text-xs font-semibold text-slate-700">{i.title}</div>
                      <div className="text-[9px] text-slate-400">{i.section} · {i.type}</div>
                    </div>
                  ))}
                </div>
              )}
              {!results.meetings?.length && !results.items?.length && query.length >= 2 && (
                <div className="text-sm text-slate-400 text-center py-4">No results found</div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'pending' && (
        <div className="glass-panel overflow-hidden">
          <div className="glass-header px-4 py-2.5">
            <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-600">
              Tabled & Deferred Items Across All Meetings
            </h3>
          </div>
          {pendingItems.length === 0 ? (
            <div className="p-6 text-sm text-slate-400 text-center">No pending items</div>
          ) : (
            pendingItems.map((item: any) => (
              <div key={item.id}
                className="px-4 py-3 border-b border-black/[0.03] hover:bg-white/20 cursor-pointer"
                onClick={() => navigate(`/builder/${item.meeting_id}`)}>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      background: item.status === 'tabled' ? '#fff7ed' : '#fffbeb',
                      color: item.status === 'tabled' ? '#ea580c' : '#d97706',
                    }}>
                    {item.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{item.title}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">From: {item.meeting_title || 'Unknown meeting'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
