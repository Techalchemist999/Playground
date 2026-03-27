import { useState } from 'react';
import { COLORS } from '../../styles/tokens';
import ProcedureRules from './ProcedureRules';

const STATUS_STYLES = {
  pending:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'Pending' },
  active:    { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe', label: 'Active' },
  discussed: { bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0', label: 'Discussed' },
};

export default function AgendaSidebar({ agendaItems, currentAgendaItem, topics, embedded }) {
  const [viewMode, setViewMode] = useState('agenda'); // 'agenda' | 'rules'
  const total = agendaItems.length;
  const discussed = agendaItems.filter(i => i.status === 'discussed').length;
  const active = agendaItems.filter(i => i.status === 'active').length;
  const pctDiscussed = total > 0 ? (discussed / total) * 100 : 0;
  const pctActive = total > 0 ? (active / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* View toggle */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        padding: '6px 10px 0', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2,
        }}>
          <button
            onClick={() => setViewMode('agenda')}
            aria-label="Agenda view"
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: viewMode === 'agenda' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'agenda' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: viewMode === 'agenda' ? '#db2777' : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Agenda
          </button>
          <button
            onClick={() => setViewMode('rules')}
            aria-label="Procedure rules view"
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: viewMode === 'rules' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'rules' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: viewMode === 'rules' ? '#ca8a04' : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Rules
          </button>
        </div>
      </div>

      {/* Agenda view */}
      {viewMode === 'agenda' && (
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
            <>
              {/* Progress bar */}
              <div style={{ padding: '8px 10px 6px', flexShrink: 0 }}>
                <div style={{
                  height: 5, borderRadius: 3,
                  background: '#f1f5f9',
                  overflow: 'hidden',
                  marginBottom: 4,
                }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${pctDiscussed}%`, background: '#22c55e', transition: 'width .5s' }} />
                    <div style={{ width: `${pctActive}%`, background: '#6366f1', transition: 'width .5s' }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, color: COLORS.mutedText }}>
                  <b style={{ color: COLORS.bodyText }}>{discussed}</b> of {total} discussed
                </span>
              </div>

              {/* Items */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {agendaItems.map((item, i) => {
                  const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
                  const isActive = item.status === 'active';
                  return (
                    <div
                      key={item.number || i}
                      style={{
                        display: 'flex', gap: 8, padding: '8px 14px',
                        borderLeft: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                        background: isActive ? COLORS.primaryLight : 'transparent',
                        transition: 'all .3s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: st.bg, border: `1.5px solid ${st.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, fontSize: 9, fontWeight: 700, color: st.color,
                      }}>
                        {item.status === 'discussed' ? (
                          <svg width="9" height="9" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          item.number || (i + 1)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 600,
                          color: isActive ? COLORS.primary : COLORS.headingText,
                          lineHeight: 1.3,
                        }}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: 9.5, color: COLORS.mutedText, marginTop: 1 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Procedure Rules view */}
      {viewMode === 'rules' && <ProcedureRules />}
    </div>
  );
}
