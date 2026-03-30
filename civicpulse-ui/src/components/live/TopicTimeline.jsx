import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';

export default function TopicTimeline({ topics }) {
  const cat = (topic) => CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const isExpired = (t) => t.state === 'EXPIRED' || t.state === 'EVICTED';

  // Format a fake timestamp based on index (topics don't carry real timestamps yet)
  const fmtTime = (idx) => {
    const base = new Date();
    base.setMinutes(base.getMinutes() - (topics.length - idx) * 4);
    return base.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'relative',
      paddingLeft: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* Vertical timeline rail */}
      <div style={{
        position: 'absolute', left: 7, top: 0, bottom: 0,
        width: 2, background: COLORS.cardBorder, borderRadius: 999,
      }} />

      {topics.map((topic, idx) => {
        const c = cat(topic);
        const expired = isExpired(topic);
        return (
          <div
            key={topic.normalized_id || topic.label}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: expired ? 0.45 : 1,
              transition: 'opacity 1s ease',
              animation: 'tlSlideIn .4s cubic-bezier(.22,1,.36,1) both',
              animationDelay: `${idx * 60}ms`,
            }}
          >
            {/* Dot on the rail */}
            <div style={{
              position: 'absolute', left: -22, top: '50%', transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: expired ? COLORS.cardBorder : '#f1f5f9',
              border: `2px solid ${expired ? COLORS.mutedText : '#94a3b8'}`,
              zIndex: 1,
            }} />

            {/* Card */}
            <div style={{
              flex: 1,
              background: '#fff',
              borderRadius: 8,
              border: `1px solid ${COLORS.cardBorder}`,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {/* Category badge */}
              <span style={{
                fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: .8, background: '#f1f5f9',
                color: '#64748b', padding: '1px 6px', borderRadius: 4,
                flexShrink: 0,
              }}>
                {topic.category}
              </span>

              {/* Label */}
              <span style={{
                fontSize: 11, fontWeight: 600, color: COLORS.headingText,
                flex: 1, lineHeight: 1.3,
              }}>
                {topic.label}
              </span>

              {/* Mention count */}
              {topic.mention_count > 1 && (
                <span style={{
                  fontSize: 9, fontWeight: 600, color: '#64748b',
                  background: '#f1f5f9', border: '1px solid #cbd5e1',
                  borderRadius: 999, padding: '0 5px', flexShrink: 0,
                }}>
                  x{topic.mention_count}
                </span>
              )}

              {/* Timestamp */}
              <span style={{
                fontSize: 9, color: COLORS.mutedText, fontWeight: 500,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {topic.first_seen
                  ? new Date(topic.first_seen).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : fmtTime(idx)}
              </span>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes tlSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
