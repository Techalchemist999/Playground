import { COLORS, CATEGORY_COLORS } from '../../styles/tokens';

const COUNCILLORS = ['Mayor Veach', 'Cllr Rabel', 'Cllr Wall', 'Cllr Johnston', 'Cllr Woodill'];

// Determine motion stage from topic state
function getStage(topic) {
  if (topic.state === 'EXPIRED') return 'carried';
  if (topic.state === 'ACTIVE') return 'awaiting-vote';
  if (topic.state === 'DETECTED') return 'mover-detected';
  return 'pending';
}

export default function BiteCard({ topic, index, isNewest }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const stage = getStage(topic);
  const mover = COUNCILLORS[index % COUNCILLORS.length];
  const seconder = COUNCILLORS[(index + 1) % COUNCILLORS.length];

  const isCarried = stage === 'carried';
  const hasSeconder = stage === 'awaiting-vote' || stage === 'carried';
  const isVoting = stage === 'awaiting-vote';
  const isMoverDetected = stage === 'mover-detected';

  // Top bar colour
  const barColor = isCarried ? '#22c55e' : isVoting ? '#6366f1' : '#2563eb';

  // Badge
  const badge = isCarried
    ? { label: 'CARRIED UNANIMOUSLY', bg: '#f0fdf4', border: '#bbf7d0', color: '#22c55e', pulse: false }
    : isVoting
    ? { label: 'AWAITING VOTE', bg: '#fffbeb', border: '#fde68a', color: '#b45309', pulse: true }
    : isMoverDetected
    ? { label: 'MOVER DETECTED', bg: '#eef2ff', border: '#c7d2fe', color: '#6366f1', pulse: true }
    : { label: 'PENDING', bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', pulse: false };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `1px solid ${COLORS.cardBorder}`,
      overflow: 'hidden',
      animation: isNewest ? 'slideUp .5s cubic-bezier(.22,1,.36,1)' : 'none',
    }}>
      {/* Colour top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${barColor}, ${barColor}55, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: 1.3,
          textTransform: 'uppercase', color: COLORS.mutedText, marginBottom: 3,
        }}>
          Motion · Item {index + 1}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.headingText, lineHeight: 1.3 }}>
            {topic.label}
          </div>
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
        borderLeft: `3px solid ${barColor}`,
        borderRadius: '0 8px 8px 0',
        padding: '9px 12px',
        margin: '0 14px 10px',
        fontSize: 12, color: COLORS.bodyText, lineHeight: 1.75,
      }}>
        THAT Council {isCarried ? 'adopted' : 'adopts'} the {topic.label.toLowerCase()} as presented.
      </div>

      {/* Mover / Seconder tiles */}
      <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
        {/* Mover tile */}
        <div style={{
          flex: 1,
          background: isCarried ? '#f0fdf4' : '#eef2ff',
          border: `1.5px solid ${isCarried ? '#bbf7d0' : '#c7d2fe'}`,
          borderRadius: 7, padding: '6px 8px',
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: isCarried ? '#22c55e' : '#6366f1', marginBottom: 2,
          }}>
            Moved By
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: isCarried ? COLORS.headingText : '#6366f1',
          }}>
            {mover}
          </div>
        </div>

        {/* Seconder tile */}
        <div style={{
          flex: 1,
          background: hasSeconder ? (isCarried ? '#f0fdf4' : '#f0fdf4') : '#fffbeb',
          border: hasSeconder
            ? `1.5px solid ${isCarried ? '#bbf7d0' : '#bbf7d0'}`
            : '1.5px dashed #fde68a',
          borderRadius: 7, padding: '6px 8px',
        }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: hasSeconder ? (isCarried ? '#22c55e' : '#22c55e') : '#b45309',
            marginBottom: 2,
          }}>
            Seconded By
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700,
            color: hasSeconder ? COLORS.headingText : '#b45309',
            fontStyle: hasSeconder ? 'normal' : 'italic',
          }}>
            {hasSeconder ? seconder : 'Listening...'}
          </div>
        </div>
      </div>

      {/* Vote section — only when voting or carried */}
      {(isVoting || isCarried) && (
        <div style={{
          margin: '0 14px 12px',
          padding: '8px 10px',
          background: isCarried ? '#f8fafc' : '#fafaff',
          border: `1px solid ${isCarried ? COLORS.cardBorder : '#c7d2fe'}`,
          borderRadius: 8,
        }}>
          <div style={{
            fontSize: 7.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: isCarried ? '#22c55e' : '#6366f1',
            marginBottom: 6,
          }}>
            {isCarried ? 'Vote Result' : 'Vote · All in favour?'}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {COUNCILLORS.slice(0, 4).map((name, i) => {
              const voted = isCarried || i < 3; // In voting state, first 3 have voted
              const isWaiting = isVoting && i === 3;
              return (
                <div key={name} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: voted ? '#f0fdf4' : 'transparent',
                    border: voted ? '2px solid #22c55e' : (isWaiting ? '2px dashed #6366f1' : '2px solid #e2e8f0'),
                    color: voted ? '#22c55e' : (isWaiting ? '#6366f1' : '#cbd5e1'),
                    animation: isWaiting ? 'pulse 1.5s infinite' : 'none',
                  }}>
                    {voted ? '✓' : (isWaiting ? '?' : '·')}
                  </div>
                  <div style={{
                    fontSize: 7, marginTop: 3, fontWeight: 500,
                    color: voted ? '#22c55e' : (isWaiting ? '#6366f1' : '#94a3b8'),
                  }}>
                    {name.replace('Cllr ', '').replace('Mayor ', '')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, padding: '0 14px 12px', flexWrap: 'wrap' }}>
        {isCarried && (
          <span style={{
            fontSize: 9, borderRadius: 999, padding: '2px 8px',
            background: '#f0fdf4', color: '#22c55e', border: '1px solid #bbf7d0',
          }}>
            carried unanimously
          </span>
        )}
        <span style={{
          fontSize: 9, borderRadius: 999, padding: '2px 8px',
          background: cat.light, color: cat.color, border: `1px solid ${cat.border}`,
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
      `}</style>
    </div>
  );
}
