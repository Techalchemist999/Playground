import { useState } from 'react';

export default function MinutesPage() {
  const [selectedMeeting] = useState('Regular Council — April 2, 2026');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Minutes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Draft and manage council meeting minutes</p>
        </div>
        <div className="flex gap-2">
          <button className="glass-btn-secondary text-xs">Export Word</button>
          <button className="glass-btn-primary text-xs">Save Draft</button>
        </div>
      </div>

      {/* Side by side: Agenda outline + Minutes editor */}
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        {/* Left: Agenda outline */}
        <div className="w-[35%] glass-panel flex flex-col overflow-hidden flex-shrink-0">
          <div className="glass-header px-4 py-2.5">
            <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-600">Agenda Outline</h3>
            <div className="text-[9px] text-slate-400 mt-0.5">{selectedMeeting}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {[
              { n: 1, title: 'Call to Order', done: true },
              { n: 2, title: 'Adoption of Agenda', done: true },
              { n: 3, title: 'Adoption of Minutes — March 11', done: true },
              { n: 4, title: 'Delegations — Northern Landscapes', done: true },
              { n: 5, title: 'Public Hearing — Bylaw 1021', done: true },
              { n: 6, title: 'CAO Report', done: false },
              { n: 7, title: 'Financial Report — Q1', done: false },
              { n: 8, title: 'New Business', done: false },
              { n: 9, title: 'Correspondence', done: false },
              { n: 10, title: 'In-Camera', done: false },
              { n: 11, title: 'Adjournment', done: false },
            ].map(item => (
              <div key={item.n}
                className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-[10px] ${
                  item.done ? 'text-slate-300' : 'text-slate-600 font-semibold hover:bg-white/30'
                }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${
                  item.done ? 'bg-slate-100 text-slate-300 line-through' : 'bg-white/40 border border-black/5'
                }`}>{item.n}</div>
                <span className={item.done ? 'line-through' : ''}>{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Minutes editor */}
        <div className="flex-1 glass-panel flex flex-col overflow-hidden">
          <div className="glass-header px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-slate-600">Minutes Editor</h3>
            <div className="flex gap-2">
              <span className="text-[7px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-600 border border-amber-200 uppercase">Draft</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="text-center mb-6">
              <div className="text-sm font-bold text-slate-700">MINUTES OF THE REGULAR MEETING OF COUNCIL</div>
              <div className="text-xs text-slate-500 mt-1">April 2, 2026 — 7:00 PM — Council Chambers</div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">1. Call to Order</div>
                <textarea className="glass-input w-full text-xs" rows={2}
                  defaultValue="Mayor Veach called the meeting to order at 7:00 PM." />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">2. Adoption of Agenda</div>
                <textarea className="glass-input w-full text-xs" rows={2}
                  defaultValue="MOVED by Cllr Wall, SECONDED by Cllr Johnston, THAT Council adopts the agenda as presented. CARRIED." />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">3. Adoption of Minutes</div>
                <textarea className="glass-input w-full text-xs" rows={2}
                  defaultValue="MOVED by Cllr Woodill, SECONDED by Cllr Rabel, THAT Council adopts the minutes of the March 11, 2026 regular meeting as presented. CARRIED." />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">4. Delegations</div>
                <textarea className="glass-input w-full text-xs" rows={3}
                  defaultValue="" placeholder="Enter minutes for this section..." />
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between">
            <div className="text-[9px] text-slate-400">Status: Draft · Last saved: —</div>
            <div className="flex gap-2">
              <button className="glass-btn-secondary text-[10px]">Submit for Review</button>
              <button className="glass-btn-primary text-[10px]">Save Draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
