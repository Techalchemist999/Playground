import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';

const DISP = {
  carried: { label: 'CARRIED', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  active:  { label: 'ACTIVE', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  expired: { label: 'FADING', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
  pending: { label: 'DETECTED', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
};

export default function TopicCard({ topic }) {
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;
  const isActive = topic.state === 'ACTIVE' || topic.state === 'DETECTED';
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const disp = isExpired ? DISP.expired : isActive ? (topic.state === 'DETECTED' ? DISP.pending : DISP.active) : DISP.active;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      border: `1px solid ${COLORS.cardBorder}`,
      overflow: 'hidden',
      opacity: isExpired ? 0.5 : 1,
      transition: 'opacity 1s ease',
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}44, transparent)` }} />
      <div style={{ padding: '7px 9px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: COLORS.mutedText }}>
              {topic.category}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.headingText, lineHeight: 1.3 }}>
              {topic.label}
            </div>
          </div>
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
            background: disp.bg, border: `1px solid ${disp.border}`,
            borderRadius: 999, padding: '1px 6px',
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: disp.color }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: disp.color }}>{disp.label}</span>
          </div>
        </div>
        {topic.mention_count > 1 && (
          <span style={{
            fontSize: 8, color: COLORS.mutedText,
          }}>
            x{topic.mention_count} mentions
          </span>
        )}
      </div>
    </div>
  );
}
