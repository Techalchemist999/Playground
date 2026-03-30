import { useState } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';

export default function BentoPanel({ title, icon, badge, collapsed: defaultCollapsed = false, style, children }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div style={{
      background: COLORS.cardBg,
      borderRadius: SPACING.cardRadius,
      border: `1px solid ${COLORS.cardBorder}`,
      boxShadow: '0 2px 14px rgba(99,102,241,.07)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all .3s cubic-bezier(.22,1,.36,1)',
      ...style,
    }}>
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-label={`${title} panel — click to ${collapsed ? 'expand' : 'collapse'}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: collapsed ? '#fafbfc' : 'transparent',
          border: 'none',
          borderBottom: collapsed ? 'none' : `1px solid ${COLORS.subtleBorder}`,
          transition: 'background .15s',
          flexShrink: 0,
        }}
      >
        {icon}
        <span style={{ fontWeight: 700, fontSize: 12.5, color: COLORS.headingText }}>{title}</span>
        {badge && (
          <div style={{
            background: COLORS.primaryLight,
            border: `1px solid ${COLORS.primaryBorder}`,
            borderRadius: 999, padding: '0px 7px',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary }}>{badge}</span>
          </div>
        )}
        <svg
          width="11" height="11" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ marginLeft: 'auto', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Content — collapsible */}
      <div style={{
        flex: collapsed ? 0 : 1,
        overflow: collapsed ? 'hidden' : 'auto',
        display: collapsed ? 'none' : 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {children}
      </div>
    </div>
  );
}
