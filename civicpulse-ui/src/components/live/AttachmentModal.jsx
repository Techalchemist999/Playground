import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function MapView({ attachment }) {
  const isZoning = attachment.id === 'att-9-map';
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
      padding: 20, overflow: 'auto',
    }}>
      {isZoning ? (
        <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 640, height: 'auto', background: '#f8fafc', borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <rect x="0" y="0" width="600" height="400" fill="#f8fafc" />
          {/* Pine Ave street */}
          <rect x="0" y="180" width="600" height="40" fill="#475569" />
          <text x="300" y="205" fontSize="14" fontWeight="700" fill="#fff" textAnchor="middle">Pine Avenue</text>
          {/* Lots */}
          <g fontFamily="Inter, sans-serif" fontSize="11" fill="#1e293b">
            {[0,1,2,3,4,5].map(i => (
              <g key={i}>
                <rect x={20 + i*95} y={50} width={85} height={120} fill="#fefce8" stroke="#cbd5e1" />
                <text x={62 + i*95} y={115} textAnchor="middle" fontWeight="600">4{810 + i*10}</text>
                <text x={62 + i*95} y={132} textAnchor="middle" fontSize="9" fill="#64748b">R1</text>
              </g>
            ))}
            {/* Highlighted lot 4820 → R2 */}
            <rect x="115" y="50" width="85" height="120" fill="#dbeafe" stroke="#3b82f6" strokeWidth="3" />
            <text x="157" y="115" textAnchor="middle" fontWeight="800" fill="#1e40af">4820</text>
            <text x="157" y="132" textAnchor="middle" fontSize="9" fill="#1e40af" fontWeight="700">R2 (proposed)</text>
          </g>
          <g fontFamily="Inter" fontSize="10" fill="#64748b">
            <circle cx="540" cy="50" r="5" fill="#3b82f6" />
            <text x="552" y="54">Proposed R2</text>
            <circle cx="540" cy="70" r="5" fill="#fefce8" stroke="#cbd5e1" />
            <text x="552" y="74">Existing R1</text>
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 720, height: 'auto', background: '#ecfccb', borderRadius: 10, border: '1px solid #a3e635', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
          {/* Park outline */}
          <rect x="0" y="0" width="600" height="400" fill="#ecfccb" />
          {/* Trees */}
          {[[60,60],[120,90],[80,340],[540,60],[560,340],[500,100],[540,300]].map(([cx,cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="18" fill="#65a30d" opacity="0.85" />
              <circle cx={cx-4} cy={cy-4} r="8" fill="#84cc16" opacity="0.6" />
            </g>
          ))}
          {/* Walking path */}
          <path d="M 30 200 Q 150 80 300 200 Q 450 320 570 200" stroke="#d6d3d1" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 30 200 Q 150 80 300 200 Q 450 320 570 200" stroke="#fff" strokeWidth="1" fill="none" strokeDasharray="6 6" />
          {/* Existing playground zone */}
          <rect x="175" y="130" width="140" height="100" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" rx="6" />
          <text x="245" y="175" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400e" fontFamily="Inter">Existing</text>
          <text x="245" y="192" textAnchor="middle" fontSize="10" fill="#92400e" fontFamily="Inter">Playground (2006)</text>
          {/* Proposed playground zone */}
          <rect x="335" y="130" width="170" height="130" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" rx="6" />
          <text x="420" y="180" textAnchor="middle" fontSize="13" fontWeight="800" fill="#14532d" fontFamily="Inter">Proposed</text>
          <text x="420" y="200" textAnchor="middle" fontSize="11" fill="#14532d" fontFamily="Inter">Playground Zone</text>
          <text x="420" y="218" textAnchor="middle" fontSize="10" fill="#166534" fontFamily="Inter" fontStyle="italic">2025 NDIT Grant</text>
          {/* Benches */}
          {[[200,280],[280,280],[360,280]].map(([x,y], i) => (
            <rect key={i} x={x} y={y} width="20" height="6" fill="#78350f" rx="1" />
          ))}
          {/* Gazebo */}
          <polygon points="100,280 130,260 160,280" fill="#9ca3af" />
          <rect x="105" y="280" width="50" height="30" fill="#d1d5db" />
          <text x="130" y="330" textAnchor="middle" fontSize="9" fontFamily="Inter" fill="#475569">Gazebo</text>
          {/* Legend */}
          <g transform="translate(20, 20)" fontFamily="Inter" fontSize="9">
            <rect x="0" y="0" width="150" height="70" fill="#fff" stroke="#cbd5e1" rx="4" opacity="0.95" />
            <text x="8" y="14" fontWeight="700" fill="#1e293b">Centennial Park</text>
            <text x="8" y="26" fill="#64748b" fontSize="8">Village of Pouce Coupe</text>
            <rect x="8" y="34" width="12" height="10" fill="#bbf7d0" stroke="#15803d" strokeWidth="2" />
            <text x="24" y="42" fill="#334155">Proposed work</text>
            <rect x="8" y="50" width="12" height="10" fill="#fde68a" stroke="#d97706" />
            <text x="24" y="58" fill="#334155">Existing playground</text>
          </g>
          {/* North arrow */}
          <g transform="translate(560, 20)">
            <circle cx="0" cy="0" r="14" fill="#fff" stroke="#475569" />
            <polygon points="0,-10 -5,5 0,2 5,5" fill="#475569" />
            <text x="0" y="20" fontSize="8" textAnchor="middle" fontFamily="Inter" fill="#475569">N</text>
          </g>
        </svg>
      )}
    </div>
  );
}

function ReportView({ attachment }) {
  const r = attachment.report;
  if (!r) return <div style={{ padding: 40, color: '#94a3b8' }}>No report data.</div>;

  // Chunk sections into pages — target the attachment's declared page count
  const targetPages = Math.max(1, attachment.pages || 1);
  const perPage = Math.max(1, Math.ceil(r.sections.length / targetPages));
  const pageGroups = [];
  for (let i = 0; i < r.sections.length; i += perPage) {
    pageGroups.push(r.sections.slice(i, i + perPage));
  }
  const totalPages = pageGroups.length;

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      background: '#e2e8f0', padding: '24px 24px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      {pageGroups.map((sections, pi) => (
        <div key={pi} style={{
          width: '100%', maxWidth: 720,
          background: '#fff', padding: '40px 48px',
          boxShadow: '0 4px 20px rgba(15,23,42,0.12)',
          borderRadius: 4,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#1f2937', lineHeight: 1.6,
          position: 'relative',
        }}>
          {/* Page-number watermark in top-right corner of every page */}
          <div style={{
            position: 'absolute', top: 12, right: 16,
            fontSize: 10, color: '#94a3b8', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, letterSpacing: 0.5,
          }}>
            Page {pi + 1} / {totalPages}
          </div>

          {/* Letterhead only on page 1 */}
          {pi === 0 && (
            <>
              <div style={{ borderBottom: '3px double #334155', paddingBottom: 14, marginBottom: 18, fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b' }}>Village of Pouce Coupe</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>Staff Report</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Ref {r.ref} · {r.date} · Prepared by {r.author}
                </div>
              </div>
              <table style={{ width: '100%', fontSize: 11, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
                <tbody>
                  <tr><td style={{ padding: '3px 0', color: '#64748b', width: 70, fontWeight: 700 }}>TO:</td><td style={{ padding: '3px 0', color: '#1e293b' }}>{r.to}</td></tr>
                  <tr><td style={{ padding: '3px 0', color: '#64748b', fontWeight: 700 }}>FROM:</td><td style={{ padding: '3px 0', color: '#1e293b' }}>{r.from}</td></tr>
                  <tr><td style={{ padding: '3px 0', color: '#64748b', fontWeight: 700 }}>SUBJECT:</td><td style={{ padding: '3px 0', color: '#1e293b', fontWeight: 600 }}>{r.subject}</td></tr>
                </tbody>
              </table>
            </>
          )}

          {/* Continuation header on subsequent pages */}
          {pi > 0 && (
            <div style={{
              fontSize: 9, color: '#94a3b8', fontFamily: 'Inter, sans-serif',
              letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
              paddingBottom: 8, borderBottom: '1px solid #e2e8f0',
            }}>
              {r.ref} · {r.subject} <span style={{ fontStyle: 'italic', textTransform: 'none' }}>— continued</span>
            </div>
          )}

          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{s.heading}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{s.text}</div>
            </div>
          ))}

          <div style={{
            marginTop: 28, paddingTop: 16, borderTop: '1px solid #e2e8f0',
            fontSize: 10, color: '#94a3b8', fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
          }}>
            {r.ref} · Page {pi + 1} of {totalPages}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetView({ attachment }) {
  const b = attachment.budget;
  if (!b) return <div style={{ padding: 40, color: '#94a3b8' }}>No budget data.</div>;
  const fmt = (n) => '$' + n.toLocaleString('en-CA');
  return (
    <div style={{
      flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: 24,
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 760, background: '#fff', borderRadius: 8,
        padding: 28, boxShadow: '0 4px 20px rgba(15,23,42,0.08)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b' }}>Budget Estimate</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>Playground Equipment — Centennial Park</div>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Recommended supplier: <b>{b.supplier}</b></div>

        <table style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Line Item</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, width: 60 }}>Qty</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, width: 110 }}>Unit</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, width: 120 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {b.lines.map((line, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', color: '#1e293b' }}>
                  {line.item}
                  {line.note && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>({line.note})</span>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontFamily: 'monospace' }}>{line.qty}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569', fontFamily: 'monospace' }}>{fmt(line.unitCost)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{fmt(line.subtotal)}</td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={3} style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: 13 }}>TOTAL</td>
              <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: 15, fontFamily: 'monospace' }}>{fmt(b.totalEstimate)}</td>
            </tr>
          </tbody>
        </table>
        {b.notes && (
          <div style={{ marginTop: 18, padding: '10px 14px', background: '#fef3c7', borderLeft: '3px solid #d97706', borderRadius: 4, fontSize: 11.5, color: '#78350f', lineHeight: 1.5 }}>
            <b>Notes:</b> {b.notes}
          </div>
        )}
      </div>
    </div>
  );
}

const TYPE_META = {
  map:    { label: 'Map',     iconPath: 'M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7' },
  report: { label: 'Staff Report', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  budget: { label: 'Budget',  iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
};

export default function AttachmentModal({ attachment, agendaItem, onClose }) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!attachment) return null;
  const meta = TYPE_META[attachment.type] || TYPE_META.report;

  const content = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'attachFadeIn .2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: fullscreen ? 'calc(100vw - 48px)' : 'min(576px, calc(100vw - 32px))',
          height: fullscreen ? 'calc(100vh - 48px)' : 'min(576px, calc(100vh - 32px))',
          background: '#fff', borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          animation: 'attachZoomIn .25s cubic-bezier(.22,1,.36,1)',
          transition: 'width .2s ease, height .2s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0, background: '#fff',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d={meta.iconPath} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 8, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase',
                color: '#fff', background: '#475569',
                padding: '2px 8px', borderRadius: 4,
              }}>
                {meta.label}
              </span>
              {agendaItem && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: '#64748b',
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  padding: '1px 6px', borderRadius: 4,
                }}>
                  Item {agendaItem.number}
                </span>
              )}
              <span style={{ fontSize: 9, color: '#94a3b8' }}>
                {attachment.pages || 1} page{(attachment.pages || 1) > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{
              fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {attachment.title}
            </div>
            {attachment.subtitle && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                {attachment.subtitle}
              </div>
            )}
          </div>
          <button
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            {fullscreen ? (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3v4a1 1 0 0 1-1 1H3M21 8h-4a1 1 0 0 1-1-1V3M3 16h4a1 1 0 0 1 1 1v4M16 21v-4a1 1 0 0 1 1-1h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {attachment.type === 'map' && <MapView attachment={attachment} />}
        {attachment.type === 'report' && <ReportView attachment={attachment} />}
        {attachment.type === 'budget' && <BudgetView attachment={attachment} />}
      </div>

      <style>{`
        @keyframes attachFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes attachZoomIn { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
