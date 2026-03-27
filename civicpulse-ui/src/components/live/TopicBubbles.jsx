import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, CATEGORY_COLORS, TOPIC_STATE_COLORS } from '../../styles/tokens';
import Spinner from '../shared/Spinner';
import TopicCard from './TopicCard';

const BUBBLE_STYLES = {
  topic:        { ring: '#a5b4fc', glow: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  bylaw:        { ring: '#fcd34d', glow: 'rgba(202,138,4,0.1)',    text: '#b45309' },
  department:   { ring: '#fdba74', glow: 'rgba(234,88,12,0.1)',    text: '#c2410c' },
  location:     { ring: '#6ee7b7', glow: 'rgba(5,150,105,0.1)',    text: '#059669' },
  program:      { ring: '#c4b5fd', glow: 'rgba(124,58,237,0.1)',   text: '#7c3aed' },
  policy:       { ring: '#f9a8d4', glow: 'rgba(219,39,119,0.1)',   text: '#db2777' },
  motion:       { ring: '#93c5fd', glow: 'rgba(37,99,235,0.1)',    text: '#1d4ed8' },
  organization: { ring: '#67e8f9', glow: 'rgba(6,182,212,0.1)',    text: '#0e7490' },
  budget:       { ring: '#fcd34d', glow: 'rgba(245,158,11,0.1)',   text: '#92400e' },
  person:       { ring: '#cbd5e1', glow: 'rgba(100,116,139,0.08)', text: '#475569' },
};

const LINGER_MS = 30000;

function getBubbleSize(mentionCount, compact) {
  const base = compact ? 42 : 54;
  const scale = compact ? 5 : 7;
  const max = compact ? 76 : 100;
  return Math.min(max, base + (mentionCount || 1) * scale);
}

function TopicBubble({ topic, compact, locked, isNew, onToggleLock }) {
  const bs = BUBBLE_STYLES[topic.category] || BUBBLE_STYLES.topic;
  const stateColor = TOPIC_STATE_COLORS[topic.state] || TOPIC_STATE_COLORS.DETECTED;
  const size = getBubbleSize(topic.mention_count, compact);
  const isExpired = topic.state === 'EXPIRED' || topic.state === 'EVICTED';
  const isFading = isExpired && !locked;
  const displaySize = isFading ? size * 0.75 : size;
  const fontSize = compact
    ? Math.max(7.5, Math.min(10, displaySize / 7.5))
    : Math.max(8.5, Math.min(12, displaySize / 8));

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
        animation: isNew ? 'centreBloom 1.8s cubic-bezier(.22,1,.36,1) both' : 'none',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'scale(0.4)' : 'scale(1)',
        boxShadow: [
          `0 0 0 2.5px ${locked ? '#6366f1' : bs.ring}`,
          `0 0 0 ${locked ? '5px' : '4px'} ${locked ? '#6366f130' : bs.ring + '20'}`,
          `0 0 ${locked ? 20 : 14}px ${bs.glow}`,
          `0 4px 12px -4px rgba(0,0,0,0.06)`,
        ].join(', '),
        flexShrink: 0,
      }}
    >
      {locked && (
        <div aria-hidden="true" style={{
          position: 'absolute', top: -2, right: -2,
          width: compact ? 12 : 14, height: compact ? 12 : 14,
          borderRadius: '50%', background: '#6366f1',
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
        color: locked ? '#6366f1' : bs.text,
        textAlign: 'center', padding: '0 5px',
        lineHeight: 1.2, maxWidth: displaySize - 14,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word', letterSpacing: '-0.2px',
      }}>
        {topic.label}
      </span>

      {topic.mention_count > 1 && !compact && (
        <span style={{
          fontSize: 7.5, fontWeight: 600,
          color: `${locked ? '#6366f1' : bs.text}80`,
          marginTop: 1, letterSpacing: '0.3px',
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
  const [viewMode, setViewMode] = useState('bubbles'); // 'bubbles' | 'cards'
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

  const topicsArray = Array.from(topics.values())
    .filter(t => t.state !== 'EVICTED')
    .sort((a, b) => (b.decay_score || 0) - (a.decay_score || 0));

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
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            style={{
              padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
              background: viewMode === 'cards' ? '#fff' : 'transparent',
              boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 600, color: viewMode === 'cards' ? COLORS.primary : COLORS.mutedText,
              transition: 'all .15s',
            }}
          >
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
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
          flexDirection: viewMode === 'cards' ? 'column' : 'row',
          gap: viewMode === 'cards' ? 5 : (compact ? 10 : 14),
          padding: viewMode === 'cards' ? '6px 8px' : (compact ? '8px 14px' : '16px 20px'),
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

        {/* Bubble view */}
        {viewMode === 'bubbles' && topicsArray.map((topic) => {
          const id = topic.normalized_id || topic.label;
          return (
            <TopicBubble
              key={id}
              topic={topic}
              compact={compact}
              locked={lockedIds.has(id)}
              isNew={newIds.has(id)}
              onToggleLock={toggleLock}
            />
          );
        })}

        {/* Card view */}
        {viewMode === 'cards' && topicsArray.map((topic) => (
          <TopicCard key={topic.normalized_id || topic.label} topic={topic} />
        ))}
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
                  boxShadow: `0 0 0 1.5px ${bs.ring}, 0 0 6px ${bs.glow}`,
                }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: COLORS.mutedText, textTransform: 'capitalize' }}>{cat}</span>
              </div>
            ))}
          {lockedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
              <svg width="8" height="8" fill="none" stroke="#6366f1" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: 9, color: '#6366f1', fontWeight: 600 }}>{lockedIds.size} pinned</span>
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
      `}</style>
    </div>
  );
}
