import { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../styles/tokens';

function formatElapsed(startTime) {
  if (!startTime) return '00:00';
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ClerkNotes({ startTime }) {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [currentTime, setCurrentTime] = useState('00:00');
  const scrollRef = useRef(null);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatElapsed(startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  function addNote() {
    if (!input.trim()) return;
    setNotes(prev => [...prev, { text: input.trim(), time: currentTime }]);
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

      {/* Input */}
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
          {currentTime}
        </span>
      </div>
    </div>
  );
}
