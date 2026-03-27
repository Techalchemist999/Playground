import { useRef, useEffect, useState } from 'react';
import { COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';

function formatTs(seconds) {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TranscriptPanel({ transcript, status, embedded }) {
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, autoScroll]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }

  const isConnecting = status === 'ACTIVE' && transcript.length === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Live transcript"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px 16px',
        }}
      >
        {isConnecting && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 10,
          }}>
            <Spinner size={24} label="Connecting to audio stream" />
            <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.mutedText }}>Connecting to audio stream...</span>
            <span style={{ fontSize: 10.5, color: COLORS.mutedText }}>Transcript will appear as speech is detected</span>
          </div>
        )}
        {!isConnecting && transcript.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', color: COLORS.mutedText,
          }}>
            <svg width="28" height="28" fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }} aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Waiting for transcript...</span>
          </div>
        )}
        {transcript.map((chunk, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '5px 0',
              borderBottom: i < transcript.length - 1 ? `1px solid ${COLORS.subtleBorder}` : 'none',
              animation: i === transcript.length - 1 ? 'fadeIn .3s ease' : 'none',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: COLORS.mutedText,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              paddingTop: 2,
              minWidth: 36,
            }}>
              {formatTs(chunk.timestamp_start)}
            </span>
            <span style={{ fontSize: 12.5, color: COLORS.bodyText, lineHeight: 1.7 }}>
              {chunk.text}
            </span>
          </div>
        ))}
      </div>

      {!autoScroll && transcript.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }}
          aria-label="Jump to latest transcript entry"
          style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: COLORS.primaryGradient, color: '#fff',
            border: 'none', borderRadius: 999, padding: '4px 12px',
            fontSize: 10.5, fontWeight: 600,
            boxShadow: `0 2px 10px ${COLORS.primaryShadow}`,
          }}
        >
          Jump to latest
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
