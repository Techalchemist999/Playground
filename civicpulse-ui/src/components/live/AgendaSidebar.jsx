import { useState } from 'react';
import { COLORS } from '../../styles/tokens';
import RuleAlert from './RuleAlert';

const STATUS_STYLES = {
  pending:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'Pending' },
  active:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Active' },
  discussed: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Discussed' },
};

export default function AgendaSidebar({ agendaItems, currentAgendaItem, topics, transcript = [], status, embedded, accentColor }) {
  const [agendaExpanded, setAgendaExpanded] = useState(false);
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
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Progress bar */}
              <div style={{ padding: '8px 10px 6px', flexShrink: 0 }}>
                <div style={{
                  height: 5, borderRadius: 3,
                  background: '#f1f5f9',
                  overflow: 'hidden',
                  marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${pctDiscussed}%`, background: accentColor || '#cbd5e1', transition: 'width .5s, background .3s' }} />
                    <div style={{ width: `${pctActive}%`, background: `${accentColor || '#cbd5e1'}66`, transition: 'width .5s, background .3s' }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, color: COLORS.mutedText }}>
                  <b style={{ color: COLORS.bodyText }}>{discussed}</b> of {total} discussed
                </span>
              </div>

              {/* Current agenda item — always visible */}
              {(() => {
                const activeItem = agendaItems.find(i => i.status === 'active');
                if (!activeItem) return null;
                const idx = agendaItems.indexOf(activeItem);
                const nextItem = agendaItems[idx + 1];
                return (
                  <div style={{ padding: '6px 10px 8px' }}>
                    <div style={{
                      background: COLORS.primaryLight,
                      border: `1.5px solid ${COLORS.primaryBorder}`,
                      borderRadius: 8, padding: '10px 12px',
                    }}>
                      <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: COLORS.primary, marginBottom: 3 }}>
                        Now Discussing
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 5,
                          border: `2px solid ${COLORS.primary}`,
                          boxShadow: '0 0 0 3px #e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 10, fontWeight: 700, color: COLORS.primary,
                        }}>
                          {activeItem.number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, lineHeight: 1.3 }}>
                            {activeItem.title}
                          </div>
                          {activeItem.description && (
                            <div style={{ fontSize: 10, color: COLORS.secondaryText, marginTop: 2 }}>
                              {activeItem.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {nextItem && (
                      <div style={{ fontSize: 9, color: COLORS.mutedText, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700 }}>Up Next:</span> {nextItem.number}. {nextItem.title}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Accordion — full agenda */}
              <div style={{ padding: '0 10px 8px' }}>
                <button
                  onClick={() => setAgendaExpanded(!agendaExpanded)}
                  style={{
                    width: '100%', padding: '6px 10px',
                    background: agendaExpanded ? '#f8fafc' : '#f1f5f9',
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: agendaExpanded ? '6px 6px 0 0' : 6,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all .15s',
                  }}
                >
                  <svg
                    width="10" height="10" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
                    style={{ transform: agendaExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.secondaryText }}>
                    Full Agenda ({total} items)
                  </span>
                </button>
                {agendaExpanded && (
                  <div style={{
                    border: `1px solid ${COLORS.cardBorder}`, borderTop: 'none',
                    borderRadius: '0 0 6px 6px', background: '#fff',
                    maxHeight: 300, overflowY: 'auto',
                  }}>
                    {agendaItems.map((item, i) => {
                      const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
                      const isActive = item.status === 'active';
                      return (
                        <div
                          key={item.number || i}
                          style={{
                            display: 'flex', gap: 8, padding: '6px 12px',
                            borderLeft: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                            background: isActive ? COLORS.primaryLight : 'transparent',
                            transition: 'all .3s',
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: `${isActive ? '2' : '1.5'}px solid ${isActive ? COLORS.primary : st.border}`,
                            boxShadow: isActive ? '0 0 0 3px #e2e8f0' : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 8, fontWeight: 700, color: st.color,
                          }}>
                            {item.number || (i + 1)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 10, fontWeight: 600,
                              color: isActive ? COLORS.primary : item.status === 'discussed' ? COLORS.mutedText : COLORS.headingText,
                              lineHeight: 1.3,
                              textDecoration: item.status === 'discussed' ? 'line-through' : 'none',
                            }}>
                              {item.title}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: 9, color: COLORS.mutedText, marginTop: 1 }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rule alerts — always visible at bottom */}
      <RuleAlert topics={topics} transcript={transcript} />
    </div>
  );
}
