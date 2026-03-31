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

export default function BiteCard({ topic, index, isNewest, accentColor }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const stage = getStage(topic);

  // Editable fields
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(topic.label);
  const [editMover, setEditMover] = useState(topic.mover || COUNCILLORS[index % COUNCILLORS.length]);
  const [editSeconder, setEditSeconder] = useState(topic.seconder || COUNCILLORS[(index + 1) % COUNCILLORS.length]);
  const [editMotionText, setEditMotionText] = useState(topic.motionText || '');
  const [editAmendText, setEditAmendText] = useState(topic.amendment?.text || '');

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

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `1px solid ${COLORS.cardBorder}`,
      overflow: 'hidden',
      flexShrink: 0,
      animation: isNewest ? 'slideUp .5s cubic-bezier(.22,1,.36,1)' : 'none',
    }}>
      {/* Colour top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${barColor}, ${barColor}55, transparent)` }} />

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
            Motion · Item {index + 1}
          </div>
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
        ) : amendment?.status === 'carried'
          ? <>{motionText.replace(/\.$/, '')} <strong>{amendment.text}</strong></>
          : motionText
        }
      </div>

      {/* Amendment block — nested indent style */}
      {amendment && (
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
            ) : `"${amendment.text}"`}
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

      {/* Mover / Seconder tiles */}
      {/* Mover / Seconder tiles — monochrome */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
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
      </div>

      {/* Vote section — Apple Glass Frosted Orbs */}
      {(isVoting || isCarried) && (
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
              <span style={{ color: '#16a34a' }}>Yes: {yesCount}</span>
              {noCount > 0 && <span style={{ color: '#dc2626' }}>No: {noCount}</span>}
              {pendingCount > 0 && <span style={{ color: '#94a3b8' }}>Pending: {pendingCount}</span>}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, padding: '0 14px 12px', flexWrap: 'wrap' }}>
        {isCarried && (
          <span style={{
            fontSize: 9, borderRadius: 999, padding: '2px 8px',
            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
          }}>
            {badge.label.toLowerCase()}
          </span>
        )}
        <span style={{
          fontSize: 9, borderRadius: 999, padding: '2px 8px',
          background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1',
        }}>
          {topic.category}
        </span>
        {!isCarried && !isVoting && (
          <span style={{
            fontSize: 9, borderRadius: 999, padding: '2px 8px',
            background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0',
          }}>
            {isMoverDetected ? 'awaiting seconder' : 'awaiting vote'}
          </span>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes voteFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>
    </div>
  );
}
