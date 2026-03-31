import { useRef, useEffect, useState, useCallback } from 'react';
import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
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
const iconAgenda = (
  <svg width="13" height="13" fill="none" stroke="#db2777" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const SNAP = 24; // ~6mm grid snap

function snapToGrid(val) {
  return Math.round(val / SNAP) * SNAP;
}

// Default panel layout (x, y, w, h in px — will snap to grid)
const DEFAULT_PANELS = [
  { id: 'agenda',    x: 0,   y: 0,   w: 312, h: 648 },
  { id: 'bites',     x: 322, y: 0,   w: 528, h: 648 },
  { id: 'topics',    x: 860, y: 0,   w: 360, h: 312 },
  { id: 'notes',     x: 860, y: 322, w: 360, h: 326 },
];

// Edge resize zones — all 4 sides + 4 corners
const EDGE_SIZE = 8;
function EdgeHandles({ onEdgeDrag }) {
  const edges = [
    // sides
    { key: 'top',    style: { top: 0, left: EDGE_SIZE, right: EDGE_SIZE, height: EDGE_SIZE, cursor: 'ns-resize' } },
    { key: 'bottom', style: { bottom: 0, left: EDGE_SIZE, right: EDGE_SIZE, height: EDGE_SIZE, cursor: 'ns-resize' } },
    { key: 'left',   style: { left: 0, top: EDGE_SIZE, bottom: EDGE_SIZE, width: EDGE_SIZE, cursor: 'ew-resize' } },
    { key: 'right',  style: { right: 0, top: EDGE_SIZE, bottom: EDGE_SIZE, width: EDGE_SIZE, cursor: 'ew-resize' } },
    // corners
    { key: 'top-left',     style: { top: 0, left: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nwse-resize' } },
    { key: 'top-right',    style: { top: 0, right: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nesw-resize' } },
    { key: 'bottom-left',  style: { bottom: 0, left: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nesw-resize' } },
    { key: 'bottom-right', style: { bottom: 0, right: 0, width: EDGE_SIZE, height: EDGE_SIZE, cursor: 'nwse-resize' } },
  ];
  return edges.map(({ key, style }) => (
    <div
      key={key}
      onMouseDown={(e) => onEdgeDrag(key, e)}
      style={{ position: 'absolute', zIndex: 10, ...style }}
    />
  ));
}

export default function LiveDashboard({ session }) {
  const containerRef = useRef(null);
  const [panels, setPanels] = useState(() =>
    DEFAULT_PANELS.map(p => ({
      ...p,
      x: snapToGrid(p.x),
      y: snapToGrid(p.y),
      w: snapToGrid(p.w),
      h: snapToGrid(p.h),
    }))
  );
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

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

  const MIN_W = SNAP * 6; // 144px min width
  const MIN_H = SNAP * 4; // 96px min height

  const startDrag = useCallback((panelId, e, mode = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    setDraggingId(panelId);
    dragRef.current = {
      id: panelId,
      mode, // 'move' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: panel.x,
      startY: panel.y,
      startW: panel.w,
      startH: panel.h,
    };

    const onMouseMove = (ev) => {
      if (!dragRef.current) return;
      const ds = dragRef.current;
      const dx = ev.clientX - ds.startMouseX;
      const dy = ev.clientY - ds.startMouseY;

      setPanels(prev => prev.map(p => {
        if (p.id !== ds.id) return p;

        if (ds.mode === 'move') {
          return { ...p, x: snapToGrid(Math.max(0, ds.startX + dx)), y: snapToGrid(Math.max(0, ds.startY + dy)) };
        }

        let newX = ds.startX, newY = ds.startY, newW = ds.startW, newH = ds.startH;
        const resizesLeft   = ds.mode.includes('left');
        const resizesRight  = ds.mode === 'right' || ds.mode.includes('right');
        const resizesTop    = ds.mode.includes('top');
        const resizesBottom = ds.mode === 'bottom' || ds.mode.includes('bottom');

        if (resizesRight)  newW = ds.startW + dx;
        if (resizesBottom) newH = ds.startH + dy;
        if (resizesLeft)  { newW = ds.startW - dx; newX = ds.startX + dx; }
        if (resizesTop)   { newH = ds.startH - dy; newY = ds.startY + dy; }

        // Enforce minimums
        newW = Math.max(MIN_W, newW);
        newH = Math.max(MIN_H, newH);
        // If dragging left/top edge, clamp position so it doesn't overshoot
        if (resizesLeft)  newX = Math.max(0, ds.startX + ds.startW - newW);
        if (resizesTop)   newY = Math.max(0, ds.startY + ds.startH - newH);

        return { ...p, x: snapToGrid(newX), y: snapToGrid(newY), w: snapToGrid(newW), h: snapToGrid(newH) };
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

  const getPanel = (id) => panels.find(p => p.id === id);

  const panelStyle = (id) => {
    const p = getPanel(id);
    return {
      position: 'absolute',
      left: p.x,
      top: p.y,
      width: p.w,
      height: p.h,
      transition: draggingId === id ? 'none' : 'left 0.2s ease, top 0.2s ease, width 0.2s ease, height 0.2s ease',
      zIndex: draggingId === id ? 100 : 1,
      opacity: draggingId === id ? 0.92 : 1,
      display: 'flex',
      minHeight: 0,
    };
  };

  const dragHandleStyle = {
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Draggable panel area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          padding: 10,
          overflow: 'auto',
          // Grid dots background for visual snap reference
          backgroundImage: `radial-gradient(circle, ${COLORS.cardBorder} 1px, transparent 1px)`,
          backgroundSize: `${SNAP}px ${SNAP}px`,
          backgroundPosition: '0 0',
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
