import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const READING_LABELS: Record<number, string> = { 1: '1st Reading', 2: '2nd Reading', 3: '3rd Reading', 4: 'Adoption' };
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  active: { bg: '#eff6ff', fg: '#2563eb' },
  deferred: { bg: '#fffbeb', fg: '#d97706' },
  tabled: { bg: '#fff7ed', fg: '#ea580c' },
  defeated: { bg: '#fef2f2', fg: '#dc2626' },
  adopted: { bg: '#f0fdf4', fg: '#16a34a' },
};

export default function BylawsPage() {
  const { data: meetings = [] } = useQuery({ queryKey: ['meetings'], queryFn: () => api.getMeetings() });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Bylaw Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track bylaw readings across meetings</p>
        </div>
      </div>
      <div className="glass-panel p-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/5">
              <th className="text-left px-3 py-2 text-[8px] font-bold tracking-widest uppercase text-slate-400">Bylaw #</th>
              <th className="text-left px-3 py-2 text-[8px] font-bold tracking-widest uppercase text-slate-400">Title</th>
              <th className="text-left px-3 py-2 text-[8px] font-bold tracking-widest uppercase text-slate-400">Reading</th>
              <th className="text-left px-3 py-2 text-[8px] font-bold tracking-widest uppercase text-slate-400">Status</th>
              <th className="text-left px-3 py-2 text-[8px] font-bold tracking-widest uppercase text-slate-400">Progress</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder rows from seed data */}
            {[
              { num: '1021', title: 'Noise Control Amendment Bylaw', reading: 3, status: 'active' },
              { num: '1022', title: 'Zoning Amendment — 102 Railway Ave', reading: 1, status: 'active' },
            ].map(b => {
              const st = STATUS_COLORS[b.status] || STATUS_COLORS.active;
              return (
                <tr key={b.num} className="border-b border-black/[0.03] hover:bg-white/20 transition-all">
                  <td className="px-3 py-3 text-xs font-bold text-slate-700">{b.num}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{b.title}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{READING_LABELS[b.reading]}</td>
                  <td className="px-3 py-3">
                    <span className="text-[8px] font-bold px-2 py-1 rounded uppercase"
                      style={{ background: st.bg, color: st.fg }}>{b.status}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(r => (
                        <div key={r} className="w-6 h-1.5 rounded-full"
                          style={{ background: r <= b.reading ? '#475569' : '#e2e8f0' }} />
                      ))}
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
