import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const VOTE_COLORS: Record<string, { bg: string; fg: string }> = {
  carried: { bg: '#f0fdf4', fg: '#16a34a' },
  carried_unanimously: { bg: '#f0fdf4', fg: '#16a34a' },
  defeated: { bg: '#fef2f2', fg: '#dc2626' },
  tied: { bg: '#fffbeb', fg: '#d97706' },
};

export default function ResolutionsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Resolutions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Council resolutions for 2026</p>
        </div>
      </div>
      <div className="glass-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="glass-header">
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Resolution #</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Text</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Moved / Seconded</th>
              <th className="text-left px-4 py-2.5 text-[8px] font-bold tracking-widest uppercase text-slate-400">Result</th>
            </tr>
          </thead>
          <tbody>
            {[
              { num: '2026-001', text: 'THAT Council awards the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.', moved: 'Cllr Rabel', seconded: 'Cllr Johnston', result: 'carried_unanimously' },
              { num: '2026-002', text: 'THAT Council adopts the minutes of the March 11, 2026 regular meeting as presented.', moved: 'Cllr Wall', seconded: 'Cllr Woodill', result: 'carried' },
              { num: '2026-003', text: 'THAT Council approves the budget amendment to increase the roads maintenance allocation by $25,000.', moved: 'Cllr Johnston', seconded: 'Cllr Rabel', result: 'defeated' },
            ].map(r => {
              const vc = VOTE_COLORS[r.result] || VOTE_COLORS.carried;
              return (
                <tr key={r.num} className="border-t border-black/[0.03] hover:bg-white/20">
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{r.num}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-md">{r.text}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.moved} / {r.seconded}</td>
                  <td className="px-4 py-3">
                    <span className="text-[8px] font-bold px-2 py-1 rounded uppercase"
                      style={{ background: vc.bg, color: vc.fg }}>{r.result.replace('_', ' ')}</span>
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
