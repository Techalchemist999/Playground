import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import { cardStyle } from '../../styles/shared';

function getBubbleSize(mentionCount) {
  return Math.min(120, 48 + (mentionCount || 1) * 10);
}

function TopicBubble({ topic }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isNew = topic.state === 'DETECTED';
  const isReappeared = topic.state === 'REAPPEARED';
  const opacity = isExpired ? 0.3 : (topic.decay_score != null ? Math.max(0.4, topic.decay_score) : 1);
  const displaySize = isExpired ? size * 0.7 : size;
  const fontSize = Math.max(9, Math.min(13, displaySize / 8));

  return (
    <div
      style={{
        width: displaySize,
        height: displaySize,
        borderRadius: '50%',
        background: cat.color,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all .5s cubic-bezier(.22,1,.36,1)',
        animation: isNew ? 'bubbleIn .4s ease' : isReappeared ? 'bubbleGlow .8s ease' : 'none',
        boxShadow: isNew
          ? `0 0 0 4px ${cat.color}40, 0 4px 16px ${cat.color}30`
          : isReappeared
          ? `0 0 0 3px #f59e0b60, 0 4px 12px ${cat.color}20`
          : `0 4px 12px ${cat.color}20`,
        cursor: 'default',
        flexShrink: 0,
      }}
      title={`${topic.label}\nCategory: ${topic.category}\nState: ${topic.state}\nConfidence: ${((topic.confidence || 0) * 100).toFixed(0)}%\nMentions: ${topic.mention_count || 1}\nDecay: ${(topic.decay_score || 0).toFixed(2)}`}
    >
      {/* State indicator dot */}
      <div style={{
        position: 'absolute',
        top: 3,
        right: 3,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: stateColor,
        border: '1.5px solid rgba(255,255,255,0.8)',
      }} />

      <span style={{
        fontSize,
        fontWeight: 700,
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
        textAlign: 'center',
        padding: '0 6px',
        lineHeight: 1.2,
        maxWidth: displaySize - 12,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && (
        <span style={{
          fontSize: 8,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.8)',
          marginTop: 1,
        }}>
          x{topic.mention_count}
        </span>
      )}
    </div>
  );
}

export default function TopicBubbles({ topics }) {
  const topicsArray = Array.from(topics.values())
    .filter(t => t.state !== 'EVICTED')
    .sort((a, b) => (b.decay_score || 0) - (a.decay_score || 0));

  const activeCount = topicsArray.filter(t => t.state === 'ACTIVE' || t.state === 'DETECTED' || t.state === 'REAPPEARED').length;

  return (
    <div style={{
      ...cardStyle,
      flex: 1.5,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${COLORS.subtleBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText }}>Live Topics</span>
          <div style={{
            background: COLORS.primaryLight,
            border: `1px solid ${COLORS.primaryBorder}`,
            borderRadius: 999, padding: '1px 8px',
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary }}>{activeCount} active</span>
          </div>
        </div>
        <span style={{ fontSize: 10, color: COLORS.mutedText }}>{topicsArray.length} total</span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 16,
        alignContent: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
      }}>
        {topicsArray.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            color: COLORS.mutedText,
          }}>
            <svg width="36" height="36" fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Topics will appear here as they're detected...</span>
          </div>
        )}
        {topicsArray.map((topic) => (
          <TopicBubble key={topic.normalized_id || topic.label} topic={topic} />
        ))}
      </div>

      {/* Category legend */}
      {topicsArray.length > 0 && (
        <div style={{
          padding: '8px 16px 10px',
          borderTop: `1px solid ${COLORS.subtleBorder}`,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {Object.entries(CATEGORY_COLORS)
            .filter(([cat]) => topicsArray.some(t => t.category === cat))
            .map(([cat, colors]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.color }} />
                <span style={{ fontSize: 9.5, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
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
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.6); }
          50% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
      `}</style>
    </div>
  );
}
