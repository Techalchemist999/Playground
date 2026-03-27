import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';

function getBubbleSize(mentionCount, compact) {
  const base = compact ? 38 : 48;
  const scale = compact ? 6 : 10;
  const max = compact ? 80 : 120;
  return Math.min(max, base + (mentionCount || 1) * scale);
}

function TopicBubble({ topic, compact }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count, compact);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isNew = topic.state === 'DETECTED';
  const isReappeared = topic.state === 'REAPPEARED';
  const opacity = isExpired ? 0.25 : (topic.decay_score != null ? Math.max(0.5, topic.decay_score) : 1);
  const displaySize = isExpired ? size * 0.65 : size;
  const fontSize = compact ? Math.max(8, Math.min(11, displaySize / 7)) : Math.max(9, Math.min(13, displaySize / 8));

  return (
    <div
      role="listitem"
      aria-label={`Topic: ${topic.label}, Category: ${topic.category}, State: ${topic.state}, Mentions: ${topic.mention_count || 1}`}
      style={{
        width: displaySize,
        height: displaySize,
        borderRadius: '50%',
        // Glossy gradient — shiny glass effect
        background: `radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 40%, ${cat.color} 70%, ${cat.color}dd 100%)`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all .5s cubic-bezier(.22,1,.36,1)',
        animation: isNew ? 'bubbleIn .4s ease' : isReappeared ? 'bubbleGlow .8s ease' : 'none',
        boxShadow: isNew
          ? `inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 0 3px ${cat.color}40, 0 6px 20px ${cat.color}35`
          : isReappeared
          ? `inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 0 3px #f59e0b50, 0 4px 16px ${cat.color}25`
          : `inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 4px 14px ${cat.color}25`,
        flexShrink: 0,
        border: `1px solid rgba(255,255,255,0.2)`,
      }}
    >
      {/* Gloss highlight */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '8%',
        left: '18%',
        width: '40%',
        height: '30%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
      }} />

      {/* State indicator dot */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 2, right: 2,
        width: compact ? 6 : 8, height: compact ? 6 : 8, borderRadius: '50%',
        background: stateColor,
        border: '1.5px solid rgba(255,255,255,0.8)',
        boxShadow: `0 0 4px ${stateColor}80`,
      }} />

      <span style={{
        fontSize, fontWeight: 700, color: '#fff',
        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        textAlign: 'center', padding: '0 4px',
        lineHeight: 1.15, maxWidth: displaySize - 10,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        position: 'relative',
        zIndex: 1,
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && !compact && (
        <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginTop: 1, position: 'relative', zIndex: 1 }}>
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
      {/* Bubble area */}
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
            <svg width={compact ? 24 : 36} height={compact ? 24 : 36} fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 6 }} aria-hidden="true">
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

      {/* Category legend — only when we have topics */}
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
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: colors.color }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
              </div>
            ))}
        </div>
      )}

      <style>{`
        @keyframes bubbleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bubbleGlow {
          0% { box-shadow: inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 0 0 rgba(245,158,11,0.6); }
          50% { box-shadow: inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 0 8px rgba(245,158,11,0); }
          100% { box-shadow: inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.3), 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>
    </div>
  );
}
