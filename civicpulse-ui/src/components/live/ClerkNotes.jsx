import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../styles/tokens';

function getTimeOfDay() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ClerkNotes() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [clock, setClock] = useState(getTimeOfDay());
  const scrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setClock(getTimeOfDay()), 10000);
    return () => clearInterval(interval);
  }, []);

  function addNote() {
    if (!input.trim()) return;
    setNotes(prev => [...prev, { text: input.trim(), time: getTimeOfDay() }]);
    setInput('');
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}
      >
        {notes.length === 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: COLORS.mutedText, fontSize: 11, fontStyle: 'italic',
          }}>
            Notes appear here as you type them...
          </div>
        )}
        {notes.map((note, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8, padding: '5px 0',
            borderBottom: i < notes.length - 1 ? `1px solid ${COLORS.subtleBorder}` : 'none',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: COLORS.primary,
              background: COLORS.primaryLight, borderRadius: 4,
              padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0,
              height: 'fit-content', marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {note.time}
            </span>
            <span style={{ fontSize: 12, color: COLORS.bodyText, lineHeight: 1.7 }}>
              {note.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${COLORS.subtleBorder}`,
        display: 'flex', gap: 6, flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
          placeholder="Type a note..."
          aria-label="Add a clerk note"
          style={{
            flex: 1, background: '#f8fafc', border: `1px dashed #cbd5e1`,
            borderRadius: 8, padding: '7px 10px', fontSize: 11.5,
            color: COLORS.bodyText, fontFamily: 'inherit', outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = COLORS.primaryBorder}
          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
        />
        <span style={{
          fontSize: 10, fontWeight: 600, color: COLORS.primaryBorder,
          display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums',
        }}>
          {clock}
        </span>
      </div>
    </div>
  );
}
