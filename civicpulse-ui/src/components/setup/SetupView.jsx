import { useState } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';
import { gradientButtonStyle, cardStyle } from '../../styles/shared';
import Spinner from '../shared/Spinner';
import SourcePicker from './SourcePicker';
import AgendaPicker from './AgendaPicker';

export default function SetupView({ session }) {
  const [agendaId, setAgendaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      await session.start(agendaId);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    try {
      await session.ingest('youtube', 'https://youtube.com/watch?v=demo-council-meeting');
      await session.start('agenda-2025-08-27');
    } catch (e) {
      setDemoLoading(false);
    }
  }

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, overflowY: 'auto',
    }}>
      <div className="setup-card" style={{ ...cardStyle, maxWidth: 560, width: '100%', padding: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 55%, #f0fdf4 100%)',
          padding: '24px 28px 20px',
          borderBottom: '1px solid #e8eaf0',
          borderRadius: `${SPACING.cardRadius}px ${SPACING.cardRadius}px 0 0`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: COLORS.primaryGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.primary }}>
              CIVICPULSE
            </span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: COLORS.headingText, marginBottom: 4, letterSpacing: '-0.3px' }}>
            New Meeting Session
          </div>
          <div style={{ fontSize: 12, color: COLORS.secondaryText, lineHeight: 1.6 }}>
            Start a real-time council meeting intelligence session. Choose an audio source, optionally attach an agenda, and begin.
          </div>
        </div>

        <div style={{ padding: '20px 28px 24px' }}>
          {/* Demo shortcut */}
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 16px',
              background: '#fff',
              border: `1.5px solid ${COLORS.primaryBorder}`,
              borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: COLORS.primary,
              marginBottom: 16,
              transition: 'all .15s',
            }}
          >
            {demoLoading ? (
              <><Spinner size={14} color={COLORS.primary} /> Starting demo...</>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
                </svg>
                Run Saved Demo (Aug 27 RCM)
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: COLORS.cardBorder }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.mutedText }}>OR</span>
            <div style={{ flex: 1, height: 1, background: COLORS.cardBorder }} />
          </div>

          <SourcePicker onIngest={session.ingest} loading={false} />

          {session.status === 'READY' && (
            <>
              <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '8px 0 16px' }} />
              <AgendaPicker selectedAgenda={agendaId} onSelect={setAgendaId} />
              <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '16px 0' }} />

              <button
                onClick={handleStart}
                disabled={loading}
                style={{
                  ...gradientButtonStyle,
                  width: '100%',
                  padding: '12px',
                  fontSize: 14,
                }}
              >
                {loading ? (
                  'Starting Session...'
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polygon points="5,3 19,12 5,21" fill="#fff" stroke="none" />
                    </svg>
                    Start Meeting
                  </>
                )}
              </button>
            </>
          )}

          {session.error && (
            <div style={{
              marginTop: 12, padding: '8px 12px',
              background: COLORS.dangerLight, border: `1px solid ${COLORS.dangerBorder}`,
              borderRadius: 8, fontSize: 12, color: COLORS.dangerRed,
            }}>
              {session.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
