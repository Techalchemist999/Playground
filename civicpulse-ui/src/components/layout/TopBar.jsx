import { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/tokens';

const STATUS_STYLES = {
  IDLE:    { bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' },
  READY:   { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe' },
  ACTIVE:  { bg: '#f0fdf4', color: '#22c55e', border: '#bbf7d0' },
  PAUSED:  { bg: '#fffbeb', color: '#f59e0b', border: '#fde68a' },
  STOPPED: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

function formatTime(ms) {
  if (!ms) return '00:00';
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TopBar({ status = 'IDLE', elapsed = 0, sessionId, bgThemes = [], bgTheme, onBgThemeChange }) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.IDLE;
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div style={{
      height: SPACING.topBarHeight,
      background: COLORS.topBarBg,
      borderBottom: `1px solid ${COLORS.topBarBorder}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      flexShrink: 0,
      zIndex: 20,
      fontFamily: TYPOGRAPHY.fontFamily,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7,
        background: COLORS.primaryGradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </div>
      <span style={{ fontWeight: 800, fontSize: 14, color: COLORS.headingText }}>CivicPulse</span>
      <span style={{ fontSize: 11, color: COLORS.mutedText }}>In-Meeting Intelligence</span>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {status !== 'IDLE' && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: st.bg, border: `1px solid ${st.border}`,
              borderRadius: 999, padding: '3px 10px',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: st.color,
                animation: status === 'ACTIVE' ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{status}</span>
            </div>
            {(status === 'ACTIVE' || status === 'PAUSED') && (
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.bodyText, fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(elapsed)}
              </span>
            )}
          </>
        )}
        {sessionId && (
          <span style={{ fontSize: 10, color: COLORS.mutedText }}>
            {sessionId.substring(0, 8)}...
          </span>
        )}
        {/* Settings gear */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: showSettings ? '#f1f5f9' : 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!showSettings) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!showSettings) e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {showSettings && (
            <div style={{
              position: 'absolute', top: 36, right: 0,
              background: '#fff', borderRadius: 10, padding: '12px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              width: 200, zIndex: 300,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#94a3b8',
                letterSpacing: '1px', textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                Grid Theme
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bgThemes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => onBgThemeChange(theme)}
                    title={theme.label}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: theme.dot,
                      border: bgTheme?.id === theme.id ? '2.5px solid #0f172a' : '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border 0.15s',
                      transform: bgTheme?.id === theme.id ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              {bgTheme && (
                <span style={{ fontSize: 8.5, color: '#94a3b8', display: 'block', marginTop: 6 }}>
                  {bgTheme.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
