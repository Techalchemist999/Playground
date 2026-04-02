import { useState, useRef } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle, cardStyle } from '../../styles/shared';
import Spinner from '../shared/Spinner';
import SourcePicker from './SourcePicker';
import AgendaPicker from './AgendaPicker';
import { parseTranscriptToMinutes } from '../../data/mockTranscriptParser';
import { SAMPLE_TRANSCRIPT } from '../../data/sampleTranscript';

export default function SetupView({ session }) {
  const [agendaId, setAgendaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleTranscriptUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscriptLoading(true);
    try {
      const text = await file.text();
      const parsed = parseTranscriptToMinutes(text);
      session.startTranscriptMinutes(parsed);
    } catch (err) {
      console.error('Failed to parse transcript:', err);
    } finally {
      setTranscriptLoading(false);
    }
  }

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
      await session.ingest('youtube', 'https://www.youtube.com/watch?v=0Ea-1gRDChY');
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
          <SourcePicker onIngest={session.ingest} loading={false} />

          {session.status === 'READY' && (
            <>
              <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '8px 0 16px' }} />
              <AgendaPicker
                selectedAgenda={agendaId}
                onSelect={setAgendaId}
                onAgendaLoaded={(items) => session.setAgendaItems(items)}
              />
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

          {/* Agenda Publisher */}
          <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '16px 0' }} />
          <button
            onClick={() => window.open('http://localhost:5173', '_blank')}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #c3d5e8, #d5dff0)',
              border: '1.5px solid rgba(255,255,255,.75)',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .15s',
              boxShadow: '0 2px 10px rgba(71,85,105,.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Agenda Publisher
          </button>

          {/* Demo / Test buttons */}
          <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '16px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => session.startDemoPlayback()}
              style={{
                flex: 1, padding: '12px',
                background: COLORS.primaryGradient, border: 'none',
                borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s',
                boxShadow: `0 4px 14px ${COLORS.primaryShadow}`,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <polygon points="5,3 19,12 5,21" fill="#fff" stroke="none" />
              </svg>
              Test — Live Playback
            </button>
            <button
              onClick={() => session.startDemo()}
              style={{
                flex: 1, padding: '12px',
                background: '#f8fafc', border: `1.5px solid ${COLORS.cardBorder}`,
                borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: COLORS.secondaryText,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all .15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.cardBorder; e.currentTarget.style.color = COLORS.secondaryText; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
              Demo — All Data
            </button>
          </div>

          {/* Upload Transcript — skip to minutes */}
          <div style={{ borderTop: `1px solid ${COLORS.subtleBorder}`, margin: '16px 0' }} />
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
            color: '#94a3b8', marginBottom: 8, textAlign: 'center',
          }}>
            Or generate minutes from a transcript
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.text"
            onChange={handleTranscriptUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={transcriptLoading}
            style={{
              width: '100%', padding: '12px',
              background: '#fff',
              border: `1.5px solid ${COLORS.cardBorder}`,
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: COLORS.secondaryText,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = COLORS.primary; e.currentTarget.style.color = COLORS.primary; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = COLORS.cardBorder; e.currentTarget.style.color = COLORS.secondaryText; }}
          >
            {transcriptLoading ? (
              <Spinner size={14} label="Parsing transcript" />
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            )}
            {transcriptLoading ? 'Generating Minutes...' : 'Upload Transcript'}
          </button>
          <button
            onClick={() => {
              const parsed = parseTranscriptToMinutes(SAMPLE_TRANSCRIPT);
              session.startTranscriptMinutes(parsed);
            }}
            style={{
              width: '100%', padding: '12px', marginTop: 8,
              background: COLORS.primaryGradient, border: 'none',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .15s',
              boxShadow: `0 4px 14px ${COLORS.primaryShadow}`,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Demo — Generate Minutes
          </button>

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
