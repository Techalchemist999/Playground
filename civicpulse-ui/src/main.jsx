import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, [contenteditable]:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
    border-radius: 4px;
  }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: 0.5; }
  @media (max-width: 768px) {
    .live-columns { flex-direction: column !important; }
    .sidebar-right { width: 100% !important; border-left: none !important; border-top: 1px solid #e2e8f0 !important; max-height: 240px !important; }
    .setup-card { max-width: 100% !important; margin: 12px !important; }
    .minutes-layout { flex-direction: column !important; }
    .minutes-sidebar { width: 100% !important; border-left: none !important; border-top: 1px solid #e2e8f0 !important; max-height: 300px !important; }
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
