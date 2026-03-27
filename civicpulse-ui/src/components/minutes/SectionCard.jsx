import { useState, useRef } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';

const STATUS_LABELS = {
  original: { label: 'Original', color: COLORS.mutedText },
  edited: { label: 'Edited', color: COLORS.primary },
  regenerated: { label: 'Regenerated', color: '#f59e0b' },
};

export default function SectionCard({ section, index, onUpdate, onRegenerate }) {
  const [isOpen, setIsOpen] = useState(true);
  const [regenerating, setRegenearing] = useState(false);
  const contentRef = useRef(null);
  const st = STATUS_LABELS[section.status] || STATUS_LABELS.original;

  async function handleRegenerate() {
    setRegenearing(true);
    try {
      await onRegenerate(index);
    } finally {
      setRegenearing(false);
    }
  }

  function handleBlur() {
    if (contentRef.current) {
      const html = contentRef.current.innerHTML;
      if (html !== section.html) {
        onUpdate(index, html);
      }
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: SPACING.cardRadius,
      border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: isOpen ? '#fafbfc' : '#fff',
          border: 'none',
          borderBottom: isOpen ? `1px solid ${COLORS.subtleBorder}` : 'none',
          borderLeft: `4px solid ${COLORS.primary}`,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText, flex: 1, textAlign: 'left' }}>
          {section.name}
        </span>

        <span style={{
          fontSize: 9.5, fontWeight: 600, color: st.color,
          background: `${st.color}12`, borderRadius: 4, padding: '2px 7px',
        }}>
          {st.label}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); handleRegenerate(); }}
          disabled={regenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 6, padding: '4px 8px',
            fontSize: 10.5, fontWeight: 600, color: COLORS.secondaryText,
            cursor: 'pointer', opacity: regenerating ? 0.5 : 1,
          }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>

        <svg
          width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: '16px 20px' }}>
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            dangerouslySetInnerHTML={{ __html: section.html || '<p><em>No content for this section.</em></p>' }}
            style={{
              fontSize: 13,
              color: COLORS.bodyText,
              lineHeight: 1.8,
              outline: 'none',
              minHeight: 40,
            }}
          />
        </div>
      )}
    </div>
  );
}
