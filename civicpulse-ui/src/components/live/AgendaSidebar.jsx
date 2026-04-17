import { useState } from 'react';
import { COLORS } from '../../styles/tokens';
import BiteCard from './BiteCard';
import AttachmentModal from './AttachmentModal';

const ATT_TYPE_ICON = {
  map:    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  report: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  budget: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9h-4.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H9"/></svg>,
};
const ATT_TYPE_COLOR = {
  map:    { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
  report: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  budget: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
};

const STATUS_STYLES = {
  pending:   { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: 'Pending' },
  active:    { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Active' },
  discussed: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1', label: 'Discussed' },
};

export default function AgendaSidebar({ agendaItems, currentAgendaItem, topics, transcript = [], status, embedded, accentColor, resolvedMotions = [] }) {
  const [agendaExpanded, setAgendaExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [openAttachment, setOpenAttachment] = useState(null); // { attachment, agendaItem }

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
                  const itemAttachments = item.attachments || [];
                  const hasAttachments = itemAttachments.length > 0;
                  const isClickable = hasMotions || hasAttachments;
                  const isItemOpen = expandedItems.has(item.number);

                  return (
                    <div key={item.number || i}>
                      {/* Item row — map legend entry */}
                      <div
                        onClick={() => isClickable && toggleItem(item.number)}
                        style={{
                          display: 'flex', gap: 8, padding: '6px 12px',
                          borderBottom: '1px dotted #e2e8f0',
                          cursor: isClickable ? 'pointer' : 'default',
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
                          {!isItemOpen && (hasMotions || hasAttachments) && (
                            <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 1, display: 'flex', gap: 8 }}>
                              {hasAttachments && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                  {itemAttachments.length} attachment{itemAttachments.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {hasMotions && (
                                <span>{itemMotions.length} motion{itemMotions.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {isClickable && (
                          <svg width="8" height="8" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                            style={{ transform: isItemOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginTop: 4 }}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        )}
                      </div>
                      {/* Expanded content — attachments first, then motions */}
                      {isItemOpen && (hasAttachments || hasMotions) && (
                        <div style={{
                          padding: '8px 12px 10px 28px',
                          background: '#f8fafc',
                          borderBottom: '1px dotted #e2e8f0',
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                          {hasAttachments && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{
                                fontSize: 7, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
                                color: '#94a3b8',
                              }}>
                                Attachments
                              </div>
                              {itemAttachments.map(att => {
                                const col = ATT_TYPE_COLOR[att.type] || ATT_TYPE_COLOR.report;
                                return (
                                  <button
                                    key={att.id}
                                    onClick={(e) => { e.stopPropagation(); setOpenAttachment({ attachment: att, agendaItem: item }); }}
                                    title={`Open ${att.title} full screen`}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 8,
                                      padding: '6px 9px',
                                      background: '#fff',
                                      border: `1px solid ${col.border}66`,
                                      borderLeft: `3px solid ${col.border}`,
                                      borderRadius: 6,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      transition: 'all .12s',
                                      fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = col.bg; e.currentTarget.style.transform = 'translateX(2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                  >
                                    <span style={{ color: col.text, flexShrink: 0 }}>
                                      {ATT_TYPE_ICON[att.type] || ATT_TYPE_ICON.report}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{
                                        display: 'block', fontSize: 10.5, fontWeight: 700, color: '#0f172a',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                      }}>
                                        {att.title}
                                      </span>
                                      <span style={{ display: 'block', fontSize: 8.5, color: '#64748b', marginTop: 1 }}>
                                        {att.subtitle || `${att.pages || 1} page${(att.pages || 1) > 1 ? 's' : ''}`}
                                      </span>
                                    </span>
                                    <svg width="11" height="11" fill="none" stroke="#94a3b8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {hasMotions && itemMotions.map((topic, mi) => {
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

      {openAttachment && (
        <AttachmentModal
          attachment={openAttachment.attachment}
          agendaItem={openAttachment.agendaItem}
          onClose={() => setOpenAttachment(null)}
        />
      )}
    </div>
  );
}
