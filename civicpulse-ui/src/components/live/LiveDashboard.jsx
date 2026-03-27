import TranscriptPanel from './TranscriptPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import SessionControls from './SessionControls';

export default function LiveDashboard({ session }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
        {/* Left: Transcript */}
        <div style={{ flex: 1, display: 'flex', padding: '12px 0 12px 12px', minWidth: 0 }}>
          <TranscriptPanel transcript={session.transcript} />
        </div>

        {/* Center: Topic Bubbles */}
        <div style={{ flex: 1.5, display: 'flex', padding: 12, minWidth: 0 }}>
          <TopicBubbles topics={session.topics} />
        </div>

        {/* Right: Agenda Sidebar */}
        <AgendaSidebar
          agendaItems={session.agendaItems}
          currentAgendaItem={session.currentAgendaItem}
          topics={session.topics}
        />
      </div>

      {/* Bottom: Session Controls */}
      <SessionControls session={session} />
    </div>
  );
}
