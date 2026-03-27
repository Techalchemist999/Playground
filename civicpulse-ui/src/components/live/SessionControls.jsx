import { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle } from '../../styles/shared';

export default function SessionControls({ session }) {
  const [confirmStop, setConfirmStop] = useState(false);

  return (
    <div style={{
      height: SPACING.controlBarHeight,
      borderTop: `1px solid ${COLORS.cardBorder}`,
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      flexShrink: 0,
      fontFamily: TYPOGRAPHY.fontFamily,
    }}>
      {/* Left: session info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: COLORS.mutedText,
        }}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {session.source === 'youtube' ? (
              <><rect x="2" y="4" width="20" height="16" rx="4" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></>
            ) : session.source === 'upload' ? (
              <><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>
            ) : (
              <><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>
            )}
          </svg>
          <span style={{ textTransform: 'capitalize' }}>{session.source}</span>
        </div>
        <span style={{ fontSize: 10, color: COLORS.cardBorder }}>|</span>
        <span style={{ fontSize: 10.5, color: COLORS.mutedText }}>
          {session.transcript.length} chunks
        </span>
        <span style={{ fontSize: 10, color: COLORS.cardBorder }}>|</span>
        <span style={{ fontSize: 10.5, color: COLORS.mutedText }}>
          {session.topics.size} topics
        </span>
      </div>

      {/* Center: controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {session.status === 'ACTIVE' && (
          <button
            onClick={session.pause}
            style={{ ...outlineButtonStyle, padding: '7px 16px' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </button>
        )}

        {session.status === 'PAUSED' && (
          <button
            onClick={session.resume}
            style={{ ...gradientButtonStyle, padding: '7px 16px' }}
          >
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" fill="#fff" stroke="none" />
            </svg>
            Resume
          </button>
        )}

        {!confirmStop ? (
          <button
            onClick={() => setConfirmStop(true)}
            style={{
              ...outlineButtonStyle,
              padding: '7px 16px',
              color: COLORS.dangerRed,
              borderColor: COLORS.dangerBorder,
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            End Meeting
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.dangerRed }}>End session?</span>
            <button
              onClick={() => { session.stop(); setConfirmStop(false); }}
              style={{
                ...gradientButtonStyle,
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                boxShadow: '0 2px 8px rgba(220,38,38,.3)',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmStop(false)}
              style={{ ...outlineButtonStyle, padding: '7px 12px' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
