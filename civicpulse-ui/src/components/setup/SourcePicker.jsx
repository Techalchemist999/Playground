import { useState } from 'react';
import { COLORS, SPACING } from '../../styles/tokens';
import { gradientButtonStyle } from '../../styles/shared';

const SOURCES = [
  {
    id: 'youtube',
    label: 'YouTube URL',
    desc: 'Best for archived recordings — paste a YouTube link',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="4" />
        <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'File Upload',
    desc: 'Best for local files — drag and drop audio or video',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 12 15 15" />
      </svg>
    ),
  },
  {
    id: 'mic',
    label: 'Microphone',
    desc: 'Best for live meetings — stream from your mic',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
];

export default function SourcePicker({ onIngest, loading }) {
  const [selected, setSelected] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);

  function validateUrl(url) {
    if (!url.trim()) return 'URL is required';
    try { new URL(url); } catch { return 'Please enter a valid URL'; }
    return '';
  }

  async function handleIngest() {
    if (!selected) return;
    if (selected === 'youtube') {
      const err = validateUrl(youtubeUrl);
      if (err) { setUrlError(err); return; }
      setUrlError('');
    }
    try {
      let result;
      if (selected === 'youtube') result = await onIngest('youtube', youtubeUrl);
      else if (selected === 'mic') result = await onIngest('mic');
      if (result) setIngestResult(result);
    } catch (e) { /* handled by parent */ }
  }

  async function handleFile(file) {
    try {
      const result = await onIngest('upload', file);
      if (result) setIngestResult(result);
    } catch (e) { /* handled by parent */ }
  }

  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: 10 }}>Audio Source</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {SOURCES.map((s) => {
          const isActive = selected === s.id;
          const isDone = ingestResult && selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { setSelected(s.id); setIngestResult(null); }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '16px 10px',
                background: isDone ? '#f0fdf4' : isActive ? COLORS.primaryLight : '#fff',
                border: `2px solid ${isDone ? '#bbf7d0' : isActive ? COLORS.primary : COLORS.cardBorder}`,
                borderRadius: SPACING.cardRadius,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <div style={{ color: isDone ? '#22c55e' : isActive ? COLORS.primary : COLORS.mutedText }}>
                {isDone ? (
                  <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#22c55e' : isActive ? COLORS.primary : COLORS.bodyText }}>
                {isDone ? 'Ready' : s.label}
              </span>
              <span style={{ fontSize: 10, color: COLORS.mutedText, textAlign: 'center', lineHeight: 1.4 }}>{s.desc}</span>
            </button>
          );
        })}
      </div>

      {selected === 'youtube' && !ingestResult && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: urlError ? 4 : 12 }}>
            <input
              value={youtubeUrl}
              onChange={(e) => { setYoutubeUrl(e.target.value); if (urlError) setUrlError(''); }}
              placeholder="https://youtube.com/watch?v=..."
              aria-label="YouTube URL"
              aria-invalid={!!urlError}
              style={{
                flex: 1, fontSize: 13, color: COLORS.headingText,
                background: '#f8fafc', border: `1px solid ${urlError ? '#dc2626' : COLORS.cardBorder}`,
                borderRadius: 8, padding: '9px 12px', outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = urlError ? '#dc2626' : COLORS.primaryBorder}
              onBlur={(e) => e.target.style.borderColor = urlError ? '#dc2626' : COLORS.cardBorder}
            />
            <button
              onClick={handleIngest}
              disabled={!youtubeUrl || loading}
              style={{
                ...gradientButtonStyle,
                padding: '9px 16px',
              }}
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
          {urlError && (
            <div role="alert" style={{ fontSize: 11.5, color: '#dc2626', marginBottom: 8 }}>{urlError}</div>
          )}
        </>
      )}

      {selected === 'upload' && !ingestResult && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*,video/*'; input.onchange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }; input.click(); }}
          style={{
            border: `2px dashed ${dragOver ? COLORS.primary : COLORS.cardBorder}`,
            borderRadius: SPACING.cardRadius,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? COLORS.primaryLight : '#f8fafc',
            transition: 'all .15s',
            marginBottom: 12,
          }}
        >
          <svg width="24" height="24" fill="none" stroke={COLORS.mutedText} strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 6 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.bodyText }}>
            Drop file here or click to browse
          </div>
          <div style={{ fontSize: 10.5, color: COLORS.mutedText, marginTop: 3 }}>Audio or video files</div>
        </div>
      )}

      {selected === 'mic' && !ingestResult && (
        <button
          onClick={handleIngest}
          disabled={loading}
          style={{ ...gradientButtonStyle, width: '100%', marginBottom: 12, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Connecting...' : 'Connect Microphone'}
        </button>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1.3,
  textTransform: 'uppercase',
  color: '#94a3b8',
};
