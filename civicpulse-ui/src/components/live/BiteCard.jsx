import { useState } from 'react';
import { COLORS, CATEGORY_COLORS } from '../../styles/tokens';

const DISPOSITION = {
  carried:    { label: 'CARRIED UNANIMOUSLY', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', positive: true },
  active:     { label: 'IN PROGRESS', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', positive: true },
  pending:    { label: 'PENDING', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', positive: false },
  defeated:   { label: 'DEFEATED', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', positive: false },
};

export default function BiteCard({ topic, index, isNewest }) {
  const [tab, setTab] = useState('motion');

  const isActive = topic.state === 'ACTIVE' || topic.state === 'DETECTED';
  const isCarried = topic.state === 'EXPIRED';
  const disp = isCarried ? DISPOSITION.carried : isActive ? DISPOSITION.active : DISPOSITION.pending;
  const cat = CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.topic;

  // Simulated mover/seconder based on index pattern (PoC — in prod these come from the motion data)
  const movers = ['Mayor Veach', 'Cllr Rabel', 'Cllr Wall', 'Cllr Johnston', 'Cllr Woodill'];
  const mover = movers[index % movers.length];
  const seconder = movers[(index + 1) % movers.length];

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `1px solid ${COLORS.cardBorder}`,
      overflow: 'hidden',
      animation: isNewest ? 'slideUp .5s cubic-bezier(.22,1,.36,1)' : 'none',
      transition: 'all .2s',
    }}>
      {/* Colour top bar */}
      <div style={{ height: 2.5, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}66, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '11px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.3,
              textTransform: 'uppercase', color: COLORS.mutedText, marginBottom: 3,
            }}>
              {topic.category} · Item {index + 1}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText, lineHeight: 1.3, marginBottom: 2 }}>
              {topic.label}
            </div>
          </div>
          {/* Disposition badge */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            background: disp.bg, border: `1.5px solid ${disp.border}`,
            borderRadius: 999, padding: '3px 9px',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: disp.color }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, color: disp.color }}>{disp.label}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', marginLeft: -14, marginRight: -14, paddingLeft: 14,
          borderTop: `1px solid ${COLORS.subtleBorder}`,
        }}>
          {[['motion', 'Motion'], ['context', 'Context']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11.5,
                fontWeight: 600,
                color: tab === id ? cat.color : COLORS.mutedText,
                borderBottom: `2px solid ${tab === id ? cat.color : 'transparent'}`,
                marginBottom: -1,
                transition: 'all .15s',
                fontFamily: 'inherit',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '11px 14px 12px' }}>
        {tab === 'motion' && (
          <div>
            {/* Motion text in blockquote style */}
            <div style={{
              background: '#f8fafc',
              borderLeft: `3px solid ${cat.color}`,
              borderRadius: '0 8px 8px 0',
              padding: '9px 12px',
              marginBottom: 8,
            }}>
              <p style={{
                margin: 0, fontSize: 11.5, color: COLORS.bodyText,
                lineHeight: 1.75, whiteSpace: 'pre-line',
              }}>
                THAT Council {isCarried ? 'approved' : 'approves'} the {topic.label.toLowerCase()} as presented.
              </p>
            </div>

            {/* Mover / Seconder tiles */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[['Moved By', mover], ['Seconded By', seconder]].map(([label, name]) => (
                <div key={label} style={{
                  flex: 1, background: '#f8fafc',
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 7, padding: '6px 9px',
                }}>
                  <div style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: 1.2,
                    textTransform: 'uppercase', color: COLORS.mutedText, marginBottom: 2,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.headingText }}>
                    {name}
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 9.5, borderRadius: 999, padding: '2px 8px',
                background: cat.light, color: cat.color, border: `1px solid ${cat.border}`,
              }}>
                {topic.category}
              </span>
              {topic.mention_count > 1 && (
                <span style={{
                  fontSize: 9.5, borderRadius: 999, padding: '2px 8px',
                  background: '#f8fafc', color: COLORS.secondaryText, border: `1px solid ${COLORS.cardBorder}`,
                }}>
                  x{topic.mention_count} mentions
                </span>
              )}
            </div>
          </div>
        )}

        {tab === 'context' && (
          <div>
            <p style={{
              margin: '0 0 10px', fontSize: 11.5, color: COLORS.bodyText,
              lineHeight: 1.8,
            }}>
              {topic.summary || `${topic.label} was discussed during the meeting with a confidence of ${((topic.confidence || 0) * 100).toFixed(0)}%. It was mentioned ${topic.mention_count || 1} time(s) and categorised as "${topic.category}".`}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['Confidence', `${((topic.confidence || 0) * 100).toFixed(0)}%`], ['Mentions', String(topic.mention_count || 1)]].map(([k, v]) => (
                <div key={k} style={{
                  flex: 1, background: cat.light, border: `1px solid ${cat.border}`,
                  borderRadius: 7, padding: '5px 9px',
                }}>
                  <div style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: 1.2,
                    textTransform: 'uppercase', color: cat.color, opacity: 0.8, marginBottom: 2,
                  }}>
                    {k}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.bodyText }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
