import { useState, useCallback } from 'react';
import { COLORS, CATEGORY_COLORS } from '../../styles/tokens';

const COUNCILLORS = ['Mayor Veach', 'Cllr Rabel', 'Cllr Wall', 'Cllr Johnston', 'Cllr Woodill'];

// Vote states: null = not voted, 'yes', 'no'
const VOTE_CYCLE = [null, 'yes', 'no']; // click cycles through

function getStage(topic) {
  if (topic.state === 'EXPIRED') return 'carried';
  if (topic.state === 'ACTIVE') return 'awaiting-vote';
  if (topic.state === 'DETECTED') return 'mover-detected';
  return 'pending';
}

function shortName(name) {
  return name.replace('Cllr ', '').replace('Mayor ', '');
}

export default function BiteCard({ topic, index, isNewest, accentColor, cardMode = 'simple' }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const stage = getStage(topic);

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(topic.label);
  const [editMover, setEditMover] = useState(topic.mover || COUNCILLORS[index % COUNCILLORS.length]);
  const [editSeconder, setEditSeconder] = useState(topic.seconder || COUNCILLORS[(index + 1) % COUNCILLORS.length]);
  const [editMotionText, setEditMotionText] = useState(topic.motionText || '');
  const [editAmendText, setEditAmendText] = useState(topic.amendment?.text || '');
  const [amendOpen, setAmendOpen] = useState(true);

  const mover = editMover;
  const seconder = editSeconder;

  const isCarried = stage === 'carried';
  const defaultMotion = `THAT Council ${isCarried ? 'adopted' : 'adopts'} the ${editLabel.toLowerCase()} as presented.`;
  const motionText = editMotionText || defaultMotion;
  const amendment = topic.amendment ? { ...topic.amendment, text: editAmendText || topic.amendment.text } : null;

  const hasSeconder = stage === 'awaiting-vote' || stage === 'carried';
  const isVoting = stage === 'awaiting-vote';
  const isMoverDetected = stage === 'mover-detected';

  // Top bar — matches grid theme color
  const barColor = accentColor || '#cbd5e1';

  // Determine final result for badge color
  const finalVotes = topic.votes || [];
  const finalYes = finalVotes.filter(v => v === 'yes').length;
  const finalNo = finalVotes.filter(v => v === 'no').length;
  const isDefeated = isCarried && finalNo > finalYes;

  const badge = isCarried
    ? (isDefeated
      ? { label: `DEFEATED ${finalNo}-${finalYes}`, bg: '#fef2f2', border: '#fecaca', color: '#dc2626', pulse: false }
      : { label: finalNo === 0 ? 'CARRIED UNANIMOUSLY' : `CARRIED ${finalYes}-${finalNo}`, bg: '#f0fdf4', border: '#bbf7d0', color: '#22c55e', pulse: false })
    : isVoting
    ? { label: 'AWAITING VOTE', bg: '#f1f5f9', border: '#cbd5e1', color: '#64748b', pulse: true }
    : isMoverDetected
    ? { label: 'MOVER DETECTED', bg: '#f1f5f9', border: '#cbd5e1', color: '#64748b', pulse: true }
    : { label: 'PENDING', bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', pulse: false };

  // --- Vote state per councillor ---
  const [votes, setVotes] = useState(() => {
    // Use topic's votes if provided
    if (topic.votes) return [...topic.votes];
    if (isCarried) return COUNCILLORS.map(() => 'yes');
    if (isVoting) return COUNCILLORS.map((_, i) => (i < 3 ? 'yes' : null));
    return COUNCILLORS.map(() => null);
  });

  const cycleVote = useCallback((idx) => {
    setVotes(prev => {
      const next = [...prev];
      const currentIdx = VOTE_CYCLE.indexOf(next[idx]);
      next[idx] = VOTE_CYCLE[(currentIdx + 1) % VOTE_CYCLE.length];
      return next;
    });
  }, []);

  const yesCount = votes.filter(v => v === 'yes').length;
  const noCount = votes.filter(v => v === 'no').length;
  const pendingCount = votes.filter(v => v === null).length;

  // Determine result label from manual votes
  const allVoted = pendingCount === 0 && (isVoting || isCarried);
  const resultLabel = allVoted
    ? (noCount === 0 ? 'CARRIED UNANIMOUSLY' : yesCount > noCount ? `CARRIED ${yesCount}-${noCount}` : `DEFEATED ${noCount}-${yesCount}`)
    : null;

  // Compact history card — collapsed by default, expandable
  const [historyOpen, setHistoryOpen] = useState(false);

  if (cardMode === 'simple' && isCarried) {
    const stripeColor = isDefeated ? '#dc2626' : '#22c55e';
    const stripeBg = isDefeated ? '#fef2f2' : '#f0fdf4';
    const stripeBorder = isDefeated ? '#fee2e2' : '#dcfce7';
    const wasAmended = amendment?.status === 'carried';
    const baseLabel = isDefeated
      ? `DEFEATED ${finalNo}-${finalYes}`
      : (finalNo === 0 ? 'CARRIED UNANIMOUSLY' : `CARRIED ${finalYes}-${finalNo}`);
    const stripeLabel = wasAmended ? `${baseLabel} (AS AMENDED)` : baseLabel;

    if (!historyOpen) {
      // Collapsed — title left, disposition + icon right
      return (
        <div
          onClick={() => setHistoryOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0', cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', flex: 1 }}>
            {editLabel}
            {wasAmended && <span style={{ fontSize: 8, color: '#94a3b8', marginLeft: 4 }}>· amended</span>}
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, color: stripeColor, whiteSpace: 'nowrap' }}>
            {stripeLabel}
          </span>
          <div style={{ flexShrink: 0 }}>
            {isDefeated ? (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2" />
                <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2.5" />
                <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2.5" />
              </svg>
            ) : (
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
                <polyline points="8 12 11 15 16 9" stroke="#22c55e" strokeWidth="2.5" fill="none" />
              </svg>
            )}
          </div>
        </div>
      );
    }
    // historyOpen = true — fall through to render the full card with a close button
  }

  // Amendment accordion card — renders as an attached child below the original
  if (cardMode === 'amendment' && amendment) {
    const amCarried = amendment.status === 'carried';
    const amDefeated = amendment.status === 'defeated';
    const borderCol = amCarried ? '#22c55e' : amDefeated ? '#dc2626' : '#94a3b8';
    const bgCol = amCarried ? '#f0fdf4' : amDefeated ? '#fef2f2' : '#f8fafc';
    const textCol = amCarried ? '#22c55e' : amDefeated ? '#dc2626' : '#475569';
    const statusText = amCarried ? `Amendment Carried ${amendment.result || ''}`.trim()
      : amDefeated ? `Amendment Defeated ${amendment.result || ''}`.trim()
      : 'Amendment — Voting';
    return (
      <div style={{
        background: bgCol,
        border: `1px solid ${amCarried ? '#dcfce7' : amDefeated ? '#fee2e2' : '#e2e8f0'}`,
        borderTop: `2px solid ${borderCol}`,
        borderRadius: (amCarried || amDefeated) ? 0 : '0 0 12px 12px',
        marginTop: -1,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Collapsed summary bar */}
        <div
          onClick={() => setAmendOpen(!amendOpen)}
          style={{
            padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer',
            borderBottom: amendOpen ? `1px solid ${amCarried ? '#dcfce7' : amDefeated ? '#fee2e2' : '#e2e8f0'}` : 'none',
          }}
        >
          <svg width="9" height="9" fill="none" stroke={textCol} strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transform: amendOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: textCol }}>{statusText}</span>
          <span style={{ fontSize: 8, color: '#64748b', marginLeft: 'auto' }}>{amendment.mover}</span>
        </div>
        {/* Expanded detail */}
        {amendOpen && (
          <div style={{ padding: '10px 14px' }}>
            <div style={{
              fontSize: 12, lineHeight: 1.75, marginBottom: 8,
              color: amDefeated ? '#991b1b' : '#334155',
              textDecoration: amDefeated ? 'line-through' : 'none',
              paddingLeft: 14, borderLeft: `2px solid ${amCarried ? '#dcfce7' : amDefeated ? '#fee2e2' : '#e2e8f0'}`,
            }}>
              THAT the main motion be amended by {amendment.text}
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 6px' }}>
                <div style={{ fontSize: 5, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase', color: '#64748b' }}>Moved By</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>{amendment.mover}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 6px' }}>
                <div style={{ fontSize: 5, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase', color: '#64748b' }}>Seconded By</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>{amendment.seconder}</div>
              </div>
            </div>
            {amendment.votes && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {COUNCILLORS.map((name, vi) => {
                  const v = amendment.votes[vi];
                  const isY = v === 'yes', isN = v === 'no';
                  return (
                    <div key={name} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 700,
                        background: isY ? 'linear-gradient(135deg,#dcfce7,#bbf7d0aa)' : isN ? 'linear-gradient(135deg,#fee2e2,#fecacaaa)' : '#f1f5f9',
                        border: isY ? '1px solid #86efac' : isN ? '1px solid #fca5a5' : '1px dashed #cbd5e1',
                        color: isY ? '#16a34a' : isN ? '#dc2626' : '#94a3b8',
                      }}>
                        {isY ? '✓' : isN ? '✗' : '?'}
                      </div>
                      <div style={{ fontSize: 4.5, color: '#94a3b8', marginTop: 1 }}>{shortName(name)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    );
  }

  // Original motion card — shown before amendment, paused state
  const isOriginalMode = cardMode === 'original';
  // Final motion card — after amendment resolved
  const isFinalMode = cardMode === 'final';

  // Override display for original/final modes
  const showAmendBlock = false; // Never show the old nested amendment block
  const showPausedStripe = isOriginalMode && topic.amendment;
  const showAsAmended = isFinalMode && topic.amendment?.status === 'carried';
  const finalMotionText = showAsAmended
    ? motionText.replace(/\.$/, '') + ' ' + topic.amendment.text
    : motionText;
  const finalBadgeLabel = isFinalMode
    ? (topic.amendment?.status === 'carried'
      ? (badge.label + ' (AS AMENDED)')
      : badge.label)
    : badge.label;
  const finalMeta = isFinalMode && topic.amendment?.status === 'carried'
    ? `Motion · Item ${index + 1} (as amended)`
    : `Motion · Item ${index + 1}`;

  return (
    <div style={{
      background: '#fff',
      borderRadius: (isFinalMode && amendment) ? '0 0 12px 12px' : isOriginalMode && topic.amendment ? '12px 12px 0 0' : 12,
      border: `1px solid ${COLORS.cardBorder}`,
      borderTop: (isFinalMode && amendment) ? 'none' : `1px solid ${COLORS.cardBorder}`,
      borderBottom: isOriginalMode && topic.amendment ? 'none' : `1px solid ${COLORS.cardBorder}`,
      overflow: 'hidden',
      flexShrink: 0,
      opacity: isOriginalMode ? 0.5 : 1,
      animation: isNewest ? 'slideUp .5s cubic-bezier(.22,1,.36,1)' : 'none',
    }}>
      {/* Collapse back to compact — only for expanded history cards */}
      {historyOpen && cardMode === 'simple' && isCarried && (
        <div
          onClick={() => setHistoryOpen(false)}
          style={{
            padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4,
            cursor: 'pointer', background: '#f8fafc',
          }}
        >
          <svg width="9" height="9" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: 'rotate(180deg)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 600, color: '#94a3b8' }}>Collapse</span>
        </div>
      )}

      {/* Colour top bar — hidden on final mode with amendment (connects to accordion) */}
      {!(isFinalMode && amendment) && (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${barColor}, ${barColor}55, transparent)` }} />
      )}

      {/* Header */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 3,
        }}>
          <div style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 1.3,
            textTransform: 'uppercase', color: COLORS.mutedText,
          }}>
            {finalMeta || `Motion · Item ${index + 1}`}
          </div>
          {!isOriginalMode && (
            <button
              onClick={() => setEditing(!editing)}
              title={editing ? 'Done editing' : 'Edit this card'}
              style={{
                background: editing ? '#f1f5f9' : 'transparent',
                border: editing ? '1px solid #cbd5e1' : '1px solid transparent',
                borderRadius: 4, padding: '2px 4px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}
            >
              <svg width="10" height="10" fill="none" stroke={editing ? '#475569' : '#cbd5e1'} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          {editing ? (
            <input
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              style={{
                fontSize: 13.5, fontWeight: 700, color: COLORS.headingText, lineHeight: 1.3,
                border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px',
                flex: 1, fontFamily: 'inherit', background: '#f8fafc',
              }}
            />
          ) : (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.headingText, lineHeight: 1.3 }}>
              {editLabel}
            </div>
          )}
          {!isOriginalMode && !isCarried && (
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              background: badge.bg, border: `1.5px solid ${badge.border}`,
              borderRadius: 999, padding: '3px 9px',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%', background: badge.color,
                animation: badge.pulse ? 'pulse 1.5s infinite' : 'none',
              }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: badge.color }}>{badge.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Motion text blockquote */}
      <div style={{
        background: '#f8fafc',
        borderLeft: '3px solid #cbd5e1',
        borderRadius: '0 8px 8px 0',
        padding: '9px 12px',
        margin: '0 14px 10px',
        fontSize: 12, color: COLORS.bodyText, lineHeight: 1.75,
        opacity: amendment?.status === 'pending' || amendment?.status === 'voting' ? 0.4 : 1,
        transition: 'opacity .3s',
      }}>
        {editing ? (
          <textarea
            value={editMotionText || motionText}
            onChange={e => setEditMotionText(e.target.value)}
            style={{
              width: '100%', border: '1px solid #cbd5e1', borderRadius: 4,
              padding: '4px 6px', fontSize: 12, fontFamily: 'inherit',
              lineHeight: 1.75, color: COLORS.bodyText, background: '#fff',
              resize: 'vertical', minHeight: 50,
            }}
          />
        ) : showAsAmended
          ? <>{motionText.replace(/\.$/, '')} <strong>{topic.amendment.text}</strong></>
          : motionText
        }
      </div>

      {/* Amendment block — only for simple/legacy cards */}
      {amendment && cardMode === 'simple' && (
        <div style={{
          margin: '0 14px 10px',
          padding: '10px 12px',
          borderRadius: '0 8px 8px 0',
          borderLeft: `3px solid ${
            amendment.status === 'carried' ? '#22c55e'
            : amendment.status === 'defeated' ? '#dc2626'
            : '#cbd5e1'
          }`,
          background: amendment.status === 'carried' ? '#f0fdf4'
            : amendment.status === 'defeated' ? '#fef2f2'
            : '#f8fafc',
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
            color: amendment.status === 'carried' ? '#22c55e'
              : amendment.status === 'defeated' ? '#dc2626'
              : '#475569',
          }}>
            {amendment.status === 'carried' ? '✓ Amendment Carried'
              : amendment.status === 'defeated' ? '✗ Amendment Defeated'
              : '✎ Amendment'}
          </div>
          <div style={{
            fontSize: 12, lineHeight: 1.7,
            color: amendment.status === 'carried' ? '#166534'
              : amendment.status === 'defeated' ? '#991b1b'
              : '#475569',
            textDecoration: amendment.status === 'defeated' ? 'line-through' : 'none',
          }}>
            {editing ? (
              <textarea
                value={editAmendText || amendment.text}
                onChange={e => setEditAmendText(e.target.value)}
                style={{
                  width: '100%', border: '1px solid #cbd5e1', borderRadius: 4,
                  padding: '4px 6px', fontSize: 12, fontFamily: 'inherit',
                  lineHeight: 1.7, background: '#fff', resize: 'vertical', minHeight: 40,
                  color: amendment.status === 'defeated' ? '#991b1b' : 'inherit',
                }}
              />
            ) : <>THAT the main motion be amended by {amendment.text}</>}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, marginTop: 6,
            color: amendment.status === 'carried' ? '#16a34a'
              : amendment.status === 'defeated' ? '#dc2626'
              : '#64748b',
          }}>
            {amendment.result
              ? `${amendment.status === 'carried' ? '✓' : '✗'} ${amendment.result} · ${amendment.mover}`
              : `Moved: ${amendment.mover} · Seconded: ${amendment.seconder}`
            }
          </div>
          {(amendment.status === 'pending' || amendment.status === 'voting') && (
            <div style={{
              fontSize: 8, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              color: '#64748b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.5s infinite' }} />
              {amendment.status === 'voting' ? 'Voting on amendment' : 'Debating amendment — main motion paused'}
            </div>
          )}
        </div>
      )}

      {/* Mover / Seconder tiles — hidden on original mode */}
      {!isOriginalMode && <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
        <div style={{
          flex: 1,
          background: '#f1f5f9',
          border: '1.5px solid #cbd5e1',
          borderRadius: 7, padding: '6px 8px',
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: '#64748b', marginBottom: 2,
          }}>Moved By</div>
          {editing ? (
            <input
              value={editMover}
              onChange={e => setEditMover(e.target.value)}
              style={{
                fontSize: 12, fontWeight: 700, color: COLORS.headingText,
                border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 4px',
                width: '100%', fontFamily: 'inherit', background: '#fff',
              }}
            />
          ) : (
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.headingText }}>
              {mover}
            </div>
          )}
        </div>
        <div style={{
          flex: 1,
          background: hasSeconder ? '#f1f5f9' : '#f8fafc',
          border: hasSeconder ? '1.5px solid #cbd5e1' : '1.5px dashed #cbd5e1',
          borderRadius: 7, padding: '6px 8px',
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: '#64748b', marginBottom: 2,
          }}>Seconded By</div>
          {editing ? (
            <input
              value={editSeconder}
              onChange={e => setEditSeconder(e.target.value)}
              style={{
                fontSize: 12, fontWeight: 700, color: COLORS.headingText,
                border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 4px',
                width: '100%', fontFamily: 'inherit', background: '#fff',
              }}
            />
          ) : (
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: hasSeconder ? COLORS.headingText : '#94a3b8',
              fontStyle: hasSeconder ? 'normal' : 'italic',
            }}>
              {hasSeconder ? seconder : 'Listening...'}
            </div>
          )}
        </div>
      </div>}

      {/* Vote section — Apple Glass Frosted Orbs (hidden on original/paused mode) */}
      {(isVoting || isCarried) && !isOriginalMode && (
        <div style={{
          margin: '0 14px 12px',
          padding: '10px 10px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <div style={{
              fontSize: 7.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              color: '#64748b',
            }}>
              {resultLabel || (isCarried ? 'Vote Result' : 'Vote · All in favour?')}
            </div>
            {pendingCount > 0 && (
              <div style={{
                fontSize: 7, fontWeight: 600, color: '#94a3b8',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <svg width="8" height="8" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                listening...
              </div>
            )}
          </div>

          {/* Apple Glass Orbs */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {COUNCILLORS.map((name, i) => {
              const vote = votes[i];
              const isYes = vote === 'yes';
              const isNo = vote === 'no';
              const isPending = vote === null;

              // Orb styles
              const orbBg = isYes
                ? 'linear-gradient(135deg, #dcfce7, rgba(187,247,208,0.4))'
                : isNo
                ? 'linear-gradient(135deg, #fee2e2, rgba(254,202,202,0.4))'
                : 'linear-gradient(135deg, #f1f5f9, rgba(226,232,240,0.4))';
              const orbBorder = isYes ? '#86efac' : isNo ? '#fca5a5' : '#cbd5e1';
              const orbColor = isYes ? '#16a34a' : isNo ? '#dc2626' : '#94a3b8';
              const orbShadow = isYes
                ? '0 4px 16px rgba(34,197,94,.15)'
                : isNo
                ? '0 4px 16px rgba(239,68,68,.15)'
                : 'none';
              const orbSymbol = isYes ? '✓' : isNo ? '✗' : '?';

              return (
                <div key={name} style={{ textAlign: 'center' }}>
                  <div
                    onClick={() => cycleVote(i)}
                    title={`Click to change vote for ${name}`}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: orbBg,
                      border: `1.5px ${isPending ? 'dashed' : 'solid'} ${orbBorder}`,
                      color: orbColor,
                      fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: orbShadow,
                      position: 'relative',
                      transition: 'all .3s cubic-bezier(.22,1,.36,1)',
                      animation: isPending ? 'voteFloat 2.5s ease infinite' : 'none',
                    }}
                  >
                    {/* Highlight reflection */}
                    {!isPending && (
                      <div style={{
                        position: 'absolute', top: 4, left: 8,
                        width: 14, height: 7, borderRadius: '50%',
                        background: 'rgba(255,255,255,.5)',
                        filter: 'blur(2px)', pointerEvents: 'none',
                      }} />
                    )}
                    {orbSymbol}
                  </div>
                  <div style={{
                    fontSize: 7, marginTop: 4, fontWeight: 600,
                    color: '#94a3b8',
                  }}>
                    {shortName(name)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tally bar */}
          {(yesCount > 0 || noCount > 0) && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 8,
              marginTop: 8, fontSize: 9, fontWeight: 700,
            }}>
              <span style={{ color: '#16a34a' }}>In Favour: {yesCount}</span>
              {noCount > 0 && <span style={{ color: '#dc2626' }}>Opposed: {noCount}</span>}
              {pendingCount > 0 && <span style={{ color: '#94a3b8' }}>Pending: {pendingCount}</span>}
            </div>
          )}
        </div>
      )}

      {/* Paused stripe for original mode */}
      {showPausedStripe && (
        <div style={{
          padding: '7px 12px', fontSize: 9, fontWeight: 600, fontStyle: 'italic',
          textAlign: 'center', color: '#94a3b8', background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}>
          Main motion paused — amendment on the floor
        </div>
      )}

      {/* Bottom stripe for final mode */}
      {isFinalMode && isCarried && (
        <div style={{
          padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .5,
          textAlign: 'center',
          background: isDefeated ? '#fef2f2' : '#f0fdf4',
          color: isDefeated ? '#dc2626' : '#22c55e',
          borderTop: `1px solid ${isDefeated ? '#fee2e2' : '#dcfce7'}`,
        }}>
          {finalBadgeLabel}
        </div>
      )}

      {/* Bottom stripe for simple cards */}
      {cardMode === 'simple' && isCarried && (
        <div style={{
          padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: .5,
          textAlign: 'center',
          background: isDefeated ? '#fef2f2' : '#f0fdf4',
          color: isDefeated ? '#dc2626' : '#22c55e',
          borderTop: `1px solid ${isDefeated ? '#fee2e2' : '#dcfce7'}`,
        }}>
          {badge.label}
        </div>
      )}


      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes voteFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>
    </div>
  );
}
