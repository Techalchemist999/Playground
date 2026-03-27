import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';

// Ring + glow colour pairs per category
const BUBBLE_STYLES = {
  topic:        { ring: '#a5b4fc', glow: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  bylaw:        { ring: '#fcd34d', glow: 'rgba(202,138,4,0.1)',    text: '#b45309' },
  department:   { ring: '#fdba74', glow: 'rgba(234,88,12,0.1)',    text: '#c2410c' },
  location:     { ring: '#6ee7b7', glow: 'rgba(5,150,105,0.1)',    text: '#059669' },
  program:      { ring: '#c4b5fd', glow: 'rgba(124,58,237,0.1)',   text: '#7c3aed' },
  policy:       { ring: '#f9a8d4', glow: 'rgba(219,39,119,0.1)',   text: '#db2777' },
  motion:       { ring: '#93c5fd', glow: 'rgba(37,99,235,0.1)',    text: '#1d4ed8' },
  organization: { ring: '#67e8f9', glow: 'rgba(6,182,212,0.1)',    text: '#0e7490' },
  budget:       { ring: '#fcd34d', glow: 'rgba(245,158,11,0.1)',   text: '#92400e' },
  person:       { ring: '#cbd5e1', glow: 'rgba(100,116,139,0.08)', text: '#475569' },
};

function getBubbleSize(mentionCount, compact) {
  const base = compact ? 42 : 54;
  const scale = compact ? 5 : 7;
  const max = compact ? 76 : 100;
  return Math.min(max, base + (mentionCount || 1) * scale);
}

function TopicBubble({ topic, compact }) {
  const bs = BUBBLE_STYLES[topic.category] || BUBBLE_STYLES.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count, compact);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isNew = topic.state === 'DETECTED';
  const isReappeared = topic.state === 'REAPPEARED';
  const opacity = isExpired ? 0.35 : 1;
  const displaySize = isExpired ? size * 0.75 : size;
  const fontSize = compact
    ? Math.max(7.5, Math.min(10, displaySize / 7.5))
    : Math.max(8.5, Math.min(12, displaySize / 8));

  return (
    <div
      role="listitem"
      aria-label={`Topic: ${topic.label}, Category: ${topic.category}, State: ${topic.state}, Mentions: ${topic.mention_count || 1}`}
      style={{
        width: displaySize,
        height: displaySize,
        borderRadius: '50%',
        background: '#fff',
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all .5s cubic-bezier(.22,1,.36,1)',
        animation: isNew ? 'bubbleIn .45s cubic-bezier(.22,1,.36,1)' : isReappeared ? 'bubbleGlow 1s ease' : 'none',
        // Ring + outer halo + glow shadow
        boxShadow: [
          `0 0 0 2.5px ${bs.ring}`,                         // solid ring
          `0 0 0 5px ${bs.ring}20`,                          // soft outer halo
          `0 0 ${isNew ? 28 : 18}px ${bs.glow}`,            // coloured glow
          `0 4px 12px -4px rgba(0,0,0,0.06)`,               // subtle depth
        ].join(', '),
        flexShrink: 0,
      }}
    >
      {/* State dot */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 1, right: 1,
        width: compact ? 5 : 7, height: compact ? 5 : 7,
        borderRadius: '50%',
        background: stateColor,
        border: '1.5px solid #fff',
        boxShadow: `0 0 4px ${stateColor}40`,
      }} />

      <span style={{
        fontSize,
        fontWeight: 600,
        color: bs.text,
        textAlign: 'center',
        padding: '0 5px',
        lineHeight: 1.2,
        maxWidth: displaySize - 14,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        letterSpacing: '-0.2px',
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && !compact && (
        <span style={{
          fontSize: 7.5, fontWeight: 600,
          color: `${bs.text}80`,
          marginTop: 1,
          letterSpacing: '0.3px',
        }}>
          x{topic.mention_count}
        </span>
      )}
    </div>
  );
}

export default function TopicBubbles({ topics, status, compact }) {
  const topicsArray = Array.from(topics.values())
    .filter(t => t.state !== 'EVICTED')
    .sort((a, b) => (b.decay_score || 0) - (a.decay_score || 0));

  const isConnecting = status === 'ACTIVE' && topicsArray.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div
        role="list"
        aria-label="Detected meeting topics"
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: compact ? 10 : 14,
          padding: compact ? '12px 14px' : '16px 20px',
          alignContent: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
        {isConnecting && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '20px 0',
          }}>
            <Spinner size={20} label="Detecting topics" />
            <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.mutedText }}>Analyzing audio...</span>
          </div>
        )}
        {!isConnecting && topicsArray.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            color: COLORS.mutedText, padding: '20px 0',
          }}>
            <svg width={compact ? 24 : 32} height={compact ? 24 : 32} fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 6 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Topics appear as detected...</span>
          </div>
        )}
        {topicsArray.map((topic) => (
          <TopicBubble key={topic.normalized_id || topic.label} topic={topic} compact={compact} />
        ))}
      </div>

      {topicsArray.length > 0 && (
        <div style={{
          padding: '6px 14px 8px',
          borderTop: `1px solid ${COLORS.subtleBorder}`,
          display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {Object.entries(BUBBLE_STYLES)
            .filter(([cat]) => topicsArray.some(t => t.category === cat))
            .map(([cat, bs]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: `0 0 0 1.5px ${bs.ring}, 0 0 6px ${bs.glow}`,
                }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
              </div>
            ))}
        </div>
      )}

      <style>{`
        @keyframes bubbleIn {
          from { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.04); }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleGlow {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.08); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
