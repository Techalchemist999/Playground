import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession';
import { ToastProvider } from './components/shared/Toast';
import PageShell from './components/layout/PageShell';
import TopBar from './components/layout/TopBar';
import SetupView from './components/setup/SetupView';
import LiveDashboard from './components/live/LiveDashboard';
import MinutesWorkspace from './components/minutes/MinutesWorkspace';

// Background color themes
const BG_THEMES = [
  { id: 'default',  label: 'Default',    dot: '#e2e8f0', bg: '#ffffff' },
  { id: 'muni-red', label: 'MuniWorth',  dot: '#EF3F32', bg: '#fef2f2' },
  { id: 'navy',     label: 'Navy',       dot: '#1e3a5f', bg: '#f0f4f8' },
  { id: 'forest',   label: 'Forest',     dot: '#166534', bg: '#f0fdf4' },
  { id: 'charcoal', label: 'Charcoal',   dot: '#374151', bg: '#f9fafb' },
  { id: 'purple',   label: 'Purple',     dot: '#7c3aed', bg: '#faf5ff' },
  { id: 'ocean',    label: 'Ocean',      dot: '#0369a1', bg: '#f0f9ff' },
  { id: 'midnight', label: 'Midnight',   dot: '#475569', bg: '#0f172a' },
  { id: 'rose',     label: 'Rose',       dot: '#e11d48', bg: '#fff1f2' },
  { id: 'gold',     label: 'Gold',       dot: '#b45309', bg: '#fffbeb' },
];

export default function App() {
  const session = useSession();
  const [elapsed, setElapsed] = useState(0);
  const [bgTheme, setBgTheme] = useState(BG_THEMES[0]);

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
          bgThemes={BG_THEMES}
          bgTheme={bgTheme}
          onBgThemeChange={setBgTheme}
        />
        {session.view === 'setup' && <SetupView session={session} />}
        {session.view === 'live' && <LiveDashboard session={session} bgTheme={bgTheme} />}
        {session.view === 'minutes' && <MinutesWorkspace session={session} />}
      </PageShell>
    </ToastProvider>
  );
}
