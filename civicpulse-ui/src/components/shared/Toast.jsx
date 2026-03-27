import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { COLORS, TYPOGRAPHY } from '../../styles/tokens';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: 'M20 6L9 17l-5-5' },
  error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: 'M18 6L6 18M6 6l12 12' },
  info:    { bg: '#eef2ff', border: '#c7d2fe', color: '#6366f1', icon: 'M12 8v4m0 4h.01' },
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: 'M12 9v4m0 4h.01' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 56,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 380,
        }}
      >
        {toasts.map((toast) => {
          const t = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                background: t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                animation: 'toastIn .3s ease',
                fontFamily: TYPOGRAPHY.fontFamily,
              }}
            >
              <svg width="16" height="16" fill="none" stroke={t.color} strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }} role="img" aria-hidden="true">
                {toast.type === 'success' && <><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d={t.icon} /></>}
                {toast.type === 'error' && <><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d={t.icon} /></>}
                {(toast.type === 'info' || toast.type === 'warning') && <><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d={t.icon} /></>}
              </svg>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: t.color, lineHeight: 1.5, flex: 1 }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: t.color, opacity: 0.6, padding: 0, flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be within ToastProvider');
  return ctx;
}
