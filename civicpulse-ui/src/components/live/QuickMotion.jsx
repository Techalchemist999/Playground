import { useState } from 'react';
import { COLORS } from '../../styles/tokens';

const COUNCILLORS = ['Mayor Veach', 'Cllr Rabel', 'Cllr Wall', 'Cllr Johnston', 'Cllr Woodill'];
const MOTION_TYPES = ['Main Motion', 'Amending Motion', 'Reconsideration'];

function shortName(name) {
  return name.replace('Cllr ', '').replace('Mayor ', '');
}

export default function QuickMotion({ onRecord, onCancel, onFloorMotion, resolvedMotions = [], startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const [motionType, setMotionType] = useState('Main Motion');
  const [text, setText] = useState('');
  const [mover, setMover] = useState('');
  const [seconder, setSeconder] = useState('');
  const [reconsiderTarget, setReconsiderTarget] = useState(null);

  function handleRecord() {
    if (motionType === 'Reconsideration' && !reconsiderTarget) return;
    if (motionType !== 'Reconsideration' && !text.trim()) return;

    if (onRecord) onRecord({
      type: motionType,
      text: motionType === 'Reconsideration'
        ? `THAT Council reconsiders the motion: ${reconsiderTarget?.label}`
        : text.trim(),
      mover,
      seconder,
      reconsiderTarget: reconsiderTarget?.normalized_id || null,
    });

    setText('');
    setMover('');
    setSeconder('');
    setMotionType('Main Motion');
    setReconsiderTarget(null);
    setOpen(false);
  }

  function handleCancel() {
    setText('');
    setMover('');
    setSeconder('');
    setMotionType('Main Motion');
    setReconsiderTarget(null);
    setOpen(false);
    if (onCancel) onCancel();
  }

  // Empty state — show Quick Motion button
  if (!open && !onFloorMotion) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, padding: 20,
      }}>
        <svg width="32" height="32" fill="none" stroke="#e2e8f0" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No motion on the floor</span>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: '#475569', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 20px', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, marginTop: 8,
          }}
        >
          <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Quick Motion
        </button>
        <span style={{ fontSize: 9, color: '#cbd5e1' }}>or wait for one to be detected from audio</span>
      </div>
    );
  }

  // Form not open — return null (the motion card is shown by the parent)
  if (!open) return null;

  // Form open
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Cancel in header area */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', padding: '4px 10px 0', flexShrink: 0,
      }}>
        <button onClick={handleCancel} style={{
          background: 'transparent', border: 'none', color: '#94a3b8',
          fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: '4px 8px',
        }}>
          Cancel
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 14px' }}>
        {/* Motion Type */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
            color: '#475569', marginBottom: 6,
          }}>
            Motion Type
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {MOTION_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setMotionType(type); setReconsiderTarget(null); }}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8,
                  fontSize: 10, fontWeight: motionType === type ? 700 : 600,
                  cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                  border: `1.5px solid ${motionType === type ? '#475569' : '#e2e8f0'}`,
                  background: motionType === type ? '#f1f5f9' : '#fff',
                  color: motionType === type ? '#0f172a' : '#64748b',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amending Motion — reference to what's being amended */}
        {motionType === 'Amending Motion' && onFloorMotion && (
          <div style={{
            marginBottom: 14, padding: '8px 12px', background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 8,
          }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3 }}>
              Amending Main Motion
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{onFloorMotion.label}</div>
            <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Currently on the floor</div>
          </div>
        )}

        {/* Reconsideration — select which past motion */}
        {motionType === 'Reconsideration' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              color: '#475569', marginBottom: 6,
            }}>
              Motion to Reconsider
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {resolvedMotions.length > 0 ? resolvedMotions.map(m => {
                const isSelected = reconsiderTarget?.normalized_id === m.normalized_id;
                const votes = m.votes || [];
                const yes = votes.filter(v => v === 'yes').length;
                const no = votes.filter(v => v === 'no').length;
                const defeated = no > yes;
                return (
                  <div
                    key={m.normalized_id}
                    onClick={() => setReconsiderTarget(isSelected ? null : m)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      background: isSelected ? '#f1f5f9' : '#fff',
                      border: `1.5px solid ${isSelected ? '#475569' : '#e2e8f0'}`,
                      transition: 'all .15s',
                    }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                      {defeated
                        ? <><circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2" /><line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2.5" /><line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2.5" /></>
                        : <><circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" /><polyline points="8 12 11 15 16 9" stroke="#22c55e" strokeWidth="2.5" fill="none" /></>
                      }
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#0f172a' }}>{m.label}</div>
                      <div style={{ fontSize: 8, color: '#64748b' }}>
                        {defeated ? `Defeated ${no}-${yes}` : (no === 0 ? 'Carried Unanimously' : `Carried ${yes}-${no}`)}
                      </div>
                    </div>
                    {isSelected && <span style={{ fontSize: 8, fontWeight: 700, color: '#475569' }}>Selected</span>}
                  </div>
                );
              }) : (
                <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', padding: 8 }}>
                  No resolved motions to reconsider
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motion Text — not shown for reconsideration */}
        {motionType !== 'Reconsideration' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              color: '#475569', marginBottom: 6,
            }}>
              {motionType === 'Amending Motion' ? 'Amendment Text' : 'Motion Text'}
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={motionType === 'Amending Motion'
                ? 'THAT the main motion be amended by...'
                : 'THAT Council...'}
              style={{
                background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 8,
                padding: '9px 12px', fontSize: 12, color: '#334155', fontFamily: 'inherit',
                width: '100%', outline: 'none', lineHeight: 1.7, resize: 'vertical', minHeight: 70,
              }}
            />
          </div>
        )}

        {/* Mover + Seconder pills side by side */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              color: '#475569', marginBottom: 6,
            }}>
              Mover
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {COUNCILLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setMover(mover === c ? '' : c)}
                  style={{
                    padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', transition: 'all .15s',
                    border: `1.5px solid ${mover === c ? '#475569' : '#e2e8f0'}`,
                    background: mover === c ? '#f1f5f9' : '#fff',
                    color: mover === c ? '#0f172a' : '#64748b',
                  }}
                >
                  {shortName(c)}{mover === c ? ' ✓' : ''}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              color: '#475569', marginBottom: 6,
            }}>
              Seconder
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {COUNCILLORS.map(c => {
                const isMover = c === mover;
                return (
                  <button
                    key={c}
                    onClick={() => !isMover && setSeconder(seconder === c ? '' : c)}
                    style={{
                      padding: '5px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                      cursor: isMover ? 'default' : 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${seconder === c ? '#475569' : '#e2e8f0'}`,
                      background: seconder === c ? '#f1f5f9' : '#fff',
                      color: seconder === c ? '#0f172a' : '#64748b',
                      opacity: isMover ? 0.3 : 1,
                      pointerEvents: isMover ? 'none' : 'auto',
                    }}
                  >
                    {shortName(c)}{seconder === c ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleRecord}
            disabled={motionType === 'Reconsideration' ? !reconsiderTarget : !text.trim()}
            style={{
              background: '#475569', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 18px', fontSize: 12,
              fontWeight: 700, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 5,
              opacity: (motionType === 'Reconsideration' ? !reconsiderTarget : !text.trim()) ? 0.4 : 1,
            }}
          >
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {motionType === 'Amending Motion' ? 'Put Amendment on the Floor'
              : motionType === 'Reconsideration' ? 'Put Reconsideration on the Floor'
              : 'Put on the Floor'}
          </button>
        </div>
      </div>
    </div>
  );
}
