import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
import TranscriptPanel from './TranscriptPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import SessionControls from './SessionControls';

const iconTranscript = (
  <svg width="13" height="13" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const iconTopics = (
  <svg width="13" height="13" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
  </svg>
);
const iconAgenda = (
  <svg width="13" height="13" fill="none" stroke="#db2777" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default function LiveDashboard({ session }) {
  const activeTopics = Array.from(session.topics.values()).filter(
    t => t.state === 'ACTIVE' || t.state === 'DETECTED' || t.state === 'REAPPEARED'
  ).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Bento grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr auto',
        gap: 10,
        padding: 10,
        overflow: 'hidden',
      }}>
        {/* Top-left: Transcript — takes left column, full height */}
        <div style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Transcript"
            icon={iconTranscript}
            badge={`${session.transcript.length}`}
            style={{ flex: 1, minHeight: 0 }}
          >
            <TranscriptPanel transcript={session.transcript} status={session.status} embedded />
          </BentoPanel>
        </div>

        {/* Top-right: Live Topics — compact, ~23% area */}
        <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Live Topics"
            icon={iconTopics}
            badge={`${activeTopics} active`}
            style={{ flex: 1, minHeight: 0 }}
          >
            <TopicBubbles topics={session.topics} status={session.status} compact />
          </BentoPanel>
        </div>

        {/* Bottom-right: Agenda */}
        <div style={{ gridColumn: '2', gridRow: '2', display: 'flex', minHeight: 0, maxHeight: 320 }}>
          <BentoPanel
            title="Agenda"
            icon={iconAgenda}
            badge={session.agendaItems.length > 0 ? `${session.agendaItems.filter(i => i.status === 'discussed').length}/${session.agendaItems.length}` : null}
            style={{ flex: 1, minHeight: 0 }}
          >
            <AgendaSidebar
              agendaItems={session.agendaItems}
              currentAgendaItem={session.currentAgendaItem}
              topics={session.topics}
              embedded
            />
          </BentoPanel>
        </div>
      </div>

      {/* Bottom: Session Controls */}
      <SessionControls session={session} />
    </div>
  );
}
