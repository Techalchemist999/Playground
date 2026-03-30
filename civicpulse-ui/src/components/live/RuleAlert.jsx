import { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../styles/tokens';

// Rule triggers: keyword patterns mapped to procedure bylaw sections
const RULE_TRIGGERS = [
  {
    id: 'motion-procedure',
    section: 's.11',
    title: 'Motion Procedure',
    rule: 'A motion must be moved and seconded before being debated or voted upon.',
    triggers: ['motion', 'moved', 'seconded', 'move that', 'i move'],
    categories: ['motion'],
  },
  {
    id: 'motion-amend',
    section: 's.11',
    title: 'Amendments',
    rule: 'A motion to amend must be relevant to the original motion. Only one amendment to an amendment at a time.',
    triggers: ['amend', 'amendment', 'friendly amendment'],
    categories: [],
  },
  {
    id: 'motion-table',
    section: 's.11',
    title: 'Tabling',
    rule: 'A motion to table removes the matter from discussion until Council votes to take it from the table.',
    triggers: ['table', 'tabled', 'defer', 'deferred', 'postpone'],
    categories: [],
  },
  {
    id: 'voting',
    section: 's.12',
    title: 'Voting',
    rule: 'Each Council member present must vote unless they have a conflict of interest. A tie vote is defeated.',
    triggers: ['vote', 'voted', 'carried', 'defeated', 'opposed', 'all in favour', 'show of hands'],
    categories: [],
  },
  {
    id: 'conflict',
    section: 's.12',
    title: 'Conflict of Interest',
    rule: 'A member with a conflict of interest must declare it and leave the meeting during discussion and voting.',
    triggers: ['conflict of interest', 'declare', 'recuse', 'pecuniary'],
    categories: [],
  },
  {
    id: 'bylaw-reading',
    section: 's.13',
    title: 'Bylaw Readings',
    rule: 'A bylaw must receive three readings before adoption. Must not be adopted at the same meeting it receives third reading unless unanimous.',
    triggers: ['first reading', 'second reading', 'third reading', 'bylaw', 'reading'],
    categories: ['bylaw'],
  },
  {
    id: 'delegation',
    section: 's.14',
    title: 'Delegations',
    rule: 'Delegations are limited to 10 minutes unless Council grants an extension. Must submit a written request in advance.',
    triggers: ['delegation', 'deputation', 'presenter', 'public input', 'delegat'],
    categories: [],
  },
  {
    id: 'in-camera',
    section: 's.15',
    title: 'In-Camera Meeting',
    rule: 'Must cite Section 90(1) of the Community Charter. No resolution or bylaw may be passed at a closed meeting.',
    triggers: ['in-camera', 'in camera', 'closed meeting', 'closed session', 'section 90'],
    categories: [],
  },
  {
    id: 'quorum',
    section: 's.9',
    title: 'Quorum',
    rule: 'Quorum is a majority of Council members. Council cannot conduct business without quorum.',
    triggers: ['quorum', 'no quorum', 'lack of quorum'],
    categories: [],
  },
  {
    id: 'adjourn-time',
    section: 's.5',
    title: 'Adjournment Time',
    rule: 'Meetings be adjourned at 9:00 p.m. unless Council resolves to proceed beyond that time.',
    triggers: ['adjourn', 'adjournment', 'extend', 'past nine', 'past 9'],
    categories: [],
  },
  {
    id: 'agenda-late',
    section: 's.10',
    title: 'Late Items',
    rule: 'Late items may be added with unanimous consent of Council members present.',
    triggers: ['late item', 'add to agenda', 'introduction of late'],
    categories: [],
  },
  {
    id: 'point-of-order',
    section: 's.9',
    title: 'Point of Order',
    rule: 'A point of order takes precedence over all other business. The Chair must rule on the point immediately.',
    triggers: ['point of order', 'order', 'out of order', 'ruling'],
    categories: [],
  },
];

export default function RuleAlert({ topics, transcript }) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const seenRef = useRef(new Set());
  const dismissedRef = useRef(new Set());

  useEffect(() => {
    // Check latest transcript chunks for keyword triggers
    const recentChunks = transcript.slice(-3);
    const recentText = recentChunks.map(c => (c.text || '').toLowerCase()).join(' ');

    // Check topic categories
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

      // Check transcript keywords
      for (const kw of rule.triggers) {
        if (recentText.includes(kw)) { triggered = true; break; }
      }

      // Check topic categories
      if (!triggered) {
        for (const cat of rule.categories) {
          if (topicCategories.has(cat)) { triggered = true; break; }
        }
      }

      // Check topic labels
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
      setActiveAlerts(prev => [...newAlerts, ...prev].slice(0, 5));
    }
  }, [topics, transcript]);

  function dismiss(id) {
    dismissedRef.current.add(id);
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  }

  if (activeAlerts.length === 0) return null;

  return (
    <div style={{
      borderTop: '1px solid #e2e8f0',
      background: '#f8fafc',
      padding: '6px 8px',
      flexShrink: 0,
      maxHeight: '35%',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5,
      }}>
        <svg width="10" height="10" fill="none" stroke="#64748b" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 9v4m0 4h.01" />
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
        <span style={{
          fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, color: '#475569',
        }}>
          Procedure Alert
        </span>
        <span style={{ fontSize: 8, color: '#94a3b8', marginLeft: 'auto' }}>
          {activeAlerts.length} rule{activeAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {activeAlerts.map((alert) => (
          <div key={alert.id} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #94a3b8',
            borderRadius: '0 6px 6px 0',
            padding: '5px 8px',
            animation: 'ruleSlideIn .4s cubic-bezier(.22,1,.36,1)',
            display: 'flex',
            gap: 6,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, color: '#64748b',
                  background: '#f1f5f9', border: '1px solid #cbd5e1',
                  borderRadius: 3, padding: '0 4px',
                }}>
                  {alert.section}
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: COLORS.headingText }}>
                  {alert.title}
                </span>
                <span style={{ fontSize: 8, color: '#94a3b8', marginLeft: 'auto' }}>
                  {alert.time}
                </span>
              </div>
              <div style={{ fontSize: 9.5, color: COLORS.bodyText, lineHeight: 1.5 }}>
                {alert.rule}
              </div>
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              aria-label={`Dismiss ${alert.title} alert`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', opacity: 0.5, padding: 0, flexShrink: 0,
                alignSelf: 'flex-start',
              }}
            >
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ruleSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
