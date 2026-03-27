import { useState } from 'react';
import { COLORS, TYPOGRAPHY } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle } from '../../styles/shared';
import { useToast } from '../shared/Toast';
import Spinner from '../shared/Spinner';

export default function ExportBar({ isDirty, onSave, onExport, onSaveToGraph, onBack, saving }) {
  const [graphSaving, setGraphSaving] = useState(false);
  const { addToast } = useToast();

  async function handleGraph() {
    setGraphSaving(true);
    try {
      await onSaveToGraph();
      addToast('Minutes saved to knowledge graph successfully.', 'success');
    } catch (e) {
      addToast('Failed to save to graph. Please try again.', 'error');
    } finally {
      setGraphSaving(false);
    }
  }

  async function handleSave() {
    try {
      await onSave();
      addToast('Minutes saved successfully.', 'success');
    } catch (e) {
      addToast('Failed to save minutes. Please try again.', 'error');
    }
  }

  function handleExport() {
    try {
      onExport();
      addToast('HTML export downloaded.', 'success');
    } catch (e) {
      addToast('Export failed. Please try again.', 'error');
    }
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
        <svg width="16" height="16" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24" role="img" aria-label="Meeting minutes">
          <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.headingText }}>Meeting Minutes</span>
        {isDirty && (
          <span role="status" style={{
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
          aria-label="Start a new session"
        >
          New Session
        </button>

        <button
          onClick={handleGraph}
          disabled={graphSaving}
          style={{
            ...outlineButtonStyle,
            padding: '6px 14px',
            fontSize: 12,
          }}
          aria-label="Save minutes to knowledge graph"
        >
          {graphSaving ? <Spinner size={12} color={COLORS.secondaryText} label="Saving to graph" /> : (
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          )}
          {graphSaving ? 'Saving...' : 'Save to Graph'}
        </button>

        <button
          onClick={handleExport}
          style={{ ...outlineButtonStyle, padding: '6px 14px', fontSize: 12 }}
          aria-label="Export minutes as HTML file"
        >
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export HTML
        </button>

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            ...gradientButtonStyle,
            padding: '6px 16px',
            fontSize: 12,
          }}
          aria-label="Save minutes"
        >
          {saving ? <><Spinner size={12} color="#fff" label="Saving" /> Saving...</> : 'Save Minutes'}
        </button>
      </div>
    </div>
  );
}
