import { useRef, useEffect, useState, useCallback } from 'react';
import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import ClerkNotes from './ClerkNotes';
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
const iconAgenda = (
  <svg width="13" height="13" fill="none" stroke="#db2777" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const SNAP = 24; // ~6mm grid snap
const SNAP_PCT = 3.5; // ~6mm as percentage of typical container height

function snapPct(val) {
  return Math.round(val / SNAP_PCT) * SNAP_PCT;
}
function snapPx(val) {
  return Math.round(val / SNAP) * SNAP;
}

// Panels: x/w in px, y/h in % of container height
const DEFAULT_PANELS = [
  { id: 'agenda',  x: 24,  yPct: 3.5,  w: 312, hPct: 93 },
  { id: 'bites',   x: 348, yPct: 3.5,  w: 528, hPct: 93 },
  { id: 'topics',  x: 888, yPct: 3.5,  w: 360, hPct: 44.5 },
  { id: 'notes',   x: 888, yPct: 51.5, w: 360, hPct: 45 },
];

// Edge resize zones — no right edge so scrolling isn't blocked
const EDGE_SIZE = 8;
function EdgeHandles({ onEdgeDrag }) {
  const edges = [
    { key: 'top',    style: { top: 0, left: EDGE_SIZE, right: EDGE_SIZE, height: EDGE_SIZE, cursor: 'ns-resize' } },
    { key: 'bottom', style: { bottom: 0, left: EDGE_SIZE, right: EDGE_SIZE, height: EDGE_SIZE, cursor: 'ns-resize' } },
    { key: 'left',   style: { left: 0, top: EDGE_SIZE, bottom: EDGE_SIZE, width: EDGE_SIZE, cursor: 'ew-resize' } },
    { key: 'top-left',     style: { top: 0, left: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nwse-resize' } },
    { key: 'bottom-left',  style: { bottom: 0, left: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nesw-resize' } },
  ];
  return edges.map(({ key, style }) => (
    <div
      key={key}
      onMouseDown={(e) => onEdgeDrag(key, e)}
      style={{ position: 'absolute', zIndex: 10, ...style }}
    />
  ));
}

export default function LiveDashboard({ session, bgTheme }) {
  const containerRef = useRef(null);
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [quickMotionOpen, setQuickMotionOpen] = useState(false);
  const fallbackTheme = { dot: '#e2e8f0', accent: '#64748b', bg: '#ffffff' };
  const theme = bgTheme || fallbackTheme;
  const accentColor = theme.accent || theme.dot;

  // Smart scroll for procedural bites
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

  const MIN_W = SNAP * 6;
  const MIN_H_PCT = SNAP_PCT * 3; // minimum height as %

  const startDrag = useCallback((panelId, e, mode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    const ch = containerRef.current?.clientHeight || 700;
    const cw = containerRef.current?.clientWidth || 1200;

    setDraggingId(panelId);
    dragRef.current = {
      id: panelId, mode,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: panel.x, startYPct: panel.yPct,
      startW: panel.w, startHPct: panel.hPct,
      ch, cw,
    };

    const onMouseMove = (ev) => {
      if (!dragRef.current) return;
      const ds = dragRef.current;
      const dx = ev.clientX - ds.startMouseX;
      const dy = ev.clientY - ds.startMouseY;
      const dyPct = (dy / ds.ch) * 100;

      setPanels(prev => prev.map(p => {
        if (p.id !== ds.id) return p;

        if (ds.mode === 'move') {
          const newX = snapPx(Math.max(SNAP, Math.min(ds.cw - p.w - SNAP, ds.startX + dx)));
          const newYPct = snapPct(Math.max(SNAP_PCT, Math.min(100 - p.hPct - SNAP_PCT, ds.startYPct + dyPct)));
          return { ...p, x: newX, yPct: newYPct };
        }

        let newX = ds.startX, newYPct = ds.startYPct, newW = ds.startW, newHPct = ds.startHPct;
        const resizesLeft   = ds.mode.includes('left');
        const resizesTop    = ds.mode.includes('top');
        const resizesBottom = ds.mode === 'bottom' || ds.mode.includes('bottom');

        if (resizesBottom) newHPct = ds.startHPct + dyPct;
        if (resizesLeft)  { newW = ds.startW - dx; newX = ds.startX + dx; }
        if (resizesTop)   { newHPct = ds.startHPct - dyPct; newYPct = ds.startYPct + dyPct; }

        // Enforce minimums
        newW = Math.max(MIN_W, newW);
        newHPct = Math.max(MIN_H_PCT, newHPct);
        // Clamp to container
        newHPct = Math.min(newHPct, 100 - newYPct - SNAP_PCT);
        if (resizesLeft)  newX = Math.max(SNAP, ds.startX + ds.startW - newW);
        if (resizesTop)   newYPct = Math.max(SNAP_PCT, ds.startYPct + ds.startHPct - newHPct);

        return { ...p, x: snapPx(newX), yPct: snapPct(newYPct), w: snapPx(newW), hPct: snapPct(newHPct) };
      }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setDraggingId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [panels]);

  const panelStyle = (id) => {
    const p = panels.find(pp => pp.id === id);
    return {
      position: 'absolute',
      left: p.x,
      top: `${p.yPct}%`,
      width: p.w,
      height: `${p.hPct}%`,
      transition: draggingId === id ? 'none' : 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
      zIndex: draggingId === id ? 100 : 1,
      opacity: draggingId === id ? 0.92 : 1,
      display: 'flex',
      minHeight: 0,
      overflow: 'hidden',
    };
  };

  const dragHandleStyle = {
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Draggable panel area — flex:1 so it shrinks when Quick Motion opens */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          ...(theme.bg.includes('gradient')
            ? { backgroundImage: theme.bg }
            : { background: theme.bg }),
          transition: 'background 0.3s ease',
        }}
      >
        {/* Agenda */}
        <div style={panelStyle('agenda')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="Agenda"
              icon={iconAgenda}
              badge={agendaBadge}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('agenda', e, 'move'),
                style: dragHandleStyle,
              }}
            >
              <AgendaSidebar
                agendaItems={session.agendaItems}
                currentAgendaItem={session.currentAgendaItem}
                topics={session.topics}
                transcript={session.transcript}
                status={session.status}
                embedded
                accentColor={accentColor}
              />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('agenda', e, edge)} />
          </div>
        </div>

        {/* Procedural Bites */}
        <div style={panelStyle('bites')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="Procedural Bites"
              icon={iconBites}
              badge={`${Array.from(session.topics.values()).filter(t => t.category === 'motion').length} motions`}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('bites', e, 'move'),
                style: dragHandleStyle,
              }}
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
                        accentColor={accentColor}
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
              </div>
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('bites', e, edge)} />
          </div>
        </div>

        {/* Topics */}
        <div style={panelStyle('topics')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="Topics"
              icon={iconTopics}
              badge={`${activeTopics}`}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('topics', e, 'move'),
                style: dragHandleStyle,
              }}
            >
              <TopicBubbles topics={session.topics} status={session.status} compact />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('topics', e, edge)} />
          </div>
        </div>

        {/* Clerk Notes */}
        <div style={panelStyle('notes')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="Clerk Notes"
              icon={iconNotes}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('notes', e, 'move'),
                style: dragHandleStyle,
              }}
            >
              <ClerkNotes />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('notes', e, edge)} />
          </div>
        </div>
      </div>

      {/* Bottom: session controls + Quick Motion */}
      <SessionControls session={session} quickMotionOpen={quickMotionOpen} onQuickMotionToggle={setQuickMotionOpen} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
