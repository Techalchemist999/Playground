import { useState, useEffect } from 'react';
import { COLORS } from '../../styles/tokens';
import * as api from '../../api/client';

export default function AgendaPicker({ selectedAgenda, onSelect }) {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listAgendas()
      .then((data) => setAgendas(data.agendas || []))
      .catch(() => setAgendas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '12px 0' }}>
        <div style={labelStyle}>Attach Agenda (Optional)</div>
        <div style={{ fontSize: 12, color: COLORS.mutedText, marginTop: 6 }}>Loading agendas...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={labelStyle}>Attach Agenda (Optional)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {agendas.map((agenda) => {
          const isSelected = selectedAgenda === agenda.id;
          return (
            <button
              key={agenda.id}
              onClick={() => onSelect(isSelected ? null : agenda.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: isSelected ? COLORS.primaryLight : '#fff',
                border: `1.5px solid ${isSelected ? COLORS.primary : COLORS.cardBorder}`,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all .15s',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: isSelected ? COLORS.primary : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isSelected ? (
                  <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? COLORS.primary : COLORS.headingText }}>
                  {agenda.title}
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.mutedText }}>
                  {agenda.date} · {agenda.items?.length || 0} items
                </div>
              </div>
            </button>
          );
        })}
        {agendas.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.mutedText, padding: '8px 0' }}>
            No agendas available. You can start without one.
          </div>
        )}
      </div>
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
