import { useRef, useEffect, useState } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';
import { cardStyle } from '../../styles/shared';

function formatTs(seconds) {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TranscriptPanel({ transcript }) {
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

  return (
    <div style={{
      ...cardStyle,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 280,
      flex: 1,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${COLORS.subtleBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText }}>Transcript</span>
          <div style={{
            background: COLORS.primaryLight,
            border: `1px solid ${COLORS.primaryBorder}`,
            borderRadius: 999, padding: '1px 8px',
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.primary }}>{transcript.length}</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 16px 16px',
        }}
      >
        {transcript.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', color: COLORS.mutedText,
          }}>
            <svg width="28" height="28" fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }}>
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
              padding: '6px 0',
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
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: COLORS.primaryGradient, color: '#fff',
            border: 'none', borderRadius: 999, padding: '5px 14px',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
