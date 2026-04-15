import { useState } from 'react';
import { ROBERTS_RULES_DECK, CARD_COLORS, getCardById } from '../../data/robertsRulesDeck';

// Big card display — mirrors the PDF card style
function BigCard({ card }) {
  const colors = CARD_COLORS[card.color];
  return (
    <div style={{
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderRadius: 14,
      padding: '14px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minHeight: 180,
      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        textAlign: 'center', fontWeight: 800, fontSize: 15,
        color: '#1e293b', textDecoration: 'underline', textUnderlineOffset: 3,
        marginBottom: 10, letterSpacing: '.3px', lineHeight: 1.2,
      }}>
        {card.title}
      </div>
      <div style={{
        textAlign: 'center', fontSize: 11, color: '#334155',
        lineHeight: 1.45, marginBottom: 10,
      }}>
        {card.description}
      </div>
      <div style={{
        textAlign: 'center', fontSize: 12, fontStyle: 'italic', fontWeight: 600,
        color: '#1e293b', marginBottom: card.note ? 8 : 0, lineHeight: 1.4,
      }}>
        &ldquo;{card.phrase}&rdquo;
      </div>
      {card.note && (
        <div style={{
          textAlign: 'center', fontSize: 9, color: '#475569',
          marginBottom: 4, lineHeight: 1.3,
        }}>
          {card.note}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        fontWeight: 800, color: '#1e293b',
      }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>{card.category}</span>
        <span style={{ fontSize: 20, opacity: 0.9 }}>{card.number}</span>
      </div>
    </div>
  );
}

// Small deck tile — click to activate
function DeckTile({ card, active, onClick, disabled }) {
  const colors = CARD_COLORS[card.color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${card.title} — lower precedence, can't play now` : card.title}
      style={{
        background: disabled ? '#e2e8f0' : colors.bg,
        border: active ? `2px solid #1e293b` : `1px solid ${disabled ? '#cbd5e1' : colors.border}`,
        borderRadius: 6,
        padding: '4px 2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 7.5,
        fontWeight: 700,
        color: disabled ? '#94a3b8' : '#1e293b',
        lineHeight: 1.1,
        opacity: disabled ? 0.55 : 1,
        transform: active ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform .15s, background .15s',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <span style={{ position: 'absolute', top: 2, right: 3, fontSize: 7, opacity: 0.6 }}>{card.number}</span>
      <span style={{ padding: '0 2px' }}>
        {card.title.length > 16 ? card.title.slice(0, 14) + '…' : card.title}
      </span>
    </button>
  );
}

// Tab button
function TabButton({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 8px',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        background: active ? '#fff' : 'transparent',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        fontSize: 10,
        fontWeight: 700,
        color: active ? '#1e293b' : '#64748b',
        transition: 'all .15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
      }}
    >
      {label}
      {count != null && (
        <span style={{
          fontSize: 8,
          fontWeight: 800,
          padding: '1px 5px',
          borderRadius: 8,
          background: active ? '#1e293b' : '#cbd5e1',
          color: active ? '#fff' : '#64748b',
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function RobertsRulesCardPanel({ initialCardId = 'move' }) {
  const [activeId, setActiveId] = useState(initialCardId);
  const [view, setView] = useState('floor'); // 'floor' | 'options'
  const card = getCardById(activeId);

  const options = ROBERTS_RULES_DECK.filter(c => c.number > card.number);

  const playCard = (id) => {
    setActiveId(id);
    setView('floor');
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 10,
      gap: 8,
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Tab toggle */}
      <div style={{
        display: 'flex',
        background: '#f1f5f9',
        borderRadius: 7,
        padding: 2,
        gap: 2,
        flexShrink: 0,
      }}>
        <TabButton label="On The Floor" active={view === 'floor'} onClick={() => setView('floor')} />
        <TabButton label="Options" count={options.length} active={view === 'options'} onClick={() => setView('options')} />
      </div>

      {view === 'floor' ? (
        <>
          <div style={{ flexShrink: 0 }}>
            <BigCard card={card} />
          </div>
          {/* Reset */}
          <button
            onClick={() => setActiveId('move')}
            style={{
              alignSelf: 'center',
              marginTop: 4,
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 9,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            ↻ Reset to MOVE
          </button>
        </>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: 9,
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.4,
            flexShrink: 0,
          }}>
            Higher precedence than <b>{card.title}</b> (#{card.number}) — click to play
          </div>
          {options.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: 11,
              fontStyle: 'italic',
              padding: 20,
              textAlign: 'center',
            }}>
              Highest precedence already in play — no options above this.
            </div>
          ) : (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
              paddingRight: 2,
              alignContent: 'start',
            }}>
              {options.map(c => (
                <DeckTile key={c.id} card={c} active={false} onClick={() => playCard(c.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
