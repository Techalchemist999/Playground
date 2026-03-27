import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession';
import PageShell from './components/layout/PageShell';
import TopBar from './components/layout/TopBar';
import SetupView from './components/setup/SetupView';
import LiveDashboard from './components/live/LiveDashboard';
import MinutesWorkspace from './components/minutes/MinutesWorkspace';

export default function App() {
  const session = useSession();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (session.status !== 'ACTIVE' || !session.startTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.startTime]);

  return (
    <PageShell>
      <TopBar
        status={session.status}
        elapsed={elapsed}
        sessionId={session.sessionId}
      />
      {session.view === 'setup' && <SetupView session={session} />}
      {session.view === 'live' && <LiveDashboard session={session} />}
      {session.view === 'minutes' && <MinutesWorkspace session={session} />}
    </PageShell>
  );
}
