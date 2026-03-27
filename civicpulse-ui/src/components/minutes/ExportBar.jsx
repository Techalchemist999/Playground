import { useState } from 'react';
import { COLORS, TYPOGRAPHY } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle } from '../../styles/shared';

export default function ExportBar({ isDirty, onSave, onExport, onSaveToGraph, onBack, saving }) {
  const [graphSaved, setGraphSaved] = useState(false);

  async function handleGraph() {
    try {
      await onSaveToGraph();
      setGraphSaved(true);
      setTimeout(() => setGraphSaved(false), 3000);
    } catch (e) { /* handled */ }
  }

  return (
    <div style={{
      height: 52,
      background: '#fff',
      borderBottom: `1px solid ${COLORS.cardBorder}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 10,
      flexShrink: 0,
      fontFamily: TYPOGRAPHY.fontFamily,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.headingText }}>Meeting Minutes</span>
        {isDirty && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: COLORS.warningAmber,
            background: COLORS.warningLight, border: `1px solid ${COLORS.warningBorder}`,
            borderRadius: 4, padding: '2px 7px',
          }}>
            Unsaved changes
          </span>
        )}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button
          onClick={onBack}
          style={{ ...outlineButtonStyle, padding: '6px 14px', fontSize: 12 }}
        >
          New Session
        </button>

        <button
          onClick={handleGraph}
          disabled={graphSaved}
          style={{
            ...outlineButtonStyle,
            padding: '6px 14px',
            fontSize: 12,
            color: graphSaved ? '#22c55e' : COLORS.secondaryText,
            borderColor: graphSaved ? '#bbf7d0' : COLORS.cardBorder,
          }}
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          {graphSaved ? 'Saved to Graph' : 'Save to Graph'}
        </button>

        <button
          onClick={onExport}
          style={{ ...outlineButtonStyle, padding: '6px 14px', fontSize: 12 }}
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export HTML
        </button>

        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          style={{
            ...gradientButtonStyle,
            padding: '6px 16px',
            fontSize: 12,
            opacity: !isDirty || saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Minutes'}
        </button>
      </div>
    </div>
  );
}
