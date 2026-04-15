import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession';
import { ToastProvider } from './components/shared/Toast';
import PageShell from './components/layout/PageShell';
import TopBar from './components/layout/TopBar';
import SetupView from './components/setup/SetupView';
import LiveDashboard from './components/live/LiveDashboard';
import MinutesWorkspace from './components/minutes/MinutesWorkspace';
import TranscriptMinutesWorkspace from './components/transcript-minutes/TranscriptMinutesWorkspace';

// Background color themes — dot = grid dots, accent = darker shade for bars/accents
const BG_THEMES = [
  { id: 'default',  label: 'Default',    dot: '#e2e8f0', accent: '#64748b', bg: '#ffffff' },
  { id: 'muni-red', label: 'MuniWorth',  dot: '#EF3F32', accent: '#b91c1c', bg: '#fef2f2' },
  { id: 'navy',     label: 'Navy',       dot: '#1e3a5f', accent: '#0f2440', bg: '#f0f4f8' },
  { id: 'forest',   label: 'Forest',     dot: '#166534', accent: '#0a4a24', bg: '#f0fdf4' },
  { id: 'charcoal', label: 'Charcoal',   dot: '#374151', accent: '#1f2937', bg: '#f9fafb' },
  { id: 'purple',   label: 'Purple',     dot: '#7c3aed', accent: '#5b21b6', bg: '#faf5ff' },
  { id: 'ocean',    label: 'Ocean',      dot: '#0369a1', accent: '#024e7a', bg: '#f0f9ff' },
  { id: 'midnight', label: 'Midnight',   dot: '#475569', accent: '#1e293b', bg: '#0f172a' },
  { id: 'rose',     label: 'Rose',       dot: '#e11d48', accent: '#9f1239', bg: '#fff1f2' },
  { id: 'gold',     label: 'Gold',       dot: '#b45309', accent: '#854d0e', bg: '#fffbeb' },
  { id: 'ombre',    label: 'Ombré',      dot: '#8b5cf6', accent: '#5b21b6', bg: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 55%, #f0fdf4 100%)' },
  { id: 'ombre-sun', label: 'Sunset',   dot: '#e11d48', accent: '#9f1239', bg: 'linear-gradient(135deg, #fff1f2 0%, #fef3c7 55%, #fce7f3 100%)' },
  { id: 'ombre-sea', label: 'Seafoam',  dot: '#0891b2', accent: '#155e75', bg: 'linear-gradient(135deg, #ecfeff 0%, #f0fdf4 55%, #eff6ff 100%)' },
];

export default function App() {
  const session = useSession();
  const [elapsed, setElapsed] = useState(0);
  const [bgTheme, setBgTheme] = useState(BG_THEMES[0]);

  // Auto-launch demo when URL has ?demo=all — used by launcher "In-Meeting Clerk Support" link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'all' && session.view === 'setup') {
      session.startDemo();
    }
  }, [session.view, session.startDemo]);

  useEffect(() => {
    if (session.status !== 'ACTIVE' || !session.startTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.startTime]);

  return (
    <ToastProvider>
      <PageShell>
        <TopBar
          status={session.status}
          elapsed={elapsed}
          sessionId={session.sessionId}
        />
        {session.view === 'setup' && <SetupView session={session} />}
        {session.view === 'live' && (
          <LiveDashboard
            session={session}
            bgTheme={bgTheme}
            bgThemes={BG_THEMES}
            onBgThemeChange={setBgTheme}
          />
        )}
        {session.view === 'minutes' && <MinutesWorkspace session={session} />}
        {session.view === 'transcript-minutes' && (
          <TranscriptMinutesWorkspace session={session} bgTheme={bgTheme} bgThemes={BG_THEMES} onBgThemeChange={setBgTheme} />
        )}
      </PageShell>
    </ToastProvider>
  );
}
