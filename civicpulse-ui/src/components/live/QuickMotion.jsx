import { useState } from 'react';
import { COLORS } from '../../styles/tokens';

const COUNCILLORS = ['Mayor Veach', 'Cllr Rabel', 'Cllr Wall', 'Cllr Johnston', 'Cllr Woodill'];

export default function QuickMotion({ onRecord }) {
  const [text, setText] = useState('');
  const [mover, setMover] = useState('');
  const [seconder, setSeconder] = useState('');

  function handleRecord() {
    if (!text.trim()) return;
    if (onRecord) onRecord({ text: text.trim(), mover, seconder });
    setText('');
    setMover('');
    setSeconder('');
  }

  return (
    <div style={{
      borderTop: `1px solid ${COLORS.cardBorder}`,
      background: '#fafaff',
      padding: '10px 14px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <svg width="12" height="12" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, color: COLORS.primary,
        }}>
          Quick Motion
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="THAT Council approves the..."
          aria-label="Motion text"
          style={{
            flex: 1, background: '#fff', border: `1.5px solid ${COLORS.primaryBorder}`,
            borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: COLORS.bodyText,
            fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#818cf8'}
          onBlur={(e) => e.target.style.borderColor = COLORS.primaryBorder}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRecord(); }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <select
          value={mover}
          onChange={(e) => setMover(e.target.value)}
          aria-label="Motion mover"
          style={{
            flex: 1, background: '#fff', border: `1.5px solid ${COLORS.primaryBorder}`,
            borderRadius: 8, padding: '7px 10px', fontSize: 11, color: COLORS.secondaryText,
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="">Mover</option>
          {COUNCILLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={seconder}
          onChange={(e) => setSeconder(e.target.value)}
          aria-label="Motion seconder"
          style={{
            flex: 1, background: '#fff', border: `1.5px solid ${COLORS.primaryBorder}`,
            borderRadius: 8, padding: '7px 10px', fontSize: 11, color: COLORS.secondaryText,
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <option value="">Seconder</option>
          {COUNCILLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          onClick={handleRecord}
          disabled={!text.trim()}
          aria-label="Record motion"
          style={{
            background: COLORS.primaryGradient, color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 16px',
            fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
            boxShadow: `0 2px 8px ${COLORS.primaryShadow}`,
            display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
          }}
        >
          <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record
        </button>
      </div>
    </div>
  );
}
