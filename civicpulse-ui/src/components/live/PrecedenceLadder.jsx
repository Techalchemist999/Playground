import { useState } from 'react';
import { ROBERTS_RULES_DECK, getCardById } from '../../data/robertsRulesDeck';

const CATEGORY_LABELS = {
  M: 'Majority',
  C: 'Incidental',
  '2/3': '⅔ Vote',
};

export default function PrecedenceLadder({ activeId: controlledId, onActiveChange, initialCardId = 'move', theme }) {
  const [uncontrolledId, setUncontrolledId] = useState(initialCardId);
  const activeId = controlledId ?? uncontrolledId;
  const setActiveId = (id) => {
    if (onActiveChange) onActiveChange(id);
    if (controlledId == null) setUncontrolledId(id);
  };
  const active = getCardById(activeId);

  const accent = theme?.accent || '#10b981';
  const themeBg = theme?.bg || '#ffffff';
  const isGradient = themeBg.includes('gradient');

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      ...(isGradient ? { backgroundImage: themeBg } : { background: themeBg }),
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px 14px',
        position: 'relative',
      }}>
        {/* Vertical spine */}
        <div style={{
          position: 'absolute',
          left: 32,
          top: 18,
          bottom: 18,
          width: 2,
          background: `linear-gradient(180deg, ${accent}cc, ${accent}44)`,
          borderRadius: 1,
          pointerEvents: 'none',
        }} />

        {ROBERTS_RULES_DECK.map(card => {
          const isActive = card.id === activeId;
          return (
            <button
              key={card.id}
              onClick={() => setActiveId(card.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: isActive ? '9px 10px' : '5px 8px',
                marginBottom: 3,
                background: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                border: isActive ? `1.5px solid ${accent}` : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: isActive ? `0 4px 14px ${accent}33` : 'none',
                transition: 'all .15s',
                textAlign: 'left',
                position: 'relative',
                zIndex: 1,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateX(3px)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'translateX(0)'; } }}
            >
              <div style={{
                width: isActive ? 34 : 28,
                height: isActive ? 34 : 28,
                borderRadius: '50%',
                background: isActive ? '#fff' : 'rgba(255,255,255,0.9)',
                border: `2px solid ${isActive ? accent : '#cbd5e1'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isActive ? 13 : 11,
                fontWeight: 900,
                color: isActive ? accent : '#475569',
                flexShrink: 0,
                transition: 'all .15s',
              }}>
                {card.number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isActive ? 13 : 11,
                  fontWeight: isActive ? 900 : 700,
                  color: '#1e293b',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {card.title}
                </div>
                {isActive && (
                  <div style={{
                    fontSize: 10,
                    color: '#475569',
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}>
                    {card.description}
                  </div>
                )}
                {isActive && (
                  <div style={{
                    fontSize: 10.5,
                    fontStyle: 'italic',
                    color: accent,
                    marginTop: 5,
                    lineHeight: 1.4,
                  }}>
                    &ldquo;{card.phrase}&rdquo;
                  </div>
                )}
              </div>
              {isActive ? (
                <span style={{
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#fff',
                  background: accent,
                  padding: '3px 7px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  On The Floor
                </span>
              ) : (
                <span style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: .8,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}>
                  {CATEGORY_LABELS[card.category] || card.category}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
