import { useRef, useEffect, useCallback } from 'react';
import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
import TranscriptPanel from './TranscriptPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import ClerkNotes from './ClerkNotes';
import QuickMotion from './QuickMotion';
import BiteCard from './BiteCard';
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
  // Smart scroll — only auto-scroll if user is near the bottom
  const pbScrollRef = useRef(null);
  const pbCountRef = useRef(0);
  const motionCount = Array.from(session.topics.values()).filter(t => t.category === 'motion').length;
  useEffect(() => {
    if (motionCount > pbCountRef.current && pbScrollRef.current) {
      const el = pbScrollRef.current;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (nearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
    pbCountRef.current = motionCount;
  }, [motionCount]);

  const activeTopics = Array.from(session.topics.values()).filter(
    t => t.state === 'ACTIVE' || t.state === 'DETECTED' || t.state === 'REAPPEARED'
  ).length;

  const discussed = session.agendaItems.filter(i => i.status === 'discussed').length;
  const agendaBadge = session.agendaItems.length > 0 ? `${discussed}/${session.agendaItems.length}` : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Bento grid: PB left, Agenda + right stack */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.45fr 1.2fr 0.8fr',
        gridTemplateRows: '1fr 1fr',
        gap: 10,
        padding: 10,
        overflow: 'hidden',
      }}>

        {/* LEFT: Agenda rail (full height) */}
        <div style={{ gridColumn: '1', gridRow: '1 / 3', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Agenda"
            icon={iconAgenda}
            badge={agendaBadge}
            style={{ flex: 1, minHeight: 0 }}
          >
            <AgendaSidebar
              agendaItems={session.agendaItems}
              currentAgendaItem={session.currentAgendaItem}
              topics={session.topics}
              transcript={session.transcript}
              status={session.status}
              embedded
            />
          </BentoPanel>
        </div>

        {/* CENTER: Procedural Bites (full height) */}
        <div style={{ gridColumn: '2', gridRow: '1 / 3', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Procedural Bites"
            icon={iconBites}
            badge={`${Array.from(session.topics.values()).filter(t => t.category === 'motion').length} motions`}
            style={{ flex: 1, minHeight: 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div ref={pbScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from(session.topics.values())
                  .filter(t => t.state !== 'EVICTED' && t.category === 'motion')
                  .map((topic, i, arr) => (
                    <BiteCard
                      key={topic.normalized_id || topic.label}
                      topic={topic}
                      index={i}
                      isNewest={i === arr.length - 1}
                    />
                  ))}
                {Array.from(session.topics.values()).filter(t => t.category === 'motion').length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 1, color: COLORS.mutedText, fontSize: 12, fontStyle: 'italic',
                  }}>
                    Motions and procedural items will appear here...
                  </div>
                )}
              </div>
              <QuickMotion />
            </div>
          </BentoPanel>
        </div>

        {/* RIGHT TOP: Topics */}
        <div style={{ gridColumn: '3', gridRow: '1', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Topics"
            icon={iconTopics}
            badge={`${activeTopics}`}
            style={{ flex: 1, minHeight: 0 }}
          >
            <TopicBubbles topics={session.topics} status={session.status} compact />
          </BentoPanel>
        </div>

        {/* RIGHT BOTTOM: Clerk Notes */}
        <div style={{ gridColumn: '3', gridRow: '2', display: 'flex', minHeight: 0 }}>
          <BentoPanel
            title="Clerk Notes"
            icon={iconNotes}
            style={{ flex: 1, minHeight: 0 }}
          >
            <ClerkNotes />
          </BentoPanel>
        </div>
      </div>

      {/* Bottom: Slim session controls */}
      <SessionControls session={session} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
