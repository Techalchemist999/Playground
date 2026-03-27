import { COLORS, SPACING } from '../../styles/tokens';

const STATUS_STYLES = {
  pending:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'Pending' },
  active:    { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe', label: 'Active' },
  discussed: { bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0', label: 'Discussed' },
};

export default function AgendaSidebar({ agendaItems, currentAgendaItem, topics }) {
  const total = agendaItems.length;
  const discussed = agendaItems.filter(i => i.status === 'discussed').length;
  const active = agendaItems.filter(i => i.status === 'active').length;
  const pctDiscussed = total > 0 ? (discussed / total) * 100 : 0;
  const pctActive = total > 0 ? (active / total) * 100 : 0;

  if (agendaItems.length === 0) {
    return (
      <div className="sidebar-right" style={{
        width: SPACING.sidebarWidth,
        borderLeft: `1px solid ${COLORS.cardBorder}`,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <svg width="28" height="28" fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.secondaryText }}>No Agenda</div>
        <div style={{ fontSize: 11, color: COLORS.mutedText, marginTop: 4, lineHeight: 1.5 }}>
          No agenda was attached to this session.
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-right" style={{
      width: SPACING.sidebarWidth,
      borderLeft: `1px solid ${COLORS.cardBorder}`,
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 15px 11px',
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        background: '#fafbfc',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <svg width="13" height="13" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText }}>Agenda</span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 6, borderRadius: 3,
          background: '#f1f5f9',
          overflow: 'hidden',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ width: `${pctDiscussed}%`, background: '#22c55e', transition: 'width .5s' }} />
            <div style={{ width: `${pctActive}%`, background: '#6366f1', transition: 'width .5s' }} />
          </div>
        </div>
        <span style={{ fontSize: 10.5, color: COLORS.mutedText }}>
          <b style={{ color: COLORS.bodyText }}>{discussed}</b> of {total} items discussed
        </span>
      </div>

      {/* Items list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {agendaItems.map((item, i) => {
          const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
          const isActive = item.status === 'active';
          return (
            <div
              key={item.number || i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 15px',
                borderLeft: isActive ? `4px solid ${COLORS.primary}` : '4px solid transparent',
                background: isActive ? COLORS.primaryLight : 'transparent',
                transition: 'all .3s',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: st.bg, border: `1.5px solid ${st.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: 10, fontWeight: 700, color: st.color,
              }}>
                {item.status === 'discussed' ? (
                  <svg width="10" height="10" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  item.number || (i + 1)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 600,
                  color: isActive ? COLORS.primary : COLORS.headingText,
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </div>
                {item.description && (
                  <div style={{ fontSize: 10, color: COLORS.mutedText, marginTop: 2 }}>
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
