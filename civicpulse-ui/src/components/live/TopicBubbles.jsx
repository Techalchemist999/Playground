import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';

// Pearlescent color pairs — soft, muted, multi-tone like Apple
const PEARL_PALETTES = {
  topic:        ['#818cf8', '#c4b5fd', '#e0e7ff'],  // soft indigo → lavender
  bylaw:        ['#fbbf24', '#fde68a', '#fef9c3'],  // warm gold → cream
  department:   ['#fb923c', '#fdba74', '#ffedd5'],  // peach → apricot
  location:     ['#34d399', '#6ee7b7', '#d1fae5'],  // mint → seafoam
  program:      ['#a78bfa', '#c4b5fd', '#ede9fe'],  // violet → wisteria
  policy:       ['#f472b6', '#fbcfe8', '#fce7f3'],  // rose → blush
  motion:       ['#60a5fa', '#93c5fd', '#dbeafe'],  // sky → ice
  organization: ['#22d3ee', '#67e8f9', '#cffafe'],  // cyan → frost
  budget:       ['#fbbf24', '#fcd34d', '#fef3c7'],  // amber → buttercream
  person:       ['#94a3b8', '#cbd5e1', '#f1f5f9'],  // slate → pearl
};

function getBubbleSize(mentionCount, compact) {
  const base = compact ? 40 : 52;
  const scale = compact ? 5 : 8;
  const max = compact ? 78 : 110;
  return Math.min(max, base + (mentionCount || 1) * scale);
}

function TopicBubble({ topic, compact }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const pearl = PEARL_PALETTES[topic.category] || PEARL_PALETTES.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count, compact);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isNew = topic.state === 'DETECTED';
  const isReappeared = topic.state === 'REAPPEARED';
  const opacity = isExpired ? 0.35 : (topic.decay_score != null ? Math.max(0.55, topic.decay_score) : 1);
  const displaySize = isExpired ? size * 0.7 : size;
  const fontSize = compact ? Math.max(8, Math.min(10.5, displaySize / 7.5)) : Math.max(9, Math.min(12.5, displaySize / 8));

  // Pearlescent gradient — soft colour wash that shifts across the sphere
  const bg = `linear-gradient(135deg, ${pearl[2]} 0%, ${pearl[1]} 35%, ${pearl[0]} 70%, ${cat.color}cc 100%)`;

  return (
    <div
      role="listitem"
      aria-label={`Topic: ${topic.label}, Category: ${topic.category}, State: ${topic.state}, Mentions: ${topic.mention_count || 1}`}
      style={{
        width: displaySize,
        height: displaySize,
        borderRadius: '50%',
        background: bg,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all .6s cubic-bezier(.22,1,.36,1)',
        animation: isNew ? 'bubbleIn .5s cubic-bezier(.22,1,.36,1)' : isReappeared ? 'bubbleGlow 1s ease' : 'none',
        boxShadow: isNew
          ? `0 0 0 2px ${pearl[1]}80, 0 8px 24px -4px ${cat.color}20`
          : isReappeared
          ? `0 0 0 2px ${pearl[1]}60, 0 6px 20px -4px ${cat.color}18`
          : `0 4px 16px -4px ${cat.color}15`,
        border: `1px solid ${pearl[1]}90`,
        flexShrink: 0,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Soft pearlescent sheen — top highlight */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: '50%',
        background: `radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* State indicator — subtle */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 3, right: 3,
        width: compact ? 5 : 7, height: compact ? 5 : 7, borderRadius: '50%',
        background: stateColor,
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: `0 0 6px ${stateColor}50`,
      }} />

      <span style={{
        fontSize, fontWeight: 600, color: cat.color,
        textAlign: 'center', padding: '0 5px',
        lineHeight: 1.2, maxWidth: displaySize - 12,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        position: 'relative', zIndex: 1,
        letterSpacing: '-0.2px',
        // Subtle text shadow that works with coloured text on light pearl bg
        textShadow: '0 0.5px 2px rgba(255,255,255,0.8)',
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && !compact && (
        <span style={{
          fontSize: 8, fontWeight: 600,
          color: `${cat.color}99`,
          marginTop: 1, position: 'relative', zIndex: 1,
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
          gap: compact ? 8 : 12,
          padding: compact ? '10px 12px' : 16,
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
          padding: '6px 12px 8px',
          borderTop: `1px solid ${COLORS.subtleBorder}`,
          display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {Object.entries(CATEGORY_COLORS)
            .filter(([cat]) => topicsArray.some(t => t.category === cat))
            .map(([cat, colors]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${(PEARL_PALETTES[cat] || PEARL_PALETTES.topic)[1]}, ${colors.color})`,
                }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
              </div>
            ))}
        </div>
      )}

      <style>{`
        @keyframes bubbleIn {
          from { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.05); }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleGlow {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}
