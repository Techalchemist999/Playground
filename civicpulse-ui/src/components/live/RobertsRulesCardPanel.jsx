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
      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontWeight: 800,
        fontSize: 15,
        color: '#1e293b',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        marginBottom: 10,
        letterSpacing: '.3px',
        lineHeight: 1.2,
      }}>
        {card.title}
      </div>

      {/* Description */}
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: '#334155',
        lineHeight: 1.45,
        marginBottom: 10,
      }}>
        {card.description}
      </div>

      {/* Phrase */}
      <div style={{
        textAlign: 'center',
        fontSize: 12,
        fontStyle: 'italic',
        fontWeight: 600,
        color: '#1e293b',
        marginBottom: card.note ? 8 : 0,
        lineHeight: 1.4,
      }}>
        &ldquo;{card.phrase}&rdquo;
      </div>

      {/* Optional note */}
      {card.note && (
        <div style={{
          textAlign: 'center',
          fontSize: 9,
          color: '#475569',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {card.note}
        </div>
      )}

      {/* Category + number corners */}
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        fontWeight: 800,
        color: '#1e293b',
      }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>{card.category}</span>
        <span style={{ fontSize: 20, opacity: 0.9 }}>{card.number}</span>
      </div>
    </div>
  );
}

// Small deck tile — click to activate
function DeckTile({ card, active, onClick }) {
  const colors = CARD_COLORS[card.color];
  return (
    <button
      onClick={onClick}
      title={card.title}
      style={{
        background: colors.bg,
        border: active ? `2px solid #1e293b` : `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: '4px 2px',
        cursor: 'pointer',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 7.5,
        fontWeight: 700,
        color: '#1e293b',
        lineHeight: 1.1,
        transform: active ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform .15s',
        overflow: 'hidden',
      }}
    >
      {card.title.length > 18 ? card.title.slice(0, 16) + '…' : card.title}
    </button>
  );
}

export default function RobertsRulesCardPanel({ initialCardId = 'move' }) {
  const [activeId, setActiveId] = useState(initialCardId);
  const card = getCardById(activeId);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 10,
      gap: 10,
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Active card */}
      <div style={{ flexShrink: 0 }}>
        <BigCard card={card} />
      </div>

      {/* Deck picker */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 3,
        paddingRight: 2,
        minHeight: 0,
      }}>
        {ROBERTS_RULES_DECK.map(c => (
          <DeckTile
            key={c.id}
            card={c}
            active={c.id === activeId}
            onClick={() => setActiveId(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
