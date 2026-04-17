import { useState, useEffect, useRef } from 'react';

// Same trigger set as the old RuleAlert bottom strip — just rehomed
const RULE_TRIGGERS = [
  { id: 'motion-procedure', section: 's.11', title: 'Motion Procedure', rule: 'A motion must be moved and seconded before being debated or voted upon.', triggers: ['motion', 'moved', 'seconded', 'move that', 'i move'], categories: ['motion'] },
  { id: 'motion-amend',     section: 's.11', title: 'Amendments',       rule: 'A motion to amend must be relevant to the original motion. Only one amendment to an amendment at a time.', triggers: ['amend', 'amendment', 'friendly amendment'], categories: [] },
  { id: 'motion-table',     section: 's.11', title: 'Tabling',          rule: 'A motion to table removes the matter from discussion until Council votes to take it from the table.', triggers: ['table', 'tabled', 'defer', 'deferred', 'postpone'], categories: [] },
  { id: 'voting',           section: 's.12', title: 'Voting',           rule: 'Each Council member present must vote unless they have a conflict of interest. A tie vote is defeated.', triggers: ['vote', 'voted', 'carried', 'defeated', 'opposed', 'all in favour', 'show of hands'], categories: [] },
  { id: 'conflict',         section: 's.12', title: 'Conflict of Interest', rule: 'A member with a conflict of interest must declare it and leave the meeting during discussion and voting.', triggers: ['conflict of interest', 'declare', 'recuse', 'pecuniary'], categories: [] },
  { id: 'bylaw-reading',    section: 's.13', title: 'Bylaw Readings',   rule: 'A bylaw must receive three readings before adoption. Must not be adopted at the same meeting it receives third reading unless unanimous.', triggers: ['first reading', 'second reading', 'third reading', 'bylaw', 'reading'], categories: ['bylaw'] },
  { id: 'delegation',       section: 's.14', title: 'Delegations',      rule: 'Delegations are limited to 10 minutes unless Council grants an extension. Must submit a written request in advance.', triggers: ['delegation', 'deputation', 'presenter', 'public input', 'delegat'], categories: [] },
  { id: 'in-camera',        section: 's.15', title: 'In-Camera Meeting', rule: 'Must cite Section 90(1) of the Community Charter. No resolution or bylaw may be passed at a closed meeting.', triggers: ['in-camera', 'in camera', 'closed meeting', 'closed session', 'section 90'], categories: [] },
  { id: 'quorum',           section: 's.9',  title: 'Quorum',           rule: 'Quorum is a majority of Council members. Council cannot conduct business without quorum.', triggers: ['quorum', 'no quorum', 'lack of quorum'], categories: [] },
  { id: 'adjourn-time',     section: 's.5',  title: 'Adjournment Time', rule: 'Meetings be adjourned at 9:00 p.m. unless Council resolves to proceed beyond that time.', triggers: ['adjourn', 'adjournment', 'extend', 'past nine', 'past 9'], categories: [] },
  { id: 'agenda-late',      section: 's.10', title: 'Late Items',       rule: 'Late items may be added with unanimous consent of Council members present.', triggers: ['late item', 'add to agenda', 'introduction of late'], categories: [] },
  { id: 'point-of-order',   section: 's.9',  title: 'Point of Order',   rule: 'A point of order takes precedence over all other business. The Chair must rule on the point immediately.', triggers: ['point of order', 'order', 'out of order', 'ruling'], categories: [] },
];

export default function ProcedureAlertButton({ topics, transcript, theme, open, onOpenChange }) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const seenRef = useRef(new Set());
  const dismissedRef = useRef(new Set());

  useEffect(() => {
    const recentChunks = transcript.slice(-3);
    const recentText = recentChunks.map(c => (c.text || '').toLowerCase()).join(' ');

    const topicCategories = new Set();
    const topicLabels = [];
    topics.forEach(t => {
      topicCategories.add(t.category);
      topicLabels.push((t.label || '').toLowerCase());
    });

    const newAlerts = [];
    for (const rule of RULE_TRIGGERS) {
      if (dismissedRef.current.has(rule.id)) continue;
      let triggered = false;
      for (const kw of rule.triggers) {
        if (recentText.includes(kw)) { triggered = true; break; }
      }
      if (!triggered) {
        for (const cat of rule.categories) {
          if (topicCategories.has(cat)) { triggered = true; break; }
        }
      }
      if (!triggered) {
        for (const kw of rule.triggers) {
          if (topicLabels.some(l => l.includes(kw))) { triggered = true; break; }
        }
      }
      if (triggered && !seenRef.current.has(rule.id)) {
        seenRef.current.add(rule.id);
        newAlerts.push({ ...rule, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) });
      }
    }
    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...newAlerts, ...prev].slice(0, 8));
    }
  }, [topics, transcript]);

  function dismiss(id) {
    dismissedRef.current.add(id);
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  }

  const accent = theme?.accent || '#f59e0b';
  const hasAlerts = activeAlerts.length > 0;

  return (
    <>
      <button
        onClick={() => onOpenChange(!open)}
        title={hasAlerts ? `${activeAlerts.length} procedure alert${activeAlerts.length === 1 ? '' : 's'}` : 'Procedure alerts — none active'}
        style={{
          position: 'relative',
          height: 42,
          width: 52,
          background: hasAlerts ? `${accent}11` : '#fff',
          border: `1.5px solid ${open ? accent : hasAlerts ? `${accent}88` : '#cbd5e1'}`,
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hasAlerts ? accent : '#94a3b8',
          transition: 'all .15s',
          flexShrink: 0,
          animation: hasAlerts ? 'alertPulse 2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = accent; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = hasAlerts ? `${accent}88` : '#cbd5e1'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={hasAlerts ? accent : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {hasAlerts && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 16, height: 16, padding: '0 4px',
            background: accent, color: '#fff',
            fontSize: 9, fontWeight: 900,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 2px 6px ${accent}66`,
            border: '1.5px solid #fff',
          }}>
            {activeAlerts.length}
          </span>
        )}
        <style>{`
          @keyframes alertPulse {
            0%, 100% { box-shadow: 0 0 0 0 ${accent}44; }
            50%      { box-shadow: 0 0 0 6px ${accent}00; }
          }
        `}</style>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 72, left: 14,
          width: 320, maxWidth: 'calc(100% - 28px)',
          maxHeight: 'calc(100% - 84px)',
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          boxShadow: '0 14px 44px rgba(15,23,42,0.22)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp .2s cubic-bezier(.22,1,.36,1)',
          zIndex: 25,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 8px 8px 10px', flexShrink: 0,
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 800, color: '#64748b',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={accent} stroke={accent} strokeWidth="1.5" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Procedure Alerts
              {hasAlerts && (
                <span style={{
                  fontSize: 9, color: accent, background: `${accent}18`,
                  padding: '1px 5px', borderRadius: 4, letterSpacing: 0,
                }}>
                  {activeAlerts.length}
                </span>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              title="Close"
              style={{
                width: 20, height: 20, borderRadius: 5,
                background: 'transparent', border: '1px solid transparent',
                color: '#94a3b8', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '8px 10px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {!hasAlerts && (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', fontSize: 11, fontStyle: 'italic',
                padding: 20, textAlign: 'center',
              }}>
                No procedure alerts right now. Rules flagged from the transcript will appear here.
              </div>
            )}
            {activeAlerts.map(alert => (
              <div key={alert.id} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderLeft: `3px solid ${accent}`,
                borderRadius: '0 6px 6px 0',
                padding: '7px 9px',
                display: 'flex', gap: 6,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: '#64748b',
                      background: '#f1f5f9', border: '1px solid #cbd5e1',
                      borderRadius: 3, padding: '0 4px',
                    }}>
                      {alert.section}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>
                      {alert.title}
                    </span>
                    <span style={{ fontSize: 8, color: '#94a3b8', marginLeft: 'auto' }}>
                      {alert.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.45 }}>
                    {alert.rule}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  aria-label={`Dismiss ${alert.title}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#cbd5e1', padding: 0, flexShrink: 0,
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
