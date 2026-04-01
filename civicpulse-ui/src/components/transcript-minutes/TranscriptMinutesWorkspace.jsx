import { useState, useCallback } from 'react';
import { COLORS, SPACING, CATEGORY_COLORS } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle, cardStyle } from '../../styles/shared';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
}

// ─── Metadata Header ─────────────────────────────
function MetadataHeader({ metadata, isEditing, onUpdate }) {
  const meetingTypes = ['Regular Meeting', 'In Camera Meeting', 'Committee Meeting', 'Special Meeting', 'Public Hearing'];
  const fields = [
    { key: 'municipality', label: 'Municipality' },
    { key: 'meetingType', label: 'Meeting Type', options: meetingTypes },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'time', label: 'Time' },
    { key: 'location', label: 'Location' },
    { key: 'chair', label: 'Chair' },
  ];

  return (
    <div style={{
      ...cardStyle,
      padding: 0, overflow: 'hidden',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 55%, #f0fdf4 100%)',
        padding: '20px 24px 16px',
        borderBottom: '1px solid #e8eaf0',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.primary, marginBottom: 6 }}>
          Meeting Minutes
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.headingText, letterSpacing: '-0.3px' }}>
          {metadata.municipality || 'Council Meeting'}
        </div>
      </div>
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {fields.map(({ key, label, type, options }) => (
          <div key={key}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
              {label}
            </div>
            {isEditing ? (
              options ? (
                <select
                  value={metadata[key] || options[0]}
                  onChange={e => onUpdate(key, e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
                    color: COLORS.headingText, background: '#f8fafc',
                    border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={type || 'text'}
                  value={metadata[key] || ''}
                  onChange={e => onUpdate(key, e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
                    color: COLORS.headingText, background: '#f8fafc',
                    border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
                    fontFamily: 'inherit',
                  }}
                />
              )
            ) : (
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.headingText }}>
                {metadata[key] || '—'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Roll Call Section ─────────────────────────────
function RollCallSection({ rollCall, isEditing, onUpdate, onAdd, onRemove }) {
  const [isOpen, setIsOpen] = useState(true);
  const presentCount = rollCall.filter(a => a.present).length;

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: '#fafbfc', border: 'none',
          borderBottom: isOpen ? `1px solid ${COLORS.subtleBorder}` : 'none',
          borderLeft: `4px solid ${COLORS.primary}`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText, flex: 1, textAlign: 'left' }}>
          Roll Call
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: COLORS.primary,
          background: '#eef2ff', borderRadius: 999, padding: '2px 8px',
        }}>
          {presentCount}/{rollCall.length} present
        </span>
        <svg width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rollCall.map((attendee, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: '#f8fafc',
                border: `1px solid ${COLORS.subtleBorder}`, borderRadius: 8,
              }}>
                <button
                  onClick={() => onUpdate(i, { present: !attendee.present })}
                  disabled={!isEditing}
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: attendee.present
                      ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                      : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                    border: attendee.present ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
                    cursor: isEditing ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    color: attendee.present ? '#16a34a' : '#dc2626',
                  }}
                >
                  {attendee.present ? '✓' : '✗'}
                </button>
                {isEditing ? (
                  <>
                    <input
                      value={attendee.name}
                      onChange={e => onUpdate(i, { name: e.target.value })}
                      style={{
                        flex: 1, padding: '4px 8px', fontSize: 12, fontWeight: 600,
                        border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4,
                        fontFamily: 'inherit', background: '#fff',
                      }}
                    />
                    <select
                      value={attendee.role}
                      onChange={e => onUpdate(i, { role: e.target.value })}
                      style={{
                        padding: '4px 8px', fontSize: 11, border: `1px solid ${COLORS.primaryBorder}`,
                        borderRadius: 4, fontFamily: 'inherit', background: '#fff',
                      }}
                    >
                      {['Mayor', 'Councillor', 'CAO', 'Clerk', 'Delegation', 'Staff'].map(r =>
                        <option key={r} value={r}>{r}</option>
                      )}
                    </select>
                    <button onClick={() => onRemove(i)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14,
                    }}>×</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: COLORS.headingText }}>
                      {attendee.name}
                    </span>
                    <span style={{ fontSize: 10, color: COLORS.mutedText }}>{attendee.role}</span>
                  </>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <button onClick={onAdd} style={{
              ...outlineButtonStyle, marginTop: 8, padding: '6px 12px', fontSize: 11, width: '100%',
            }}>
              + Add Attendee
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Motion Card ─────────────────────────────
function MotionCard({ motion, isEditing, onUpdate }) {
  const resultColors = {
    carried: { bg: '#f0fdf4', border: '#dcfce7', color: '#22c55e', label: 'CARRIED' },
    defeated: { bg: '#fef2f2', border: '#fee2e2', color: '#dc2626', label: 'DEFEATED' },
    tabled: { bg: '#fffbeb', border: '#fef3c7', color: '#d97706', label: 'TABLED' },
    pending: { bg: '#f8fafc', border: '#e2e8f0', color: '#64748b', label: 'PENDING' },
  };
  const r = resultColors[motion.result] || resultColors.pending;
  const resultOptions = ['carried', 'defeated', 'tabled', 'pending'];

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${COLORS.cardBorder}`,
      borderLeft: `4px solid ${CATEGORY_COLORS.motion.color}`,
      borderRadius: '0 10px 10px 0',
      overflow: 'hidden', marginTop: 8,
    }}>
      {/* Motion text */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
          color: CATEGORY_COLORS.motion.color, marginBottom: 6,
        }}>
          Motion
        </div>
        {isEditing ? (
          <textarea
            value={motion.text}
            onChange={e => onUpdate('text', e.target.value)}
            style={{
              width: '100%', fontSize: 12, lineHeight: 1.75, color: COLORS.bodyText,
              border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
              padding: '8px 10px', fontFamily: 'inherit', background: '#f8fafc',
              resize: 'vertical', minHeight: 50,
            }}
          />
        ) : (
          <div style={{ fontSize: 12, lineHeight: 1.75, color: COLORS.bodyText }}>
            {motion.text}
          </div>
        )}
      </div>

      {/* Mover / Seconder */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
        <div style={{ flex: 1, background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 7, padding: '6px 8px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 2 }}>Moved By</div>
          {isEditing ? (
            <input value={motion.mover} onChange={e => onUpdate('mover', e.target.value)}
              style={{ fontSize: 12, fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', width: '100%', fontFamily: 'inherit', background: '#fff' }} />
          ) : (
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.headingText }}>{motion.mover}</div>
          )}
        </div>
        <div style={{ flex: 1, background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: 7, padding: '6px 8px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b', marginBottom: 2 }}>Seconded By</div>
          {isEditing ? (
            <input value={motion.seconder} onChange={e => onUpdate('seconder', e.target.value)}
              style={{ fontSize: 12, fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', width: '100%', fontFamily: 'inherit', background: '#fff' }} />
          ) : (
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.headingText }}>{motion.seconder}</div>
          )}
        </div>
      </div>

      {/* Result */}
      <div style={{
        padding: '8px 16px',
        background: r.bg,
        borderTop: `1px solid ${r.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {isEditing ? (
          <select
            value={motion.result}
            onChange={e => onUpdate('result', e.target.value)}
            style={{
              padding: '4px 10px', fontSize: 11, fontWeight: 700, color: r.color,
              background: '#fff', border: `1.5px solid ${r.border}`, borderRadius: 6,
              fontFamily: 'inherit',
            }}
          >
            {resultOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
          </select>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</span>
        )}
      </div>
    </div>
  );
}

// ─── Minutes Section ─────────────────────────────
function MinutesSection({ section, isEditing, onUpdateContent, onUpdateMotion }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', background: isOpen ? '#fafbfc' : '#fff', border: 'none',
          borderBottom: isOpen ? `1px solid ${COLORS.subtleBorder}` : 'none',
          borderLeft: `4px solid ${COLORS.primary}`,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.headingText, flex: 1, textAlign: 'left' }}>
          {section.title}
        </span>
        {section.motions.length > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: CATEGORY_COLORS.motion.color,
            background: CATEGORY_COLORS.motion.light, border: `1px solid ${CATEGORY_COLORS.motion.border}`,
            borderRadius: 999, padding: '2px 8px',
          }}>
            {section.motions.length} motion{section.motions.length > 1 ? 's' : ''}
          </span>
        )}
        <svg width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '16px 20px' }}>
          {isEditing ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={e => onUpdateContent(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: section.content || '<p><em>No content.</em></p>' }}
              style={{
                fontSize: 13, color: COLORS.bodyText, lineHeight: 1.8, outline: 'none',
                minHeight: 40, padding: 8, borderRadius: 6,
                border: `1px dashed ${COLORS.primaryBorder}`, background: '#fafbfc',
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: section.content || '<p><em>No content.</em></p>' }}
              style={{ fontSize: 13, color: COLORS.bodyText, lineHeight: 1.8 }}
            />
          )}
          {section.motions.map((motion, mi) => (
            <MotionCard
              key={motion.id}
              motion={motion}
              isEditing={isEditing}
              onUpdate={(field, value) => onUpdateMotion(mi, field, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sign-Off Block (name + title only) ─────────────────────────────
function ApprovalSignOff({ approval, isEditing, onUpdate }) {
  const isApproved = !!approval.approvedAt;

  return (
    <div style={{
      ...cardStyle, padding: 0, overflow: 'hidden',
      border: isApproved ? '1.5px solid #dcfce7' : `1px solid ${COLORS.cardBorder}`,
    }}>
      <div style={{
        padding: '14px 20px 10px',
        background: isApproved ? '#f0fdf4' : '#fafbfc',
        borderBottom: `1px solid ${isApproved ? '#dcfce7' : COLORS.subtleBorder}`,
        display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: `4px solid ${isApproved ? '#22c55e' : COLORS.primary}`,
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: isApproved ? '#16a34a' : COLORS.headingText }}>
          {isApproved ? 'Approved By' : 'Sign-Off'}
        </span>
        {isApproved && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#22c55e',
            background: '#dcfce7', borderRadius: 999, padding: '2px 8px', marginLeft: 'auto',
          }}>
            {new Date(approval.approvedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
            Name
          </div>
          {isEditing && !isApproved ? (
            <input
              value={approval.name || ''}
              onChange={e => onUpdate('name', e.target.value)}
              placeholder="e.g. Jane Smith"
              style={{
                width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
                color: COLORS.headingText, background: '#f8fafc',
                border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.headingText }}>
              {approval.name || '—'}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
            Title
          </div>
          {isEditing && !isApproved ? (
            <input
              value={approval.title || ''}
              onChange={e => onUpdate('title', e.target.value)}
              placeholder="e.g. Corporate Officer"
              style={{
                width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
                color: COLORS.headingText, background: '#f8fafc',
                border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.headingText }}>
              {approval.title || '—'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DOCX Export ─────────────────────────────
function exportToDocx(data, approval) {
  const children = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({ text: 'MEETING MINUTES', bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: data.metadata.municipality || 'Council Meeting', bold: true, size: 28 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));

  // Metadata
  const metaFields = [
    ['Date', data.metadata.date],
    ['Time', data.metadata.time],
    ['Location', data.metadata.location],
    ['Chair', data.metadata.chair],
    ['Clerk', data.metadata.clerk],
  ];
  metaFields.forEach(([label, val]) => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun(val || '—'),
      ],
    }));
  });
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Roll Call
  children.push(new Paragraph({ text: 'Roll Call', heading: HeadingLevel.HEADING_1 }));
  data.rollCall.forEach(a => {
    children.push(new Paragraph({
      text: `${a.present ? '✓' : '✗'} ${a.name} (${a.role}) — ${a.present ? 'Present' : 'Absent'}`,
    }));
  });
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // Sections
  data.sections.forEach(section => {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1, spacing: { before: 300 } }));
    const text = stripHtml(section.content);
    if (text) children.push(new Paragraph({ text, spacing: { after: 100 } }));

    section.motions.forEach(m => {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'MOTION: ', bold: true }), new TextRun(m.text)],
        spacing: { before: 200 },
      }));
      children.push(new Paragraph({
        text: `Moved by: ${m.mover}    Seconded by: ${m.seconder}`,
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: m.result.toUpperCase(), bold: true })],
        spacing: { after: 200 },
      }));
    });
  });

  // Sign-off
  children.push(new Paragraph({ text: '', spacing: { after: 400 } }));
  children.push(new Paragraph({ text: 'Approved By:', heading: HeadingLevel.HEADING_1 }));
  if (approval?.name) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Name: ', bold: true }), new TextRun(approval.name)],
    }));
  }
  if (approval?.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Title: ', bold: true }), new TextRun(approval.title)],
    }));
  }
  if (approval?.email) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Email: ', bold: true }), new TextRun(approval.email)],
    }));
  }
  if (approval?.approvedAt) {
    children.push(new Paragraph({
      children: [new TextRun({ text: `Approved on ${new Date(approval.approvedAt).toLocaleString()}`, bold: true, italics: true })],
      spacing: { before: 200 },
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  Packer.toBlob(doc).then(blob => {
    const filename = `minutes-${data.metadata.date || 'draft'}.docx`;
    saveAs(blob, filename);
  });
}

// ─── Main Workspace ─────────────────────────────
export default function TranscriptMinutesWorkspace({ session }) {
  const [data, setData] = useState(session.transcriptMinutesData);
  const [isEditing, setIsEditing] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const updateMetadata = useCallback((field, value) => {
    setData(prev => ({ ...prev, metadata: { ...prev.metadata, [field]: value } }));
    setIsDirty(true);
  }, []);

  const updateRollCall = useCallback((index, updates) => {
    setData(prev => ({
      ...prev,
      rollCall: prev.rollCall.map((a, i) => i === index ? { ...a, ...updates } : a),
    }));
    setIsDirty(true);
  }, []);

  const addAttendee = useCallback(() => {
    setData(prev => ({
      ...prev,
      rollCall: [...prev.rollCall, { name: 'New Attendee', role: 'Councillor', present: true }],
    }));
    setIsDirty(true);
  }, []);

  const removeAttendee = useCallback((index) => {
    setData(prev => ({
      ...prev,
      rollCall: prev.rollCall.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  }, []);

  const updateSectionContent = useCallback((sectionId, html) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, content: html } : s),
    }));
    setIsDirty(true);
  }, []);

  const updateMotion = useCallback((sectionId, motionIndex, field, value) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          motions: s.motions.map((m, i) => i === motionIndex ? { ...m, [field]: value } : m),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const [approval, setApproval] = useState({
    name: data?.metadata?.clerk || '',
    title: 'Corporate Officer',
    email: '',
    approvedAt: data?.approvedAt || null,
  });

  const updateApproval = useCallback((field, value) => {
    setApproval(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const approveMinutes = useCallback(() => {
    const now = new Date().toISOString();
    setApproval(prev => ({ ...prev, approvedAt: now }));
    setData(prev => ({ ...prev, approvedAt: now }));
    setIsEditing(false);
    setIsDirty(true);
  }, []);

  const unapprove = useCallback(() => {
    setApproval(prev => ({ ...prev, approvedAt: null }));
    setData(prev => ({ ...prev, approvedAt: null }));
    setIsDirty(true);
  }, []);

  if (!data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.mutedText }}>
        No transcript data loaded.
      </div>
    );
  }

  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  const copyApprovalLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?approve=${data.metadata.date || 'draft'}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setShowApprovalPanel(false);
  }, [data]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Approved banner */}
        {data.approvedAt && (
          <div style={{
            padding: '8px 20px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>
              These minutes were approved on {new Date(data.approvedAt).toLocaleString()}
            </span>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 60px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MetadataHeader metadata={data.metadata} isEditing={isEditing} onUpdate={updateMetadata} />
            <RollCallSection
              rollCall={data.rollCall}
              isEditing={isEditing}
              onUpdate={updateRollCall}
              onAdd={addAttendee}
              onRemove={removeAttendee}
            />
            {data.sections.map(section => (
              <MinutesSection
                key={section.id}
                section={section}
                isEditing={isEditing}
                onUpdateContent={html => updateSectionContent(section.id, html)}
                onUpdateMotion={(mi, field, value) => updateMotion(section.id, mi, field, value)}
              />
            ))}

            {/* Sign-off block — name and title only */}
            <ApprovalSignOff
              approval={approval}
              isEditing={isEditing}
              onUpdate={updateApproval}
              onApprove={approveMinutes}
              onUnapprove={unapprove}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          height: 44, background: '#fff', borderTop: `1px solid ${COLORS.cardBorder}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" stroke={COLORS.primary} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.headingText }}>Transcript Minutes</span>
          {data.approvedAt && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: '#22c55e',
              background: '#f0fdf4', border: '1px solid #dcfce7',
              borderRadius: 999, padding: '2px 8px',
            }}>
              Approved
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={session.reset} style={{ ...outlineButtonStyle, padding: '5px 12px', fontSize: 11 }}>
            New Session
          </button>
        </div>
      </div>

      {/* Right toolbar — matches page 2 style */}
      <div style={{
        width: 52, flexShrink: 0,
        background: '#fff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '16px 0',
        gap: 24, zIndex: 50,
      }}>
        {/* Gear — settings placeholder */}
        <button
          title="Settings"
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'transparent',
            border: '1.5px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Edit toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          title={isEditing ? 'Switch to view mode' : 'Switch to edit mode'}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: isEditing ? '#f1f5f9' : 'transparent',
            border: isEditing ? '1.5px solid #cbd5e1' : '1.5px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { if (!isEditing) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
          onMouseLeave={e => { if (!isEditing) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
        >
          {isEditing ? (
            <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="#cbd5e1" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>

        {/* Approval — share link */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowApprovalPanel(!showApprovalPanel)}
            title={data.approvedAt ? 'Approved — click to manage' : 'Share for approval'}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: data.approvedAt ? '#f0fdf4' : showApprovalPanel ? '#f1f5f9' : 'transparent',
              border: data.approvedAt ? '1.5px solid #dcfce7' : showApprovalPanel ? '1.5px solid #cbd5e1' : '1.5px solid transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!data.approvedAt && !showApprovalPanel) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
            onMouseLeave={e => { if (!data.approvedAt && !showApprovalPanel) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
          >
            <svg width="24" height="24" fill="none" stroke={data.approvedAt ? '#22c55e' : '#475569'} strokeWidth="1.8" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          {/* Approval flyout panel */}
          {showApprovalPanel && (
            <div style={{
              position: 'absolute', top: 0, right: 52,
              background: '#fff', borderRadius: 10, padding: '14px 16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              width: 240, zIndex: 300,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                Approval
              </div>

              {data.approvedAt ? (
                <>
                  <div style={{
                    padding: '8px 10px', background: '#f0fdf4', borderRadius: 8,
                    border: '1px solid #dcfce7', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Approved</div>
                      <div style={{ fontSize: 9, color: '#22c55e' }}>{new Date(data.approvedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <button onClick={() => { unapprove(); setShowApprovalPanel(false); }} style={{
                    width: '100%', padding: '7px', background: '#fff', border: '1.5px solid #e2e8f0',
                    borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#94a3b8', cursor: 'pointer',
                  }}>
                    Revoke Approval
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { approveMinutes(); setShowApprovalPanel(false); }} disabled={!approval.name?.trim()} style={{
                    width: '100%', padding: '8px', marginBottom: 8,
                    background: approval.name?.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e2e8f0',
                    border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    color: approval.name?.trim() ? '#fff' : '#94a3b8', cursor: approval.name?.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve Now
                  </button>
                  {!approval.name?.trim() && (
                    <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginBottom: 8 }}>
                      Fill in the sign-off name at the bottom first
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                    <button onClick={copyApprovalLink} style={{
                      width: '100%', padding: '7px', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                      borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      Copy Approval Link
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Export Word */}
        <button
          onClick={() => exportToDocx(data, approval)}
          title="Export to Word"
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'transparent',
            border: '1.5px solid transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <div style={{ flex: 1 }} />
      </div>
    </div>
  );
}
