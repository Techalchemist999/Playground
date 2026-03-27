import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
import TranscriptPanel from './TranscriptPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import ClerkNotes from './ClerkNotes';
import QuickMotion from './QuickMotion';
import SessionControls from './SessionControls';

const iconBites = (
  <svg width="13" height="13" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const iconNotes = (
  <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const iconTopics = (
  <svg width="13" height="13" fill="none" stroke="#8b5cf6" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
  </svg>
);
const iconTranscript = (
  <svg width="13" height="13" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

  const discussed = session.agendaItems.filter(i => i.status === 'discussed').length;
  const agendaBadge = session.agendaItems.length > 0 ? `${discussed}/${session.agendaItems.length}` : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Bento grid: Layout 1 from layout-final */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gridTemplateRows: '1.2fr 0.8fr',
        gap: 10,
        padding: 10,
        overflow: 'hidden',
      }}>

        {/* LEFT: Procedural Bites + Quick Motion (full height) */}
        <div style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Procedural Bites"
            icon={iconBites}
            badge={`${session.topics.size} detected`}
            style={{ flex: 1, minHeight: 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Bites list — scrollable */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from(session.topics.values())
                  .filter(t => t.category === 'motion' || t.state !== 'EVICTED')
                  .map((topic, i) => {
                    const isActive = topic.state === 'ACTIVE' || topic.state === 'DETECTED';
                    const isCarried = topic.state === 'EXPIRED';
                    return (
                      <div key={topic.normalized_id || topic.label} style={{
                        background: isActive ? '#fafaff' : '#f8fafc',
                        border: `1px solid ${isActive ? COLORS.primaryBorder : COLORS.cardBorder}`,
                        borderRadius: 10, padding: '10px 14px',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        transition: 'all .2s',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                          background: isCarried ? '#f0fdf4' : isActive ? COLORS.primary : '#eef2ff',
                          border: `1.5px solid ${isCarried ? '#bbf7d0' : isActive ? COLORS.primary : COLORS.primaryBorder}`,
                          color: isCarried ? '#22c55e' : isActive ? '#fff' : COLORS.primary,
                        }}>
                          {isCarried ? '✓' : i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.headingText, marginBottom: 2 }}>
                            {topic.label}
                          </div>
                          <div style={{ fontSize: 10.5, color: COLORS.secondaryText, lineHeight: 1.5 }}>
                            Category: {topic.category} · Mentions: {topic.mention_count || 1}
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '2px 7px',
                            marginTop: 4, display: 'inline-block',
                            background: isCarried ? '#f0fdf4' : isActive ? '#eef2ff' : '#f8fafc',
                            color: isCarried ? '#22c55e' : isActive ? COLORS.primary : COLORS.mutedText,
                            border: `1px solid ${isCarried ? '#bbf7d0' : isActive ? COLORS.primaryBorder : COLORS.cardBorder}`,
                          }}>
                            {isCarried ? 'CARRIED' : isActive ? 'IN PROGRESS' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {session.topics.size === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: COLORS.mutedText, fontSize: 12, fontStyle: 'italic',
                  }}>
                    Motions and procedural items will appear here...
                  </div>
                )}
              </div>
              {/* Quick Motion — bottom ~15% */}
              <QuickMotion />
            </div>
          </BentoPanel>
        </div>

        {/* TOP-RIGHT: Clerk Notes + Topics side by side */}
        <div style={{ gridColumn: '2', gridRow: '1', display: 'grid', gridTemplateColumns: '1fr 0.5fr', gap: 10, minHeight: 0 }}>
          {/* Clerk Notes */}
          <BentoPanel
            title="Clerk Notes"
            icon={iconNotes}
            style={{ minHeight: 0 }}
          >
            <ClerkNotes startTime={session.startTime} />
          </BentoPanel>

          {/* Topics — compact */}
          <BentoPanel
            title="Topics"
            icon={iconTopics}
            badge={`${activeTopics}`}
            style={{ minHeight: 0 }}
          >
            <TopicBubbles topics={session.topics} status={session.status} compact />
          </BentoPanel>
        </div>

        {/* BOTTOM-RIGHT: Transcript + Agenda */}
        <div style={{ gridColumn: '2', gridRow: '2', display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 10, minHeight: 0 }}>
          <BentoPanel
            title="Transcript"
            icon={iconTranscript}
            badge={`${session.transcript.length}`}
            style={{ minHeight: 0 }}
          >
            <TranscriptPanel transcript={session.transcript} status={session.status} embedded />
          </BentoPanel>

          <BentoPanel
            title="Agenda"
            icon={iconAgenda}
            badge={agendaBadge}
            style={{ minHeight: 0 }}
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

      {/* Bottom: Slim session controls */}
      <SessionControls session={session} />
    </div>
  );
}
