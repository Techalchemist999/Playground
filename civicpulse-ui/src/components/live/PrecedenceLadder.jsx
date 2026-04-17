import { useState, useEffect } from 'react';
import { ROBERTS_RULES_DECK, getCardById } from '../../data/robertsRulesDeck';

const CATEGORY_LABELS = {
  M: 'Majority',
  C: 'Incidental',
  '2/3': '⅔ Vote',
};

export default function PrecedenceLadder({ activeId: controlledId, onActiveChange, initialCardId = 'move', theme }) {
  const [uncontrolledId] = useState(initialCardId);
  const onFloorId = controlledId ?? uncontrolledId;

  const [inspectedId, setInspectedId] = useState(onFloorId);
  useEffect(() => { setInspectedId(onFloorId); }, [onFloorId]);

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
          const isOnFloor = card.id === onFloorId;
          const isInspected = card.id === inspectedId;
          const isExpanded = isOnFloor || isInspected;

          return (
            <button
              key={card.id}
              onClick={() => setInspectedId(card.id)}
              onDoubleClick={() => { if (onActiveChange) onActiveChange(card.id); }}
              title={isOnFloor ? 'On The Floor (double-click another to move the floor)' : 'Click to inspect · double-click to set on floor'}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                width: '100%',
                padding: isExpanded ? '9px 10px' : '5px 8px',
                marginBottom: 3,
                background: isOnFloor
                  ? '#fff'
                  : isInspected
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.55)',
                border: isOnFloor
                  ? `1.5px solid ${accent}`
                  : isInspected
                    ? `1.5px dashed ${accent}aa`
                    : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: isOnFloor ? `0 4px 14px ${accent}33` : 'none',
                transition: 'all .15s',
                textAlign: 'left',
                position: 'relative',
                zIndex: 1,
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!isOnFloor && !isInspected) { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateX(3px)'; } }}
              onMouseLeave={e => { if (!isOnFloor && !isInspected) { e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'translateX(0)'; } }}
            >
              <div style={{
                width: isExpanded ? 34 : 28,
                height: isExpanded ? 34 : 28,
                borderRadius: '50%',
                background: isOnFloor ? accent : '#fff',
                border: `2px ${isInspected && !isOnFloor ? 'dashed' : 'solid'} ${isOnFloor ? accent : isInspected ? accent : '#cbd5e1'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isExpanded ? 13 : 11,
                fontWeight: 900,
                color: isOnFloor ? '#fff' : isInspected ? accent : '#475569',
                flexShrink: 0,
                marginTop: isExpanded ? 0 : 0,
                transition: 'all .15s',
              }}>
                {card.number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    fontSize: isExpanded ? 13 : 11,
                    fontWeight: isExpanded ? 900 : 700,
                    color: '#1e293b',
                    lineHeight: 1.2,
                    flex: 1, minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {card.title}
                  </div>
                  {isOnFloor && (
                    <span
                      title="On The Floor"
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: accent, flexShrink: 0,
                        boxShadow: `0 0 0 3px ${accent}33`,
                      }}
                    />
                  )}
                  {!isExpanded && (
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
                </div>
                {isExpanded && (
                  <div style={{
                    fontSize: 10,
                    color: '#475569',
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}>
                    {card.description}
                  </div>
                )}
                {isExpanded && (
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
