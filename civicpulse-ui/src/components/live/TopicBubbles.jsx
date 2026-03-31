import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';
import TopicCard from './TopicCard';
import TopicTimeline from './TopicTimeline';

// Apple Pearlescent — pastel gradient stops + ring + glow
const BUBBLE_STYLES = {
  topic:        { grad: ['#eef2ff','#c7d2fe','#a5b4fc','#818cf8'], ring: '#a5b4fc', glow: 'rgba(99,102,241,0.12)',  border: 'rgba(165,180,252,0.5)', text: '#4338ca' },
  bylaw:        { grad: ['#fefce8','#fde68a','#fcd34d','#fbbf24'], ring: '#fcd34d', glow: 'rgba(202,138,4,0.1)',    border: 'rgba(253,230,138,0.5)', text: '#92400e' },
  department:   { grad: ['#fff7ed','#fed7aa','#fdba74','#fb923c'], ring: '#fdba74', glow: 'rgba(234,88,12,0.1)',    border: 'rgba(253,186,116,0.5)', text: '#c2410c' },
  location:     { grad: ['#f8fafc','#e2e8f0','#cbd5e1','#94a3b8'], ring: '#cbd5e1', glow: 'rgba(100,116,139,0.08)', border: 'rgba(203,213,225,0.5)', text: '#475569' },
  program:      { grad: ['#f5f3ff','#ddd6fe','#c4b5fd','#a78bfa'], ring: '#c4b5fd', glow: 'rgba(124,58,237,0.1)',   border: 'rgba(196,181,253,0.5)', text: '#5b21b6' },
  policy:       { grad: ['#fdf2f8','#fbcfe8','#f9a8d4','#f472b6'], ring: '#f9a8d4', glow: 'rgba(219,39,119,0.1)',   border: 'rgba(251,207,232,0.5)', text: '#9d174d' },
  motion:       { grad: ['#eff6ff','#bfdbfe','#93c5fd','#60a5fa'], ring: '#93c5fd', glow: 'rgba(37,99,235,0.1)',    border: 'rgba(147,197,253,0.4)', text: '#1e40af' },
  organization: { grad: ['#ecfeff','#a5f3fc','#67e8f9','#22d3ee'], ring: '#67e8f9', glow: 'rgba(6,182,212,0.1)',    border: 'rgba(165,243,252,0.4)', text: '#155e75' },
  budget:       { grad: ['#ecfdf5','#a7f3d0','#6ee7b7','#34d399'], ring: '#6ee7b7', glow: 'rgba(5,150,105,0.1)',    border: 'rgba(110,231,183,0.4)', text: '#065f46' },
  person:       { grad: ['#f8fafc','#e2e8f0','#cbd5e1','#94a3b8'], ring: '#cbd5e1', glow: 'rgba(100,116,139,0.08)', border: 'rgba(203,213,225,0.5)', text: '#475569' },
};

const LINGER_MS = 30000;

function getBubbleSize(mentionCount, compact) {
  const base = compact ? 42 : 54;
  const scale = compact ? 5 : 7;
  const max = compact ? 76 : 100;
  return Math.min(max, base + (mentionCount || 1) * scale);
}

function TopicBubble({ topic, compact, locked, isNew, colorOn, onToggleLock }) {
  const bs = BUBBLE_STYLES[topic.category] || BUBBLE_STYLES.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count, compact);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isFading = isExpired && !locked;
  const displaySize = isFading ? size * 0.75 : size;
  const fontSize = compact
    ? Math.max(7.5, Math.min(10, displaySize / 7.5))
    : Math.max(8.5, Math.min(12, displaySize / 8));

  // Ring color — monochrome by default, category color when colorOn
  const ringColor = colorOn
    ? (locked ? '#475569' : bs.ring)
    : (locked ? '#475569' : '#cbd5e1');
  const ringGlow = colorOn ? bs.glow : 'rgba(0,0,0,0.04)';

  return (
    <div
      role="listitem"
      aria-label={`Topic: ${topic.label}, ${locked ? 'Pinned' : topic.state}. Click to ${locked ? 'unpin' : 'pin'}.`}
      onClick={() => onToggleLock(topic.normalized_id || topic.label)}
      style={{
        width: displaySize,
        height: displaySize,
        borderRadius: '50%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        transition: 'width 1s cubic-bezier(.22,1,.36,1), height 1s cubic-bezier(.22,1,.36,1), opacity 2s cubic-bezier(.22,1,.36,1), transform 2s cubic-bezier(.22,1,.36,1), box-shadow 0.8s ease',
        animation: isNew ? 'ringFadeIn 1.5s cubic-bezier(.22,1,.36,1) both' : 'none',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'scale(0.4)' : 'scale(1)',
        boxShadow: [
          `0 0 0 2.5px ${ringColor}`,
          `0 0 0 5px ${ringColor}20`,
          `0 0 ${locked ? 20 : 14}px ${ringGlow}`,
          `0 4px 12px -4px rgba(0,0,0,0.06)`,
        ].join(', '),
        flexShrink: 0,
      }}
    >
      {/* Highlight reflection */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 3, left: '18%',
        width: '40%', height: '22%', borderRadius: '50%',
        background: 'rgba(255,255,255,0.7)',
        filter: 'blur(2px)', pointerEvents: 'none',
      }} />
      {locked && (
        <div aria-hidden="true" style={{
          position: 'absolute', top: -2, right: -2,
          width: compact ? 12 : 14, height: compact ? 12 : 14,
          borderRadius: '50%', background: '#475569',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          <svg width={compact ? 6 : 7} height={compact ? 6 : 7} fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}

      {!locked && (
        <div aria-hidden="true" style={{
          position: 'absolute', top: 1, right: 1,
          width: compact ? 5 : 7, height: compact ? 5 : 7,
          borderRadius: '50%',
          background: stateColor,
          border: '1.5px solid #fff',
          boxShadow: `0 0 4px ${stateColor}40`,
        }} />
      )}

      <span style={{
        fontSize, fontWeight: 600,
        color: colorOn ? (locked ? '#334155' : bs.text) : (locked ? '#334155' : '#475569'),
        textAlign: 'center', padding: '0 5px',
        lineHeight: 1.2, maxWidth: displaySize - 14,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word', letterSpacing: '-0.3px',
        position: 'relative', zIndex: 1,
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && !compact && (
        <span style={{
          fontSize: 7.5, fontWeight: 600,
          color: `${locked ? '#6366f1' : bs.text}80`,
          marginTop: 1, letterSpacing: '0.3px',
          position: 'relative', zIndex: 1,
        }}>
          x{topic.mention_count}
        </span>
      )}
    </div>
  );
}

export default function TopicBubbles({ topics, status, compact }) {
  const [lockedIds, setLockedIds] = useState(new Set());
  const [newIds, setNewIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('bubbles'); // 'bubbles' | 'timeline'
  const [colorOn, setColorOn] = useState(false);
  const seenRef = useRef(new Set());
  const fadeTimers = useRef(new Map());

  // Track new arrivals for bloom animation
  useEffect(() => {
    const currentIds = new Set();
    topics.forEach((t, key) => {
      const id = t.normalized_id || t.label || key;
      currentIds.add(id);
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        setNewIds(prev => new Set(prev).add(id));
        // Remove "new" flag after animation completes
        setTimeout(() => {
          setNewIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 2000);
      }
    });
  }, [topics]);

  const toggleLock = useCallback((id) => {
    setLockedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Group by category so same-colored bubbles cluster together
  const CATEGORY_ORDER = Object.keys(BUBBLE_STYLES);
  const topicsArray = Array.from(topics.values())
    .filter(t => t.state !== 'EVICTED')
    .sort((a, b) => {
      const catA = CATEGORY_ORDER.indexOf(a.category ?? 'topic');
      const catB = CATEGORY_ORDER.indexOf(b.category ?? 'topic');
      if (catA !== catB) return catA - catB;
      return (b.decay_score || 0) - (a.decay_score || 0);
    });

  const isConnecting = status === 'ACTIVE' && topicsArray.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* View toggle — top right */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        padding: '6px 10px 0', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2,
        }}>
          <button
            onClick={() => setViewMode('bubbles')}
            aria-label="Bubble view"
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: viewMode === 'bubbles' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'bubbles' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: viewMode === 'bubbles' ? COLORS.primary : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            aria-label="Timeline view"
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: viewMode === 'timeline' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: viewMode === 'timeline' ? COLORS.primary : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="20" x2="21" y2="20"/></svg>
          </button>
          <div style={{ width: 1, background: '#e2e8f0', margin: '2px 2px' }} />
          <button
            onClick={() => setColorOn(!colorOn)}
            aria-label={colorOn ? 'Turn off color' : 'Turn on color'}
            title={colorOn ? 'Color on — click to turn off' : 'Color off — click to turn on'}
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: colorOn ? '#fff' : 'transparent',
              boxShadow: colorOn ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: colorOn ? '#475569' : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            {colorOn ? (
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        role="list"
        aria-label="Detected meeting topics"
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: viewMode === 'bubbles' ? 'wrap' : 'nowrap',
          flexDirection: viewMode === 'timeline' ? 'column' : 'row',
          gap: viewMode === 'timeline' ? 5 : (compact ? 16 : 22),
          padding: viewMode === 'timeline' ? '6px 8px' : (compact ? '8px 14px' : '16px 20px'),
          alignContent: viewMode === 'bubbles' ? 'flex-start' : undefined,
          justifyContent: viewMode === 'bubbles' ? 'center' : undefined,
          overflowY: 'auto',
        }}
      >
        {isConnecting && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '20px 0', width: '100%',
          }}>
            <Spinner size={20} label="Detecting topics" />
            <span style={{ fontSize: 11, fontWeight: 500, color: COLORS.mutedText }}>Analyzing audio...</span>
          </div>
        )}
        {!isConnecting && topicsArray.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            color: COLORS.mutedText, padding: '20px 0', width: '100%',
          }}>
            <svg width={compact ? 24 : 32} height={compact ? 24 : 32} fill="none" stroke={COLORS.cardBorder} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 6 }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500 }}>Topics appear as detected...</span>
          </div>
        )}

        {/* Bubble view — clustered by category */}
        {viewMode === 'bubbles' && (() => {
          // Group topics by category
          const groups = {};
          topicsArray.forEach(topic => {
            const cat = topic.category || 'topic';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(topic);
          });
          // Render each category as a tight cluster
          return Object.entries(groups).map(([cat, catTopics]) => (
            <div
              key={cat}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: compact ? 4 : 6,
                padding: compact ? 4 : 6,
                borderRadius: '999px',
                background: colorOn
                  ? `${(BUBBLE_STYLES[cat] || BUBBLE_STYLES.topic).glow}`
                  : 'rgba(0,0,0,0.015)',
                transition: 'background 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              {catTopics.map(topic => {
                const id = topic.normalized_id || topic.label;
                return (
                  <TopicBubble
                    key={id}
                    topic={topic}
                    compact={compact}
                    locked={lockedIds.has(id)}
                    isNew={newIds.has(id)}
                    colorOn={colorOn}
                    onToggleLock={toggleLock}
                  />
                );
              })}
            </div>
          ));
        })()}

        {/* Timeline view */}
        {viewMode === 'timeline' && topicsArray.length > 0 && (
          <TopicTimeline topics={topicsArray} />
        )}
      </div>

      {topicsArray.length > 0 && (
        <div style={{
          padding: '6px 14px 8px',
          borderTop: `1px solid ${COLORS.subtleBorder}`,
          display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0,
          alignItems: 'center',
        }}>
          {Object.entries(BUBBLE_STYLES)
            .filter(([cat]) => topicsArray.some(t => t.category === cat))
            .map(([cat, bs]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#fff',
                  boxShadow: `0 0 0 1.5px ${colorOn ? bs.ring : '#cbd5e1'}`,
                }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
              </div>
            ))}
          {lockedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
              <svg width="8" height="8" fill="none" stroke="#475569" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: 9, color: '#475569', fontWeight: 600 }}>{lockedIds.size} pinned</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes centreBloom {
          0%   { transform: scale(0); opacity: 0; }
          20%  { opacity: 0.2; transform: scale(0.2); }
          45%  { opacity: 0.6; transform: scale(0.7); }
          65%  { opacity: 0.85; transform: scale(0.95); }
          80%  { opacity: 0.95; transform: scale(1.04); }
          90%  { transform: scale(0.99); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes ringFadeIn {
          0%   { transform: scale(0.3); opacity: 0; box-shadow: 0 0 0 0px transparent; }
          40%  { transform: scale(0.8); opacity: 0.5; }
          70%  { transform: scale(1.05); opacity: 0.9; }
          85%  { transform: scale(0.98); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
