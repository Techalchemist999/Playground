import { useState } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';
import { gradientButtonStyle, cardStyle, outlineButtonStyle } from '../../styles/shared';
import Spinner from '../shared/Spinner';
import SourcePicker from './SourcePicker';
import AgendaPicker from './AgendaPicker';

export default function SetupView({ session }) {
  const [agendaId, setAgendaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      await session.start(agendaId);
    } catch (e) {
      setLoading(false);
    }
  }

  async function handleQuickTest() {
    setTestLoading(true);
    try {
      // 1. Ingest a YouTube URL
      await session.ingest('youtube', 'https://youtube.com/watch?v=demo-council-meeting');
      // 2. Start with first agenda
      await session.start('agenda-2025-08-27');
      // 3. Let it run ~12 seconds to accumulate topics and transcript, then auto-stop
      setTimeout(async () => {
        try {
          await session.stop();
        } catch (e) { /* session may already be transitioning */ }
      }, 12000);
    } catch (e) {
      setTestLoading(false);
    }
  }

  async function handleSkipToResults() {
    setTestLoading(true);
    try {
      // 1. Ingest
      await session.ingest('youtube', 'https://youtube.com/watch?v=demo-council-meeting');
      // 2. Start with agenda
      await session.start('agenda-2025-08-27');
      // 3. Immediately stop — backend generates minutes on stop
      await new Promise(r => setTimeout(r, 2000)); // brief pause for SSE to deliver a few events
      await session.stop();
    } catch (e) {
      setTestLoading(false);
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
          {/* Quick Test Buttons */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
            padding: '14px 16px', marginBottom: 18,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: '#92400e', marginBottom: 8 }}>
              UI Testing
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleQuickTest}
                disabled={testLoading}
                style={{
                  ...outlineButtonStyle,
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: 12,
                  borderColor: '#fde68a',
                  color: '#92400e',
                  background: '#fff',
                }}
              >
                {testLoading ? <Spinner size={12} color="#92400e" /> : (
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
                  </svg>
                )}
                Quick Test (12s live)
              </button>
              <button
                onClick={handleSkipToResults}
                disabled={testLoading}
                style={{
                  ...gradientButtonStyle,
                  flex: 1,
                  padding: '9px 12px',
                  fontSize: 12,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 2px 8px rgba(245,158,11,.25)',
                }}
              >
                {testLoading ? <Spinner size={12} color="#fff" /> : (
                  <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polygon points="13,19 22,12 13,5" fill="#fff" stroke="none" />
                    <polygon points="2,19 11,12 2,5" fill="#fff" stroke="none" />
                  </svg>
                )}
                Skip to Minutes
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: '#b45309', marginTop: 6, lineHeight: 1.5 }}>
              Quick Test runs 12s of simulated audio then auto-stops. Skip to Minutes jumps straight to the minutes workspace.
            </div>
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
                  opacity: loading ? 0.6 : 1,
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
