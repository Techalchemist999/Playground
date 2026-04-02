import { useRef, useEffect, useState, useCallback } from 'react';
import { COLORS } from '../../styles/tokens';
import BentoPanel from '../shared/BentoPanel';
import TopicBubbles from './TopicBubbles';
import AgendaSidebar from './AgendaSidebar';
import ClerkNotes from './ClerkNotes';
import BiteCard from './BiteCard';
import QuickMotion from './QuickMotion';
import RulesPanel from './RulesPanel';
import SessionControls from './SessionControls';

// Topics + Clerk Notes in one panel with tabs
function TopicsNotesTabbed({ topics, status }) {
  const [tab, setTab] = useState('topics'); // 'topics' | 'notes'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '6px 10px 0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
          <button
            onClick={() => setTab('topics')}
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: tab === 'topics' ? '#fff' : 'transparent',
              boxShadow: tab === 'topics' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: 9, fontWeight: 600,
              color: tab === 'topics' ? '#475569' : '#94a3b8',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            Topics
          </button>
          <button
            onClick={() => setTab('notes')}
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: tab === 'notes' ? '#fff' : 'transparent',
              boxShadow: tab === 'notes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontSize: 9, fontWeight: 600,
              color: tab === 'notes' ? '#475569' : '#94a3b8',
              transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Notes
          </button>
        </div>
      </div>
      {tab === 'topics' && <TopicBubbles topics={topics} status={status} compact />}
      {tab === 'notes' && <ClerkNotes />}
    </div>
  );
}

// PB History — groups resolved motions by agenda item
function PBHistory({ topics, agendaItems, accentColor }) {
  const [openGroups, setOpenGroups] = useState(new Set());
  const resolved = Array.from(topics.values())
    .filter(t => t.state === 'EXPIRED' && t.category === 'motion');

  if (resolved.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: COLORS.mutedText, fontSize: 11, fontStyle: 'italic' }}>
        Completed motions appear here...
      </div>
    );
  }

  // Group by agenda item number — motions without one go to "Floor Motions"
  const groups = {};
  resolved.forEach(topic => {
    const itemNum = topic.agendaItemNumber;
    const agendaMatch = itemNum ? agendaItems.find(a => a.number === itemNum) : null;
    const key = agendaMatch ? String(agendaMatch.number) : '—';
    const title = agendaMatch ? agendaMatch.title : 'Floor Motions';
    if (!groups[key]) groups[key] = { num: key, title, motions: [] };
    groups[key].motions.push(topic);
  });

  const toggleGroup = (key) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.values(groups).map(grp => {
        const isOpen = openGroups.has(grp.num);
        const count = grp.motions.length;
        return (
          <div key={grp.num}>
            {/* Agenda item header — GitHub issue milestone style */}
            <div
              onClick={() => toggleGroup(grp.num)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: '#fff',
                borderRadius: isOpen ? '10px 10px 0 0' : 10,
                border: '1px solid #e2e8f0',
                borderBottom: isOpen ? '1px dashed #e2e8f0' : '1px solid #e2e8f0',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <svg width="9" height="9" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <svg width="12" height="12" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                  {grp.num !== '—' ? `Item ${grp.num} — ` : ''}{grp.title}
                </div>
              </div>
              <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>
                {count} motion{count > 1 ? 's' : ''}
              </span>
            </div>
            {/* Expanded — motions as check/X rows */}
            {isOpen && (
              <div style={{
                padding: '6px 12px 10px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                {grp.motions.map((topic, i) => (
                  <BiteCard key={topic.normalized_id || topic.label} topic={topic} index={i} isNewest={false} accentColor={accentColor} cardMode="simple" />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

const SNAP_PX = 24; // ~6mm grid snap

function snapPct(val) {
  return Math.round(val * 10) / 10; // smooth percentage rounding
}

// Snap a pixel value to the 6mm grid
function snapPx(val) {
  return Math.round(val / SNAP_PX) * SNAP_PX;
}

// Panels: all values in % so they scale with window size
const DEFAULT_PANELS = [
  { id: 'agenda',   xPct: 1.5,  yPct: 2,   wPct: 25,  hPct: 96 },
  { id: 'floor',    xPct: 27.5, yPct: 2,   wPct: 40,  hPct: 96 },
  { id: 'rules',    xPct: 68.5, yPct: 2,   wPct: 30,  hPct: 54 },
  { id: 'topics',   xPct: 68.5, yPct: 58,  wPct: 30,  hPct: 40 },
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

export default function LiveDashboard({ session, bgTheme, bgThemes, onBgThemeChange }) {
  const containerRef = useRef(null);
  const [panels, setPanels] = useState(DEFAULT_PANELS);
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [pbNewestTop, setPbNewestTop] = useState(false);
  const [quickMotionOpen, setQuickMotionOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Panel lock + saved positions — persists to localStorage
  const LOCK_KEY = 'civicpulse-panels-locked';
  const PANELS_KEY = 'civicpulse-panel-layout';

  const [panelsLocked, setPanelsLocked] = useState(() => {
    try { return localStorage.getItem(LOCK_KEY) === 'true'; } catch { return false; }
  });

  // Load saved layout on mount (only if previously locked/saved)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PANELS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_PANELS.length) {
          setPanels(parsed);
        }
      }
    } catch {}
  }, []);

  // Save lock state + layout when locking
  useEffect(() => {
    try { localStorage.setItem(LOCK_KEY, panelsLocked ? 'true' : 'false'); } catch {}
    if (panelsLocked) {
      try { localStorage.setItem(PANELS_KEY, JSON.stringify(panels)); } catch {}
    }
  }, [panelsLocked]);

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
      if (pbNewestTop) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
    pbCountRef.current = motionCount;
  }, [motionCount, pbNewestTop]);

  const activeTopics = Array.from(session.topics.values()).filter(
    t => t.state === 'ACTIVE' || t.state === 'DETECTED' || t.state === 'REAPPEARED'
  ).length;

  const discussed = session.agendaItems.filter(i => i.status === 'discussed').length;
  const agendaBadge = session.agendaItems.length > 0 ? `${discussed}/${session.agendaItems.length}` : null;

  const MIN_W_PCT = 10; // minimum 10% width
  const MIN_H_PCT = 10; // minimum 10% height

  const startDrag = useCallback((panelId, e, mode = 'move') => {
    if (panelsLocked) return;
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
      startXPct: panel.xPct, startYPct: panel.yPct,
      startWPct: panel.wPct, startHPct: panel.hPct,
      ch, cw,
    };

    const onMouseMove = (ev) => {
      if (!dragRef.current) return;
      const ds = dragRef.current;
      // Snap mouse delta to 6mm grid in pixels, then convert to %
      const dx = snapPx(ev.clientX - ds.startMouseX);
      const dy = snapPx(ev.clientY - ds.startMouseY);
      const dxPct = (dx / ds.cw) * 100;
      const dyPct = (dy / ds.ch) * 100;

      setPanels(prev => prev.map(p => {
        if (p.id !== ds.id) return p;

        if (ds.mode === 'move') {
          const newXPct = snapPct(Math.max(0.5, Math.min(100 - p.wPct - 0.5, ds.startXPct + dxPct)));
          const newYPct = snapPct(Math.max(0.5, Math.min(100 - p.hPct - 0.5, ds.startYPct + dyPct)));
          return { ...p, xPct: newXPct, yPct: newYPct };
        }

        let newXPct = ds.startXPct, newYPct = ds.startYPct, newWPct = ds.startWPct, newHPct = ds.startHPct;
        const resizesLeft   = ds.mode.includes('left');
        const resizesTop    = ds.mode.includes('top');
        const resizesBottom = ds.mode === 'bottom' || ds.mode.includes('bottom');

        if (resizesBottom) newHPct = ds.startHPct + dyPct;
        if (resizesLeft)  { newWPct = ds.startWPct - dxPct; newXPct = ds.startXPct + dxPct; }
        if (resizesTop)   { newHPct = ds.startHPct - dyPct; newYPct = ds.startYPct + dyPct; }

        newWPct = Math.max(MIN_W_PCT, newWPct);
        newHPct = Math.max(MIN_H_PCT, newHPct);
        newHPct = Math.min(newHPct, 100 - newYPct - 0.5);
        if (resizesLeft) newXPct = Math.max(0.5, ds.startXPct + ds.startWPct - newWPct);
        if (resizesTop)  newYPct = Math.max(0.5, ds.startYPct + ds.startHPct - newHPct);

        return { ...p, xPct: snapPct(newXPct), yPct: snapPct(newYPct), wPct: snapPct(newWPct), hPct: snapPct(newHPct) };
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
  }, [panels, panelsLocked]);

  const panelStyle = (id) => {
    const p = panels.find(pp => pp.id === id);
    return {
      position: 'absolute',
      left: `${p.xPct}%`,
      top: `${p.yPct}%`,
      width: `${p.wPct}%`,
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
    cursor: panelsLocked ? 'default' : 'grab',
    userSelect: 'none',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Draggable panel area */}
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
        {/* Agenda + Procedural Bites combined */}
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
                resolvedMotions={Array.from(session.topics.values()).filter(t => t.state === 'EXPIRED' && t.category === 'motion')}
              />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('agenda', e, edge)} />
          </div>
        </div>

        {/* On The Floor */}
        <div style={panelStyle('floor')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="On The Floor"
              icon={<svg width="13" height="13" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
              </svg>}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('floor', e, 'move'),
                style: dragHandleStyle,
              }}
            >
              {(() => {
                const allMotions = Array.from(session.topics.values())
                  .filter(t => t.state !== 'EVICTED' && t.category === 'motion');
                const nonExpired = allMotions.filter(t => t.state !== 'EXPIRED');
                const resolved = allMotions.filter(t => t.state === 'EXPIRED');
                const onFloorMotion = nonExpired.length > 0 ? nonExpired[nonExpired.length - 1] : null;

                // Quick Motion form open
                if (quickMotionOpen) {
                  return (
                    <QuickMotion
                      startOpen={true}
                      onFloorMotion={onFloorMotion}
                      resolvedMotions={resolved}
                      onCancel={() => setQuickMotionOpen(false)}
                      onRecord={(data) => {
                        if (session.addMotion) session.addMotion(data);
                        setQuickMotionOpen(false);
                      }}
                    />
                  );
                }

                // No motion on the floor — show empty + Quick Motion
                if (!onFloorMotion) {
                  return (
                    <QuickMotion
                      onFloorMotion={null}
                      resolvedMotions={resolved}
                      onRecord={(data) => {
                        if (session.addMotion) session.addMotion(data);
                      }}
                    />
                  );
                }

                // Motion on the floor — show the card
                const topic = onFloorMotion;
                const amendment = topic.amendment;
                const i = allMotions.indexOf(topic);

                const motionCard = !amendment
                  ? <BiteCard topic={topic} index={i} isNewest={true} accentColor={accentColor} cardMode="simple" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <BiteCard topic={{ ...topic, amendment: { ...amendment }, state: 'ACTIVE' }} index={i} isNewest={false} accentColor={accentColor} cardMode="original" />
                      <BiteCard topic={topic} index={i} isNewest={false} accentColor={accentColor} cardMode="amendment" />
                      {(amendment.status === 'carried' || amendment.status === 'defeated') &&
                        <BiteCard topic={topic} index={i} isNewest={true} accentColor={accentColor} cardMode="final" />
                      }
                    </div>
                  );

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {/* + button top right */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 10px 0', flexShrink: 0 }}>
                      <button
                        onClick={() => setQuickMotionOpen(true)}
                        title="Quick Motion"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '3px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6,
                          background: '#fff', cursor: 'pointer', fontSize: 9, fontWeight: 700,
                          color: '#64748b', transition: 'all .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#475569'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Motion
                      </button>
                    </div>
                    <div ref={pbScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 8px' }}>
                      {motionCard}
                    </div>
                  </div>
                );
              })()}
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('floor', e, edge)} />
          </div>
        </div>

        {/* Topics + Clerk Notes (tabbed) */}
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
              <TopicsNotesTabbed topics={session.topics} status={session.status} />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('topics', e, edge)} />
          </div>
        </div>

        {/* Rules & Cheat Sheet */}
        <div style={panelStyle('rules')}>
          <div style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 0 }}>
            <BentoPanel
              title="Rules"
              icon={<svg width="13" height="13" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>}
              style={{ flex: 1, minHeight: 0 }}
              headerProps={{
                onMouseDown: (e) => startDrag('rules', e, 'move'),
                style: dragHandleStyle,
              }}
            >
              <RulesPanel topics={session.topics} transcript={session.transcript} />
            </BentoPanel>
            <EdgeHandles onEdgeDrag={(edge, e) => startDrag('rules', e, edge)} />
          </div>
        </div>
      </div>

      {/* Bottom: session controls + Quick Motion */}
      <SessionControls session={session} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      </div>{/* end main content area */}

      {/* Right toolbar */}
      <div style={{
        width: 52, flexShrink: 0,
        background: '#fff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '16px 0',
        gap: 24, zIndex: 50,
      }}>
        {/* Gear — settings */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: showSettings ? '#f1f5f9' : 'transparent',
              border: showSettings ? '1.5px solid #cbd5e1' : '1.5px solid transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!showSettings) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!showSettings) e.currentTarget.style.background = showSettings ? '#f1f5f9' : 'transparent'; }}
          >
            <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {showSettings && (
            <div style={{
              position: 'absolute', top: 0, right: 52,
              background: '#fff', borderRadius: 10, padding: '12px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              width: 200, zIndex: 300,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#94a3b8',
                letterSpacing: '1px', textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                Grid Theme
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(bgThemes || []).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onBgThemeChange?.(t)}
                    title={t.label}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: t.bg?.includes?.('gradient') ? t.bg : t.dot,
                      border: bgTheme?.id === t.id ? '2.5px solid #0f172a' : '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border 0.15s',
                      transform: bgTheme?.id === t.id ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              {bgTheme && (
                <span style={{ fontSize: 8.5, color: '#94a3b8', display: 'block', marginTop: 6 }}>
                  {bgTheme.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit tool */}
        <button
          title="Edit (coming soon)"
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'transparent',
            border: '1.5px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Lock panels */}
        <button
          onClick={() => setPanelsLocked(!panelsLocked)}
          title={panelsLocked ? 'Panels locked — click to unlock' : 'Panels unlocked — click to lock'}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: panelsLocked ? '#f1f5f9' : 'transparent',
            border: panelsLocked ? '1.5px solid #cbd5e1' : '1.5px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!panelsLocked) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
          onMouseLeave={e => { if (!panelsLocked) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
        >
          {panelsLocked ? (
            <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="#cbd5e1" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5" />
            </svg>
          )}
        </button>

        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
}
