import { useState } from 'react';
import { COLORS } from '../../styles/tokens';
import BiteCard from './BiteCard';

const STATUS_STYLES = {
  pending:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'Pending' },
  active:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Active' },
  discussed: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Discussed' },
};

export default function AgendaSidebar({ agendaItems, currentAgendaItem, topics, transcript = [], status, embedded, accentColor, resolvedMotions = [] }) {
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Group resolved motions by agenda item number
  const motionsByItem = {};
  resolvedMotions.forEach(m => {
    const key = m.agendaItemNumber || '—';
    if (!motionsByItem[key]) motionsByItem[key] = [];
    motionsByItem[key].push(m);
  });
  // Floor motions (no agenda item)
  const floorMotions = resolvedMotions.filter(m => !m.agendaItemNumber);

  const toggleItem = (num) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  };
  const total = agendaItems.length;
  const discussed = agendaItems.filter(i => i.status === 'discussed').length;
  const active = agendaItems.filter(i => i.status === 'active').length;
  const pctDiscussed = total > 0 ? (discussed / total) * 100 : 0;
  const pctActive = total > 0 ? (active / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Agenda view */}
      {(
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {agendaItems.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: 20, textAlign: 'center', flex: 1,
            }}>
              <svg width="24" height="24" fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 6 }} aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.secondaryText }}>No Agenda</div>
              <div style={{ fontSize: 10.5, color: COLORS.mutedText, marginTop: 3, lineHeight: 1.5 }}>
                No agenda attached to this session.
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa' }}>
              {/* Legend header */}
              <div style={{
                padding: '8px 12px 6px',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#64748b' }}>Agenda Legend</span>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}><b style={{ color: '#334155' }}>{discussed}</b> / {total}</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${pctDiscussed}%`, background: '#475569', transition: 'width .5s' }} />
                    <div style={{ width: `${pctActive}%`, background: '#94a3b8', transition: 'width .5s' }} />
                  </div>
                </div>
              </div>

              {/* Agenda items — map legend style */}
              <div style={{ padding: '4px 0' }}>
                {agendaItems.map((item, i) => {
                  const isActive = item.status === 'active';
                  const isDone = item.status === 'discussed';
                  const itemMotions = motionsByItem[item.number] || [];
                  const hasMotions = itemMotions.length > 0;
                  const isItemOpen = expandedItems.has(item.number);

                  return (
                    <div key={item.number || i}>
                      {/* Item row — map legend entry */}
                      <div
                        onClick={() => hasMotions && toggleItem(item.number)}
                        style={{
                          display: 'flex', gap: 8, padding: '6px 12px',
                          borderBottom: '1px dotted #e2e8f0',
                          cursor: hasMotions ? 'pointer' : 'default',
                          background: isActive ? '#f1f5f9' : 'transparent',
                          transition: 'background .15s',
                        }}
                      >
                        {/* Square symbol — like a map legend marker */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 2,
                          border: `1.5px solid ${isActive ? '#0f172a' : isDone ? '#94a3b8' : '#cbd5e1'}`,
                          background: isActive ? '#0f172a' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 8, fontWeight: 800,
                          color: isActive ? '#fff' : isDone ? '#94a3b8' : '#64748b',
                        }}>
                          {item.number || (i + 1)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 11, fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#0f172a' : isDone ? '#94a3b8' : '#334155',
                            lineHeight: 1.3,
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>
                            {item.title}
                          </div>
                          {isActive && item.description && (
                            <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{item.description}</div>
                          )}
                          {hasMotions && !isItemOpen && (
                            <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>
                              {itemMotions.length} motion{itemMotions.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                        {hasMotions && (
                          <svg width="8" height="8" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                            style={{ transform: isItemOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginTop: 4 }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        )}
                      </div>
                      {/* Expanded motions — full card design */}
                      {isItemOpen && hasMotions && (
                        <div style={{
                          padding: '8px 12px 10px 28px',
                          background: '#f8fafc',
                          borderBottom: '1px dotted #e2e8f0',
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                          {itemMotions.map((topic, mi) => {
                            const hasAmend = topic.amendment;
                            const amendResolved = hasAmend && (hasAmend.status === 'carried' || hasAmend.status === 'defeated');
                            if (!hasAmend) {
                              // Simple motion — render as final card (full card with bottom stripe)
                              return <BiteCard key={topic.normalized_id} topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="final" />;
                            }
                            // Motion with amendment — 3-step
                            return (
                              <div key={topic.normalized_id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                <BiteCard topic={{ ...topic, amendment: { ...hasAmend }, state: 'ACTIVE' }} index={mi} isNewest={false} accentColor={accentColor} cardMode="original" />
                                <BiteCard topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="amendment" />
                                {amendResolved && <BiteCard topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="final" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Floor motions */}
                {floorMotions.length > 0 && (
                  <div>
                    <div
                      onClick={() => toggleItem('floor')}
                      style={{
                        display: 'flex', gap: 8, padding: '6px 12px',
                        borderBottom: '1px dotted #e2e8f0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 2,
                        border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: '#94a3b8', flexShrink: 0,
                      }}>—</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>Floor Motions</div>
                        <div style={{ fontSize: 7, color: '#94a3b8' }}>{floorMotions.length} motion{floorMotions.length > 1 ? 's' : ''}</div>
                      </div>
                      <svg width="8" height="8" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                        style={{ transform: expandedItems.has('floor') ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginTop: 4 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    {expandedItems.has('floor') && (
                      <div style={{ padding: '8px 12px 10px 28px', background: '#f8fafc', borderBottom: '1px dotted #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {floorMotions.map((topic, mi) => {
                          const hasAmend = topic.amendment;
                          const amendResolved = hasAmend && (hasAmend.status === 'carried' || hasAmend.status === 'defeated');
                          if (!hasAmend) {
                            return <BiteCard key={topic.normalized_id} topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="final" />;
                          }
                          return (
                            <div key={topic.normalized_id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                              <BiteCard topic={{ ...topic, amendment: { ...hasAmend }, state: 'ACTIVE' }} index={mi} isNewest={false} accentColor={accentColor} cardMode="original" />
                              <BiteCard topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="amendment" />
                              {amendResolved && <BiteCard topic={topic} index={mi} isNewest={false} accentColor={accentColor} cardMode="final" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
