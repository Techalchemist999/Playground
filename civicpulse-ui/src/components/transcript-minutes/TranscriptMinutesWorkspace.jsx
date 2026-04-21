import { useState, useCallback, useRef, useEffect } from 'react';
import { COLORS, SPACING, CATEGORY_COLORS } from '../../styles/tokens';
import { gradientButtonStyle, outlineButtonStyle, cardStyle } from '../../styles/shared';
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import { summarizeText } from '../../utils/summarize';

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || '';
}

// ─── Summarize / Rephrase button ─────────────────────────────
// Appears at the bottom-right of a filled discussion box in edit mode.
// Click once: summarizes either the current text selection inside the box,
// or the whole box if nothing is selected. Each subsequent click uses a
// higher `seed` so the LLM returns a fresh variant.
function SummarizeButton({ editRef, onReplace }) {
  const [busy, setBusy] = useState(false);
  const seedRef = useRef(0);
  // We track selections as CHARACTER OFFSETS in textContent, not DOM Ranges,
  // because React's dangerouslySetInnerHTML re-render invalidates Range nodes.
  // { originalText, startOffset, currentEndOffset } — currentEndOffset grows/shrinks
  // as we replace with each new summary so repeat clicks still hit the right span.
  const savedRef = useRef(null);

  // Convert a (node, offset) inside `root` into an absolute char offset in root.textContent.
  const getTextOffset = (root, node, offset) => {
    if (!root.contains(node)) return -1;
    if (node === root) {
      // Offset is a child-index — collapse prior children to a character count.
      let total = 0;
      for (let i = 0; i < offset && i < node.childNodes.length; i++) {
        total += node.childNodes[i].textContent?.length || 0;
      }
      return total;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    let total = 0;
    while ((n = walker.nextNode())) {
      if (n === node) return total + offset;
      total += n.textContent.length;
    }
    return total;
  };

  // Track the most recent non-collapsed selection inside our editor.
  useEffect(() => {
    const handler = () => {
      const box = editRef.current;
      if (!box) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      if (!box.contains(range.startContainer) || !box.contains(range.endContainer)) return;
      const text = sel.toString();
      if (!text.trim()) return;
      const startOffset = getTextOffset(box, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(box, range.endContainer, range.endOffset);
      if (startOffset < 0 || endOffset < 0 || endOffset <= startOffset) return;
      savedRef.current = { originalText: text, startOffset, currentEndOffset: endOffset };
    };
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, [editRef]);

  const handleMouseDown = (e) => {
    e.preventDefault();  // don't steal focus from the contentEditable
  };

  const handleClick = async () => {
    const box = editRef.current;
    if (!box) return;

    const saved = savedRef.current;
    let sourceText, replaceRange = null;
    if (saved && saved.originalText.trim()) {
      sourceText = saved.originalText;
      replaceRange = [saved.startOffset, saved.currentEndOffset];
    } else {
      sourceText = box.textContent || '';
    }
    if (!sourceText.trim()) return;

    const seed = seedRef.current;
    seedRef.current += 1;

    try {
      setBusy(true);
      const summary = await summarizeText(sourceText, { seed });
      if (!summary) return;

      if (replaceRange) {
        const current = box.textContent || '';
        const [start, end] = replaceRange;
        const safeStart = Math.max(0, Math.min(current.length, start));
        const safeEnd = Math.max(safeStart, Math.min(current.length, end));
        const newText = current.slice(0, safeStart) + summary + current.slice(safeEnd);
        savedRef.current = {
          originalText: saved.originalText,
          startOffset: safeStart,
          currentEndOffset: safeStart + summary.length,
        };
        onReplace(newText);
      } else {
        savedRef.current = null;
        onReplace(summary);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      disabled={busy}
      title="Summarize / rephrase (highlight text first to target just that section; click again to regenerate)"
      style={{
        position: 'absolute', right: 6, bottom: 6,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', fontSize: 10, fontWeight: 700,
        color: busy ? COLORS.mutedText : COLORS.secondaryText,
        background: '#fff',
        border: `1px solid ${COLORS.primaryBorder}`,
        borderRadius: 999, cursor: busy ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        opacity: busy ? 0.7 : 1,
      }}
      onMouseEnter={e => { if (!busy) e.currentTarget.style.color = COLORS.headingText; }}
      onMouseLeave={e => { if (!busy) e.currentTarget.style.color = COLORS.secondaryText; }}
    >
      <span style={{ fontSize: 11 }}>✨</span>
      {busy ? 'Rephrasing…' : 'Summarize'}
    </button>
  );
}

// ─── Metadata Header ─────────────────────────────
function MetadataHeader({ metadata, isEditing, onUpdate }) {
  const meetingTypes = ['Regular Meeting', 'In Camera Meeting', 'Committee Meeting', 'Special Meeting', 'Public Hearing'];

  // Format date for display: "Wednesday, November 26, 2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  // Build title from meeting type: "REGULAR COUNCIL MEETING MINUTES"
  const meetingTitle = (metadata.meetingType || 'Regular Meeting')
    .replace(/meeting/i, '').trim().toUpperCase() + ' COUNCIL MEETING MINUTES';

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      {/* Centered header block — matches PDF style */}
      <div style={{
        padding: '28px 24px 20px', textAlign: 'center',
        borderBottom: `1px solid ${COLORS.subtleBorder}`,
      }}>
        <img
          src="/pouce-coupe-logo.jpg"
          alt="Village of Pouce Coupe"
          style={{ width: 80, height: 'auto', marginBottom: 12 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{
          fontSize: 18, fontWeight: 800, letterSpacing: '0.5px',
          color: COLORS.headingText, marginBottom: 4,
        }}>
          {meetingTitle}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.headingText }}>
          {formatDate(metadata.date)}
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {metadata.time || '—'} — {metadata.location || 'Council Chambers'}
        </div>
      </div>

      {/* Editable fields (shown in edit mode) */}
      {isEditing && (
        <div style={{ padding: '14px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#fafbfc' }}>
          {[
            { key: 'municipality', label: 'Local Government' },
            { key: 'meetingType', label: 'Meeting Type', options: meetingTypes },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'time', label: 'Time' },
            { key: 'location', label: 'Location' },
            { key: 'chair', label: 'Chair' },
            { key: 'clerk', label: 'Clerk / Corporate Officer' },
          ].map(({ key, label, type, options }) => (
            <div key={key}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                {label}
              </div>
              {options ? (
                <select
                  value={metadata[key] || options[0]}
                  onChange={e => onUpdate(key, e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', fontSize: 13, fontWeight: 600,
                    color: COLORS.headingText, background: '#fff',
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
                    color: COLORS.headingText, background: '#fff',
                    border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
                    fontFamily: 'inherit',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Roll Call Section ─────────────────────────────
function RollCallSection({ rollCall, isEditing, onUpdate, onAdd, onRemove }) {
  const [isOpen, setIsOpen] = useState(true);
  const [dropGroup, setDropGroup] = useState(null);

  // Group attendees: Present (non-staff, present), Absent (non-staff, absent), Staff
  const staffRoles = ['Staff', 'CAO', 'Clerk'];
  const present = rollCall.map((a, i) => ({ ...a, _i: i })).filter(a => a.present && !staffRoles.includes(a.role));
  const absent = rollCall.map((a, i) => ({ ...a, _i: i })).filter(a => !a.present && !staffRoles.includes(a.role));
  const staff = rollCall.map((a, i) => ({ ...a, _i: i })).filter(a => staffRoles.includes(a.role));

  const INTERACTIVE_TAGS = new Set(['input', 'textarea', 'select', 'button', 'option']);
  const isInteractiveTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (INTERACTIVE_TAGS.has(tag)) return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const groupDropProps = (groupName) => ({
    onDragOver: (e) => {
      if (!isEditing) return;
      if (!e.dataTransfer.types.includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dropGroup !== groupName) setDropGroup(groupName);
    },
    onDragLeave: () => { if (dropGroup === groupName) setDropGroup(null); },
    onDrop: (e) => {
      if (!isEditing) return;
      e.preventDefault();
      setDropGroup(null);
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload.startsWith('att:')) return;
      const idx = parseInt(payload.slice('att:'.length), 10);
      if (Number.isNaN(idx)) return;
      const attendee = rollCall[idx];
      if (!attendee) return;
      if (groupName === 'present' && (!attendee.present || staffRoles.includes(attendee.role))) {
        const patch = { present: true };
        if (staffRoles.includes(attendee.role)) patch.role = 'Councillor';
        onUpdate(idx, patch);
      } else if (groupName === 'absent' && (attendee.present || staffRoles.includes(attendee.role))) {
        const patch = { present: false };
        if (staffRoles.includes(attendee.role)) patch.role = 'Councillor';
        onUpdate(idx, patch);
      } else if (groupName === 'staff' && !staffRoles.includes(attendee.role)) {
        onUpdate(idx, { role: 'Staff', present: true });
      }
    },
  });

  const renderAttendee = (attendee) => {
    const i = attendee._i;
    return (
      <div
        key={i}
        draggable={isEditing}
        onDragStart={e => {
          if (!isEditing) return;
          if (isInteractiveTarget(e.target)) { e.preventDefault(); return; }
          e.dataTransfer.setData('text/plain', `att:${i}`);
          e.dataTransfer.effectAllowed = 'move';
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: isEditing ? '6px 12px' : '2px 0',
          background: isEditing ? '#f8fafc' : 'transparent',
          border: isEditing ? `1px solid ${COLORS.subtleBorder}` : 'none',
          borderRadius: 8,
        }}>
        {isEditing && (
          <button
            onClick={() => onUpdate(i, { present: !attendee.present })}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: attendee.present
                ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)'
                : 'linear-gradient(135deg, #fee2e2, #fecaca)',
              border: attendee.present ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
              color: attendee.present ? '#16a34a' : '#dc2626',
            }}
          >
            {attendee.present ? '✓' : '✗'}
          </button>
        )}
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
          <span style={{ fontSize: 13, color: COLORS.headingText }}>{attendee.name}</span>
        )}
      </div>
    );
  };

  const groupLabelStyle = {
    fontSize: 11, fontWeight: 700, color: '#475569',
    marginBottom: 4, marginTop: 10,
  };

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
        <svg width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '8px 20px 16px' }}>
          {/* Present */}
          <div style={groupLabelStyle}>Present:</div>
          <div
            {...groupDropProps('present')}
            style={{
              display: 'flex', flexDirection: 'column', gap: isEditing ? 6 : 2,
              minHeight: isEditing ? 28 : undefined,
              padding: isEditing ? 4 : 0,
              borderRadius: 8,
              border: dropGroup === 'present' ? '2px dashed #3b82f6' : (isEditing ? '2px dashed transparent' : 'none'),
              background: dropGroup === 'present' ? '#eff6ff' : 'transparent',
              transition: 'background .1s, border-color .1s',
            }}
          >
            {present.map(renderAttendee)}
            {present.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>None</div>}
          </div>

          {/* Absent */}
          <div style={groupLabelStyle}>Absent:</div>
          <div
            {...groupDropProps('absent')}
            style={{
              display: 'flex', flexDirection: 'column', gap: isEditing ? 6 : 2,
              minHeight: isEditing ? 28 : undefined,
              padding: isEditing ? 4 : 0,
              borderRadius: 8,
              border: dropGroup === 'absent' ? '2px dashed #3b82f6' : (isEditing ? '2px dashed transparent' : 'none'),
              background: dropGroup === 'absent' ? '#eff6ff' : 'transparent',
              transition: 'background .1s, border-color .1s',
            }}
          >
            {absent.map(renderAttendee)}
            {absent.length === 0 && !isEditing && <div style={{ fontSize: 12, color: '#94a3b8' }}>—</div>}
            {absent.length === 0 && isEditing && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Drop here to mark absent</div>}
          </div>

          {/* Staff */}
          <div style={groupLabelStyle}>Staff:</div>
          <div
            {...groupDropProps('staff')}
            style={{
              display: 'flex', flexDirection: 'column', gap: isEditing ? 6 : 2,
              minHeight: isEditing ? 28 : undefined,
              padding: isEditing ? 4 : 0,
              borderRadius: 8,
              border: dropGroup === 'staff' ? '2px dashed #3b82f6' : (isEditing ? '2px dashed transparent' : 'none'),
              background: dropGroup === 'staff' ? '#eff6ff' : 'transparent',
              transition: 'background .1s, border-color .1s',
            }}
          >
            {staff.map(renderAttendee)}
            {staff.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>None</div>}
          </div>

          {isEditing && (
            <button onClick={onAdd} style={{
              ...outlineButtonStyle, marginTop: 10, padding: '6px 12px', fontSize: 11, width: '100%',
            }}>
              + Add Attendee
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const SUBSIDIARY_TYPES = [
  { key: 'amend',             menu: 'Amendment',             cardLabel: 'AMENDMENT:' },
  { key: 'postpone',          menu: 'Postpone indefinitely', cardLabel: 'POSTPONE INDEFINITELY:' },
  { key: 'refer',             menu: 'Refer to committee',    cardLabel: 'REFER:' },
  { key: 'defer',             menu: 'Defer',                 cardLabel: 'DEFER:' },
  { key: 'table',             menu: 'Lay on the table',      cardLabel: 'LAY ON TABLE:' },
  { key: 'withdraw',          menu: 'Withdraw',              cardLabel: 'WITHDRAW:' },
  { key: 'previous-question', menu: 'Previous question',     cardLabel: 'PREVIOUS QUESTION:' },
];
const subsidiaryCardLabel = (type) =>
  SUBSIDIARY_TYPES.find(t => t.key === type)?.cardLabel || 'SUBSIDIARY MOTION:';

// ─── Motion Card — Nested But Flat ─────────────────────────────
// Renders a motion with an optional subsidiary (nested procedural motion) as three sibling cards:
//   1) MOTION (original)  2) SUBSIDIARY (indented, L-connector)  3) MOTION — vote (snaps back)
// When there's no subsidiary, renders a single flat card plus a "+ Nested motion" dropdown.
function MotionCard({ motion, motionIndex, isEditing, onUpdate, onDelete, onReorder, onAddSibling, resolutionNumber }) {
  const [isDragTarget, setIsDragTarget] = useState(false);
  const resultOptions = ['carried', 'carried unanimously', 'defeated', 'tabled', 'withdrawn'];
  const resultLabel = (motion.result || 'pending').toUpperCase();
  const a = motion.subsidiary;
  const hasSubsidiary = !!a;
  const subType = a?.type || 'amend';
  const subsidiaryCarried = hasSubsidiary && a.status === 'carried';

  const cardBase = {
    background: '#fff',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 10,
    padding: '12px 14px',
    marginTop: 10,
    position: 'relative',
  };
  const cardAmend = {
    ...cardBase,
    marginLeft: 24,
    borderLeft: '3px solid #f59e0b',
    background: '#fffdf7',
    position: 'relative',
  };
  const sectionLabel = { fontSize: 13, fontWeight: 700, color: COLORS.headingText, marginBottom: 4 };
  const bodyText = { fontSize: 13, lineHeight: 1.7, color: COLORS.bodyText, marginBottom: 6 };

  const textField = (value, onChange) => (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', fontSize: 13, lineHeight: 1.7, color: COLORS.bodyText,
        border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
        padding: '8px 10px', fontFamily: 'inherit', background: '#f8fafc',
        resize: 'vertical', minHeight: 50,
      }}
    />
  );

  const movedSeconded = (mover, seconder, onMover, onSeconder) => (
    <div style={{ marginTop: 6 }}>
      {isEditing ? (
        <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>MOVED BY: </span>
            <input value={mover || ''} onChange={e => onMover && onMover(e.target.value)} disabled={!onMover}
              style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4, padding: '2px 6px', fontFamily: 'inherit', background: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>SECONDED BY: </span>
            <input value={seconder || ''} onChange={e => onSeconder && onSeconder(e.target.value)} disabled={!onSeconder}
              style={{ fontSize: 12, fontWeight: 600, border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4, padding: '2px 6px', fontFamily: 'inherit', background: '#fff' }} />
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: COLORS.bodyText }}>
            <span style={{ fontWeight: 700 }}>MOVED BY:</span> {mover}
          </div>
          <div style={{ fontSize: 13, color: COLORS.bodyText }}>
            <span style={{ fontWeight: 700 }}>SECONDED BY:</span> {seconder}
          </div>
        </>
      )}
    </div>
  );

  const dispositionPill = (text) => {
    const t = (text || '').toLowerCase();
    const palette = t.includes('carried') ? { bg: '#dcfce7', fg: '#166534' }
      : t.includes('defeated') ? { bg: '#fee2e2', fg: '#991b1b' }
      : t.includes('tabled') ? { bg: '#fef3c7', fg: '#92400e' }
      : { bg: '#f1f5f9', fg: '#475569' };
    return (
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: '.6px',
        padding: '4px 10px', borderRadius: 999,
        background: palette.bg, color: palette.fg,
        textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {(text || 'pending').toUpperCase()}
      </span>
    );
  };

  const rollCallLines = (source, onFieldUpdate) => {
    const inputStyle = {
      fontSize: 12, fontWeight: 600,
      border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4,
      padding: '2px 6px', fontFamily: 'inherit', background: '#fff',
      minWidth: 220,
    };
    const fields = [
      { key: 'inFavor', label: 'IN FAVOR' },
      { key: 'opposed', label: 'OPPOSED' },
      { key: 'absent',  label: 'ABSENT' },
    ];
    if (isEditing) {
      return (
        <>
          {fields.map(({ key, label }, i) => (
            <div key={key} style={i === 0 ? undefined : { marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{label}: </span>
              <input
                value={source[key] || ''}
                onChange={e => onFieldUpdate(key, e.target.value)}
                style={inputStyle}
              />
            </div>
          ))}
        </>
      );
    }
    return (
      <>
        {fields.map(({ key, label }) => source[key] ? (
          <div key={key} style={{ fontSize: 13, color: COLORS.bodyText }}>
            <span style={{ fontWeight: 700 }}>{label}:</span> {source[key]}
          </div>
        ) : null)}
      </>
    );
  };

  const bottomRow = (rightNode) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-end', gap: 12, marginTop: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {rollCallLines(motion, (field, value) => onUpdate(field, value))}
      </div>
      <div style={{ flexShrink: 0 }}>{rightNode}</div>
    </div>
  );

  const dispositionSelect = (value, options, onChange) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '4px 10px', fontSize: 12, fontWeight: 700,
        background: '#fff', border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 6,
        fontFamily: 'inherit', color: COLORS.headingText,
      }}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
    </select>
  );

  const dispositionBox = (value, options, onChange) => (
    isEditing ? dispositionSelect(value, options, onChange) : dispositionPill(value)
  );

  const deleteButton = (isEditing && onDelete) ? (
    <button
      onClick={onDelete}
      aria-label="Delete motion"
      title="Delete motion"
      style={{
        position: 'absolute', top: 6, right: 6,
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        color: COLORS.mutedText, cursor: 'pointer',
        padding: 0, fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = COLORS.dangerRed; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.mutedText; }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  ) : null;

  const resultBlock = bottomRow(
    dispositionBox(motion.result, resultOptions, v => onUpdate('result', v))
  );

  const INTERACTIVE_TAGS = new Set(['input', 'textarea', 'select', 'button', 'option']);
  const isInteractiveTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (INTERACTIVE_TAGS.has(tag)) return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const wrapperDragProps = (isEditing && onReorder) ? {
    draggable: true,
    onDragStart: e => {
      if (isInteractiveTarget(e.target)) { e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', `motion:${motionIndex}`);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: e => {
      if (!e.dataTransfer.types.includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragTarget) setIsDragTarget(true);
    },
    onDragLeave: () => { if (isDragTarget) setIsDragTarget(false); },
    onDrop: e => {
      e.preventDefault();
      setIsDragTarget(false);
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload.startsWith('motion:')) return;
      const from = parseInt(payload.slice('motion:'.length), 10);
      if (!Number.isNaN(from) && from !== motionIndex) onReorder(from, motionIndex);
    },
  } : {};

  const wrapperStyle = {
    marginTop: 10, marginBottom: 6,
    ...(isDragTarget ? {
      outline: '2px solid #3b82f6', outlineOffset: 2, borderRadius: 10,
    } : {}),
  };

  // Single combined "+ Motion…" dropdown — offers "New motion" (sibling) and the
  // nested subsidiary types in one menu.
  const addMotionMenu = (isEditing && (onAddSibling || !hasSubsidiary)) ? (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
      <select
        value=""
        onChange={e => {
          const choice = e.target.value;
          if (!choice) return;
          if (choice === 'sibling') {
            onAddSibling && onAddSibling();
          } else {
            onUpdate('subsidiary', {
              type: choice, text: '', mover: '', seconder: '',
              status: 'carried', inFavor: '', opposed: '', absent: '',
            });
          }
          e.target.value = '';
        }}
        style={{
          padding: '6px 12px', fontSize: 11, fontWeight: 600,
          color: COLORS.secondaryText, background: '#fff',
          border: `1.5px dashed ${COLORS.primaryBorder}`,
          borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <option value="" disabled>+ Motion…</option>
        {onAddSibling && <option value="sibling">New motion</option>}
        {!hasSubsidiary && (
          <optgroup label="Nested motion">
            {SUBSIDIARY_TYPES.map(t => (
              <option key={t.key} value={t.key}>{t.menu}</option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  ) : null;

  // ─── No subsidiary: single flat card (+ "+ Nested motion" dropdown) ───
  if (!hasSubsidiary) {
    return (
      <div style={wrapperStyle} {...wrapperDragProps}>
        <div style={cardBase}>
          {deleteButton}
          {resolutionNumber && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
              {resolutionNumber}
            </div>
          )}
          <div style={sectionLabel}>MOTION:</div>
          {isEditing
            ? textField(motion.text, v => onUpdate('text', v))
            : <div style={bodyText}>{motion.text}</div>}
          {movedSeconded(
            motion.mover, motion.seconder,
            v => onUpdate('mover', v), v => onUpdate('seconder', v),
          )}
          {resultBlock}
        </div>
        {addMotionMenu}
      </div>
    );
  }

  // ─── With subsidiary: three sibling cards ───
  const finalSectionLabel = (subType === 'amend' && subsidiaryCarried) ? 'MOTION (AS AMENDED):' : 'MOTION:';
  const nestedCardLabel = subsidiaryCardLabel(subType);

  return (
    <div style={wrapperStyle} {...wrapperDragProps}>
      {/* Card 1: Main motion */}
      <div style={cardBase}>
        {deleteButton}
        <div style={sectionLabel}>MOTION:</div>
        {isEditing
          ? textField(motion.text, v => onUpdate('text', v))
          : <div style={bodyText}>{motion.text}</div>}
        {movedSeconded(
          motion.mover, motion.seconder,
          v => onUpdate('mover', v), v => onUpdate('seconder', v),
        )}
      </div>

      {/* Card 2: Subsidiary — indented, orange, L-connector */}
      <div style={cardAmend}>
        {/* L-connector */}
        <div style={{
          position: 'absolute', left: -12, top: 20,
          width: 9, height: 9,
          borderLeft: '2px solid #cbd5e1',
          borderBottom: '2px solid #cbd5e1',
        }} />
        {/* ✕ to remove the subsidiary, edit mode */}
        {isEditing && (
          <button
            onClick={() => onUpdate('subsidiary', null)}
            aria-label="Remove nested motion"
            title="Remove nested motion"
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none',
              color: COLORS.mutedText, cursor: 'pointer',
              padding: 0, fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = COLORS.dangerRed; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.mutedText; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {/* Type selector (edit mode) / label (view mode) */}
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ ...sectionLabel, color: '#92400e', marginBottom: 0 }}>{nestedCardLabel}</span>
            <select
              value={subType}
              onChange={e => onUpdate('subsidiary', { ...a, type: e.target.value })}
              style={{
                padding: '2px 6px', fontSize: 11, fontWeight: 600,
                color: COLORS.secondaryText, background: '#fff',
                border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {SUBSIDIARY_TYPES.map(t => (
                <option key={t.key} value={t.key}>{t.menu}</option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ ...sectionLabel, color: '#92400e' }}>{nestedCardLabel}</div>
        )}
        <div style={{
          ...bodyText,
          textDecoration: a.status === 'defeated' ? 'line-through' : 'none',
        }}>
          {isEditing
            ? textField(a.text, v => onUpdate('subsidiary', { ...a, text: v }))
            : (subType === 'amend' ? `THAT the main motion be amended by ${a.text}` : a.text)}
        </div>
        {movedSeconded(
          a.mover, a.seconder,
          v => onUpdate('subsidiary', { ...a, mover: v }),
          v => onUpdate('subsidiary', { ...a, seconder: v }),
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', gap: 12, marginTop: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {rollCallLines(
              a,
              (field, value) => onUpdate('subsidiary', { ...a, [field]: value }),
            )}
          </div>
          <div style={{ flexShrink: 0 }}>
            {dispositionBox(
              (a.status || 'carried').toLowerCase(),
              resultOptions,
              v => onUpdate('subsidiary', { ...a, status: v }),
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Main motion — vote (snaps back to outer indent) */}
      <div style={cardBase}>
        {resolutionNumber && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            {resolutionNumber}
          </div>
        )}
        <div style={{ ...sectionLabel, color: '#166534' }}>{finalSectionLabel}</div>
        <div style={bodyText}>{motion.text}</div>
        {resultBlock}
      </div>
      {addMotionMenu}
    </div>
  );
}

// ─── Sub-Item Card — nested container with optional discussion ─────────────────────────────
function SubItemCard({ sub, sectionIndex, subIndex, isEditing, onUpdateTitle, onUpdateContent, onUpdateNumber, onAddMotion, onReorder, renderMotionsForSub }) {
  const contentHasText = !!(sub.content && sub.content.trim());
  const [opened, setOpened] = useState(false);
  const editRef = useRef(null);
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [numberDraft, setNumberDraft] = useState('');
  const [isDragTarget, setIsDragTarget] = useState(false);
  const [editorHasText, setEditorHasText] = useState(contentHasText);

  const showBox = contentHasText || opened;

  const handleAdd = () => {
    setOpened(true);
    requestAnimationFrame(() => {
      editRef.current?.focus();
    });
  };

  const autoNumber = `${sectionIndex}.${subIndex + 1}`;
  const numberPrefix = sub.manualNumber || autoNumber;

  const beginNumberEdit = () => {
    setNumberDraft(numberPrefix);
    setIsEditingNumber(true);
  };

  const commitNumberEdit = () => {
    setIsEditingNumber(false);
    if (!onUpdateNumber) return;
    const typed = numberDraft.trim();
    // Empty → clear override (back to auto).
    if (!typed) { onUpdateNumber(subIndex, null); return; }
    // Same as auto → clear override so renumbering stays automatic.
    if (typed === autoNumber) { onUpdateNumber(subIndex, null); return; }
    onUpdateNumber(subIndex, typed);
  };

  const INTERACTIVE_TAGS = new Set(['input', 'textarea', 'select', 'button', 'option']);
  const isInteractiveTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (INTERACTIVE_TAGS.has(tag)) return true;
    if (el.isContentEditable) return true;
    return false;
  };

  const subDragProps = (isEditing && onReorder) ? {
    draggable: true,
    onDragStart: e => {
      if (isInteractiveTarget(e.target)) { e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', `sub:${subIndex}`);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: e => {
      if (!e.dataTransfer.types.includes('text/plain')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragTarget) setIsDragTarget(true);
    },
    onDragLeave: () => { if (isDragTarget) setIsDragTarget(false); },
    onDrop: e => {
      e.preventDefault();
      setIsDragTarget(false);
      const payload = e.dataTransfer.getData('text/plain');
      if (!payload.startsWith('sub:')) return;
      const from = parseInt(payload.slice('sub:'.length), 10);
      if (!Number.isNaN(from) && from !== subIndex) onReorder(from, subIndex);
    },
  } : {};

  return (
    <div
      {...subDragProps}
      style={{
        marginTop: 14,
        background: isDragTarget ? '#eff6ff' : '#fafbfc',
        border: `1px solid ${isDragTarget ? '#3b82f6' : COLORS.cardBorder}`,
        borderLeft: `3px solid ${COLORS.primary}`,
        borderRadius: 10,
        padding: 14,
        transition: 'background .1s, border-color .1s',
      }}>
      {/* Sub-item title — editable in edit mode */}
      {isEditing ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        }}>
          {isEditingNumber ? (
            <input
              type="text"
              autoFocus
              value={numberDraft}
              onChange={e => setNumberDraft(e.target.value)}
              onBlur={commitNumberEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setIsEditingNumber(false); e.currentTarget.blur(); }
              }}
              style={{
                width: 56, padding: '3px 6px',
                fontSize: 13, fontWeight: 700, color: COLORS.headingText,
                background: '#fff',
                border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 4,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={beginNumberEdit}
              title="Click to renumber"
              style={{
                fontSize: 13, fontWeight: 700, color: COLORS.headingText, flexShrink: 0,
                cursor: 'pointer',
                padding: '3px 6px', borderRadius: 4, userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {numberPrefix}
            </span>
          )}
          <input
            type="text"
            value={sub.title || ''}
            onChange={e => onUpdateTitle(subIndex, e.target.value)}
            placeholder="Sub-item title..."
            style={{
              flex: 1, padding: '5px 8px',
              fontSize: 13, fontWeight: 700, color: COLORS.headingText,
              background: '#fff',
              border: `1px solid ${COLORS.primaryBorder}`, borderRadius: 6,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      ) : (
        <div style={{
          fontSize: 13, fontWeight: 700, color: COLORS.headingText,
          marginBottom: 10,
        }}>
          {numberPrefix} {sub.title}
        </div>
      )}

      {/* Discussion box — editable when in edit mode, read-only when viewing.
          Shows "+ Add Discussion" in edit mode when no discussion yet. */}
      {isEditing ? (
        showBox ? (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div
              ref={editRef}
              contentEditable
              suppressContentEditableWarning
              onInput={e => setEditorHasText(!!e.currentTarget.textContent.trim())}
              onBlur={e => onUpdateContent(subIndex, e.currentTarget.textContent)}
              dangerouslySetInnerHTML={{ __html: sub.content || '' }}
              style={{
                fontSize: 12.5, color: COLORS.bodyText, lineHeight: 1.7,
                fontStyle: 'italic', outline: 'none',
                padding: 10, paddingBottom: 28, borderRadius: 6,
                border: `1px dashed ${COLORS.primaryBorder}`,
                background: '#fff',
                minHeight: 36,
              }}
            />
            {editorHasText && (
              <SummarizeButton
                editRef={editRef}
                onReplace={(t) => onUpdateContent(subIndex, t)}
              />
            )}
          </div>
        ) : (
          <button
            onClick={handleAdd}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', marginBottom: 10,
              fontSize: 11, fontWeight: 600,
              color: COLORS.secondaryText, background: '#fff',
              border: `1.5px dashed ${COLORS.primaryBorder}`,
              borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Discussion
          </button>
        )
      ) : (
        contentHasText && (
          <div style={{
            fontSize: 12.5, color: COLORS.bodyText, lineHeight: 1.7,
            fontStyle: 'italic',
            padding: 10, borderRadius: 6,
            border: `1px solid ${COLORS.subtleBorder}`,
            background: '#fff',
            marginBottom: 10,
          }}>
            {sub.content}
          </div>
        )
      )}

      {/* Sub-item motions */}
      {renderMotionsForSub(subIndex)}

      {/* + Motion button — only shown when this sub-item has NO motions yet;
          once any motion exists, each motion's own "+ Motion…" dropdown takes over. */}
      {isEditing && onAddMotion && (sub.motions || []).length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={() => onAddMotion(subIndex)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px',
              fontSize: 11, fontWeight: 600,
              color: COLORS.secondaryText, background: '#fff',
              border: `1.5px dashed ${COLORS.primaryBorder}`,
              borderRadius: 6, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Motion
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Minutes Section ─────────────────────────────
function MinutesSection({ section, sectionIndex, isEditing, onUpdateContent, onUpdateMotion, onRemoveMotion, onReorderMotion, onUpdateSubItem, onRemoveSubItemMotion, onReorderSubItemMotion, onUpdateSubItemContent, onUpdateSubItemTitle, onUpdateSubItemNumber, onAddSubItemMotion, onReorderSubItem, resolutionMap }) {
  const [isOpen, setIsOpen] = useState(true);
  const sectionEditRef = useRef(null);
  const [sectionEditorHasText, setSectionEditorHasText] = useState(false);

  const numberedTitle = sectionIndex != null
    ? `${sectionIndex}. ${(section.title || '').toUpperCase()}`
    : (section.title || '').toUpperCase();

  // Count all motions (direct + in sub-items)
  const totalMotions = (section.motions?.length || 0)
    + (section.subItems || []).reduce((sum, si) => sum + (si.motions?.length || 0), 0);

  // Render a list of motions (used for both direct motions and sub-item motions)
  const renderMotions = (motions, onUpdate, onDelete, onReorder, onAddSibling, keyPrefix) =>
    motions.map((motion, mi) => (
      <MotionCard
        key={`${keyPrefix}-${motion.id}`}
        motion={motion}
        motionIndex={mi}
        isEditing={isEditing}
        onUpdate={(field, value) => onUpdate(mi, field, value)}
        onDelete={onDelete ? () => onDelete(mi) : undefined}
        onReorder={onReorder}
        onAddSibling={onAddSibling}
        resolutionNumber={resolutionMap?.[motion.id]}
      />
    ));

  const hasContent = section.content && stripHtml(section.content).trim();

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      {/* Section header */}
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
          {numberedTitle}
        </span>
        {totalMotions > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: CATEGORY_COLORS.motion.color,
            background: CATEGORY_COLORS.motion.light, border: `1px solid ${CATEGORY_COLORS.motion.border}`,
            borderRadius: 999, padding: '2px 8px',
          }}>
            {totalMotions} motion{totalMotions > 1 ? 's' : ''}
          </span>
        )}
        <svg width="12" height="12" fill="none" stroke={COLORS.mutedText} strokeWidth="2" viewBox="0 0 24 24"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body — everything nested inside the single outer white card */}
      {isOpen && (
        <div style={{ padding: '16px 20px' }}>
          {/* Section-level discussion text */}
          {hasContent && (
            isEditing ? (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div
                  ref={sectionEditRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={e => setSectionEditorHasText(!!e.currentTarget.textContent.trim())}
                  onBlur={e => onUpdateContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                  style={{
                    fontSize: 13, color: COLORS.bodyText, lineHeight: 1.8, outline: 'none',
                    minHeight: 30, padding: 10, paddingBottom: 28, borderRadius: 6,
                    border: `1px dashed ${COLORS.primaryBorder}`, background: '#fafbfc',
                  }}
                />
                {(sectionEditorHasText || !!stripHtml(section.content).trim()) && (
                  <SummarizeButton
                    editRef={sectionEditRef}
                    onReplace={(t) => onUpdateContent(t)}
                  />
                )}
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: section.content }}
                style={{ fontSize: 13, color: COLORS.bodyText, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 12 }}
              />
            )
          )}
          {/* Direct motions (no sub-item, e.g. "3. ADOPTION OF AGENDA" → MOTION:) */}
          {renderMotions(
            section.motions || [],
            (mi, field, value) => onUpdateMotion(mi, field, value),
            onRemoveMotion ? (mi) => onRemoveMotion(mi) : undefined,
            onReorderMotion,
            undefined,
            'direct'
          )}

          {/* Sub-items — nested container: each sub-item is a bordered card
              containing its title, optional discussion box, and motions */}
          {(section.subItems || []).map((sub, si) => (
            <SubItemCard
              key={sub.id}
              sub={sub}
              sectionIndex={sectionIndex}
              subIndex={si}
              isEditing={isEditing}
              onUpdateTitle={onUpdateSubItemTitle}
              onUpdateContent={onUpdateSubItemContent}
              onUpdateNumber={onUpdateSubItemNumber}
              onAddMotion={onAddSubItemMotion}
              onReorder={onReorderSubItem}
              renderMotionsForSub={(subIndex) =>
                renderMotions(
                  sub.motions || [],
                  (mi, field, value) => onUpdateSubItem(subIndex, mi, field, value),
                  onRemoveSubItemMotion ? (mi) => onRemoveSubItemMotion(subIndex, mi) : undefined,
                  onReorderSubItemMotion ? (from, to) => onReorderSubItemMotion(subIndex, from, to) : undefined,
                  onAddSubItemMotion ? () => onAddSubItemMotion(subIndex) : undefined,
                  `sub-${subIndex}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sign-Off Block — PC Minutes Standard ─────────────────────────────
function ApprovalSignOff({ approval, isEditing, onUpdate, metadata }) {
  const isApproved = !!approval.approvedAt;

  // Format date for footer
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const meetingDate = formatDate(metadata?.date);
  const municipality = metadata?.municipality || 'Village of Pouce Coupe';

  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 10px',
        background: isApproved ? '#f0fdf4' : '#fafbfc',
        borderBottom: `1px solid ${isApproved ? '#dcfce7' : COLORS.subtleBorder}`,
        display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: `4px solid ${isApproved ? '#22c55e' : COLORS.primary}`,
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: isApproved ? '#16a34a' : COLORS.headingText }}>
          Sign-Off
        </span>
        {isApproved && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#22c55e',
            background: '#dcfce7', borderRadius: 999, padding: '2px 8px', marginLeft: 'auto',
          }}>
            Approved {new Date(approval.approvedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Signature lines */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '60%', marginBottom: 4, paddingTop: 30 }} />
          {isEditing && !isApproved ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Chairperson,</span>
              <input
                value={approval.chairperson || ''}
                onChange={e => onUpdate('chairperson', e.target.value)}
                placeholder="e.g. Mayor Danielle Veach"
                style={{
                  flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 600,
                  color: COLORS.headingText, background: '#f8fafc',
                  border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 4,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.bodyText }}>
              Chairperson, {approval.chairperson || '—'}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ borderBottom: '1px solid #cbd5e1', width: '60%', marginBottom: 4, paddingTop: 30 }} />
          {isEditing && !isApproved ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Chief Administrative & Corporate Officer,</span>
              <input
                value={approval.officer || ''}
                onChange={e => onUpdate('officer', e.target.value)}
                placeholder="e.g. Duncan Malkinson"
                style={{
                  flex: 1, padding: '4px 8px', fontSize: 13, fontWeight: 600,
                  color: COLORS.headingText, background: '#f8fafc',
                  border: `1.5px solid ${COLORS.primaryBorder}`, borderRadius: 4,
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.bodyText }}>
              Chief Administrative & Corporate Officer, {approval.officer || '—'}
            </div>
          )}
        </div>

        {/* Certified true copy footer */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: `1px solid ${COLORS.subtleBorder}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b', lineHeight: 1.6 }}>
            Certified True Copy of the {metadata?.meetingType || 'Regular Meeting'} of Council Minutes — {meetingDate}
          </div>
          <div style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b' }}>
            {metadata?.location || 'Council Chambers'}, {municipality.replace(/^(Village of |Town of |City of |District of )/i, '')}, BC
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCX Export — Exact PC Minutes Standard ─────────────────────────────
async function exportToDocx(data, approval) {
  const staffRoles = ['Staff', 'CAO', 'Clerk'];
  const FONT = 'Calibri';
  const SZ = 22;                          // 11pt body (half-points)
  const SZ_TITLE = 28;                    // 14pt title
  const SZ_FOOTER = 20;                   // 10pt footer
  const INDENT_1 = convertInchesToTwip(0.5);   // Motion indent under section

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const meetingType = (data.metadata.meetingType || 'Regular Meeting')
    .replace(/meeting/i, '').trim().toUpperCase();

  const meetingDate = formatDate(data.metadata.date);
  const children = [];

  // Helper: add paragraph with Calibri font
  const addPara = (text, opts = {}) => {
    const runs = typeof text === 'string'
      ? [new TextRun({ text, font: FONT, size: opts.sz || SZ, bold: !!opts.bold, italics: !!opts.italics })]
      : text;
    children.push(new Paragraph({
      children: runs,
      alignment: opts.align,
      indent: opts.indent != null ? { left: opts.indent } : undefined,
      spacing: opts.spacing,
    }));
  };

  // Helper: bold label + normal value on one line
  const addLabelValue = (label, value, indent) => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: label, font: FONT, size: SZ, bold: true }),
        new TextRun({ text: value || '', font: FONT, size: SZ }),
      ],
      indent: indent != null ? { left: indent } : undefined,
    }));
  };

  // ── Logo ──
  try {
    const logoResp = await fetch('/pouce-coupe-logo.jpg');
    const logoBlob = await logoResp.blob();
    const logoBuf = await logoBlob.arrayBuffer();
    children.push(new Paragraph({
      children: [new ImageRun({ data: logoBuf, transformation: { width: 120, height: 109 }, type: 'jpg' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  } catch { /* skip logo if unavailable */ }

  // In DOCX, spacing is in twentieths of a point (twips). 240 twips = one line (~12pt).
  const LINE = 240;  // one blank line equivalent

  // ── Centered header — no gaps between title/date/time, one blank line after ──
  addPara(`${meetingType} COUNCIL MEETING MINUTES`, { sz: SZ_TITLE, bold: true, align: AlignmentType.CENTER });
  addPara(meetingDate, { align: AlignmentType.CENTER });
  addPara(`${data.metadata.time || ''} - ${data.metadata.location || 'Council Chambers'}`, { align: AlignmentType.CENTER, spacing: { after: LINE } });

  // ── Roll Call — no extra spacing between groups ──
  const present = data.rollCall.filter(a => a.present && !staffRoles.includes(a.role));
  const absent = data.rollCall.filter(a => !a.present && !staffRoles.includes(a.role));
  const staff = data.rollCall.filter(a => staffRoles.includes(a.role));

  addPara('Present:', { bold: true });
  present.forEach(a => addPara(a.name));
  addPara('Absent:', { bold: true });
  if (absent.length > 0) absent.forEach(a => addPara(a.name));
  addPara('Staff:', { bold: true });
  staff.forEach(a => addPara(a.name));
  // One blank line before first section
  addPara('', { spacing: { after: LINE } });

  // Helper: render a motion block at a given indent
  const renderMotionDocx = (m, indent) => {
    addPara('MOTION:', { bold: true, indent });
    addPara(m.text, { indent });
    addLabelValue('MOVED BY: ', m.mover, indent);
    addLabelValue('SECONDED BY: ', m.seconder, indent);

    const sub = m.subsidiary;
    const resultText = (sub?.type === 'amend' && sub?.status === 'carried')
      ? `${(m.result || 'CARRIED').toUpperCase()} (AS AMENDED)`
      : (m.result || 'CARRIED').toUpperCase();
    addPara(resultText, { bold: true, indent });

    if (m.opposed) addLabelValue('OPPOSED: ', m.opposed, indent);

    if (sub) {
      const aStatus = (sub.status || sub.result || '').toUpperCase();
      const label = (SUBSIDIARY_TYPES.find(t => t.key === sub.type)?.cardLabel || 'SUBSIDIARY MOTION:');
      addPara(label, { bold: true, indent });
      addPara(sub.type === 'amend' ? `THAT the main motion be amended by ${sub.text}` : sub.text, { indent });
      addLabelValue('MOVED BY: ', sub.mover, indent);
      addLabelValue('SECONDED BY: ', sub.seconder, indent);
      addPara(aStatus, { bold: true, indent });
    }
  };

  // ── Sections ──
  data.sections.forEach((section, idx) => {
    const sectionNum = idx + 1;
    const sectionTitle = `${sectionNum}. ${(section.title || '').toUpperCase()}`;

    // Section heading
    addPara(sectionTitle, { bold: true });

    // Section-level discussion text (italicized, indented)
    const text = stripHtml(section.content);
    if (text && text.trim()) {
      addPara(text.trim(), { indent: INDENT_1, italics: true });
    }

    // Direct motions (no sub-item, e.g. "3. ADOPTION OF AGENDA" → MOTION:)
    (section.motions || []).forEach(m => {
      renderMotionDocx(m, INDENT_1);
    });

    // Sub-items (e.g. "4.1 November 12, 2025 Special Council Meeting Minutes")
    (section.subItems || []).forEach((sub, si) => {
      // Sub-item heading (indented)
      addPara(`${sectionNum}.${si + 1} ${sub.title}`, { indent: INDENT_1 });

      // Sub-item discussion text (italicized, further indented)
      if (sub.content && sub.content.trim()) {
        addPara(sub.content.trim(), { indent: INDENT_1 * 2, italics: true });
      }

      // Sub-item motions (further indented)
      (sub.motions || []).forEach(m => {
        renderMotionDocx(m, INDENT_1 * 2);
      });
    });

    // One blank line after section
    addPara('');
  });

  // ── Sign-off — blank space before signatures ──
  addPara('');
  addPara(`Chairperson, ${approval?.chairperson || ''}`, { spacing: { before: LINE * 2 } });
  addPara('');
  addPara(`Chief Administrative & Corporate Officer, ${approval?.officer || ''}`, { spacing: { before: LINE * 2 } });

  // ── Certified True Copy footer ──
  const municipality = data.metadata.municipality || 'Village of Pouce Coupe';
  const location = data.metadata.location || 'Council Chambers';
  const shortMuni = municipality.replace(/^(Village of |Town of |City of |District of )/i, '');

  addPara('');
  addPara(
    `Certified True Copy of the ${data.metadata.meetingType || 'Regular Meeting'} of Council Minutes \u2014 ${meetingDate}`,
    { sz: SZ_FOOTER, italics: true, align: AlignmentType.CENTER }
  );
  addPara(
    `${location}, ${shortMuni}, BC`,
    { sz: SZ_FOOTER, italics: true, align: AlignmentType.CENTER }
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: SZ } } } },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const meetingTypeShort = (data.metadata.meetingType || 'RCM').split(' ').map(w => w[0]).join('');
  const filename = `${meetingTypeShort} Minutes - ${meetingDate || data.metadata.date || 'draft'}.docx`;
  saveAs(blob, filename);
}

// ─── Main Workspace ─────────────────────────────
export default function TranscriptMinutesWorkspace({ session, bgTheme, bgThemes, onBgThemeChange }) {
  const [data, setData] = useState(session.transcriptMinutesData);
  const [isEditing, setIsEditing] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [resolutionMode, setResolutionMode] = useState('manual'); // 'manual' | 'continue' | 'none'
  const [resolutionPrefix, setResolutionPrefix] = useState('2026-01');
  const [lastMeetingEndNum, setLastMeetingEndNum] = useState('2026-42'); // simulated last meeting's last resolution

  // Build a global resolution number map for all motions across sections
  const resolutionMap = {};
  let resCount = 0;

  // Determine effective starting resolution
  const effectivePrefix = resolutionMode === 'continue'
    ? (() => {
        const parts = lastMeetingEndNum.split('-');
        const prefix = parts.slice(0, -1).join('-');
        const lastNum = parseInt(parts[parts.length - 1], 10) || 0;
        return `${prefix}-${String(lastNum + 1).padStart(2, '0')}`;
      })()
    : resolutionPrefix;

  const assignResNum = (motion) => {
    resCount++;
    if (resolutionMode !== 'none') {
      const parts = effectivePrefix.split('-');
      const prefix = parts.slice(0, -1).join('-');
      const startNum = parseInt(parts[parts.length - 1], 10) || 1;
      const num = String(startNum + resCount - 1).padStart(2, '0');
      resolutionMap[motion.id] = `${prefix}-${num}`;
    }
  };
  (data?.sections || []).forEach(section => {
    (section.motions || []).forEach(assignResNum);
    (section.subItems || []).forEach(sub => {
      (sub.motions || []).forEach(assignResNum);
    });
  });

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

  const updateSubItemTitle = useCallback((sectionId, subIndex, title) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) =>
            si === subIndex ? { ...sub, title } : sub
          ),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const updateSubItemContent = useCallback((sectionId, subIndex, content) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) =>
            si === subIndex ? { ...sub, content } : sub
          ),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const updateSubItemMotion = useCallback((sectionId, subIndex, motionIndex, field, value) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) => {
            if (si !== subIndex) return sub;
            return {
              ...sub,
              motions: sub.motions.map((m, mi) => mi === motionIndex ? { ...m, [field]: value } : m),
            };
          }),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const reorderMotion = useCallback((sectionId, fromIndex, toIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        const items = [...(s.motions || [])];
        if (fromIndex < 0 || fromIndex >= items.length) return s;
        const [moved] = items.splice(fromIndex, 1);
        const target = Math.max(0, Math.min(items.length, toIndex));
        items.splice(target, 0, moved);
        return { ...s, motions: items };
      }),
    }));
    setIsDirty(true);
  }, []);

  const reorderSubItemMotion = useCallback((sectionId, subIndex, fromIndex, toIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) => {
            if (si !== subIndex) return sub;
            const items = [...(sub.motions || [])];
            if (fromIndex < 0 || fromIndex >= items.length) return sub;
            const [moved] = items.splice(fromIndex, 1);
            const target = Math.max(0, Math.min(items.length, toIndex));
            items.splice(target, 0, moved);
            return { ...sub, motions: items };
          }),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const updateSubItemNumber = useCallback((sectionId, subIndex, manualNumber) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) =>
            si === subIndex ? { ...sub, manualNumber: manualNumber || null } : sub
          ),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const reorderSubItem = useCallback((sectionId, fromIndex, toIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        const items = [...(s.subItems || [])];
        if (fromIndex < 0 || fromIndex >= items.length) return s;
        const [moved] = items.splice(fromIndex, 1);
        const target = Math.max(0, Math.min(items.length, toIndex));
        items.splice(target, 0, moved);
        return { ...s, subItems: items };
      }),
    }));
    setIsDirty(true);
  }, []);

  const removeMotion = useCallback((sectionId, motionIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, motions: (s.motions || []).filter((_, i) => i !== motionIndex) };
      }),
    }));
    setIsDirty(true);
  }, []);

  const removeSubItemMotion = useCallback((sectionId, subIndex, motionIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) => {
            if (si !== subIndex) return sub;
            return { ...sub, motions: (sub.motions || []).filter((_, i) => i !== motionIndex) };
          }),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const addSubItemMotion = useCallback((sectionId, subIndex) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subItems: (s.subItems || []).map((sub, si) => {
            if (si !== subIndex) return sub;
            const newMotion = {
              id: `motion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              text: '',
              mover: '',
              seconder: '',
              result: 'carried unanimously',
              subsidiary: null,
            };
            return { ...sub, motions: [...(sub.motions || []), newMotion] };
          }),
        };
      }),
    }));
    setIsDirty(true);
  }, []);

  const [approval, setApproval] = useState({
    chairperson: data?.metadata?.chair || 'Mayor Danielle Veach',
    officer: 'Duncan Malkinson',
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
  const [showSettings, setShowSettings] = useState(false);

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
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 20px 60px',
          ...(bgTheme?.bg?.includes?.('gradient')
            ? { backgroundImage: bgTheme.bg }
            : { background: bgTheme?.bg || '#ffffff' }),
          transition: 'background 0.3s ease',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <MetadataHeader metadata={data.metadata} isEditing={isEditing} onUpdate={updateMetadata} />

            {/* Resolution numbering */}
            <div style={{ ...cardStyle, padding: '14px 24px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#475569', marginBottom: 10 }}>
                Resolution Numbering
              </div>

              {/* Three options */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[
                  { id: 'manual', label: 'Start At' },
                  { id: 'continue', label: 'Continue From Last Meeting' },
                  { id: 'none', label: 'No Resolution Numbers' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setResolutionMode(opt.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${resolutionMode === opt.id ? '#475569' : '#e2e8f0'}`,
                      background: resolutionMode === opt.id ? '#f1f5f9' : '#fff',
                      color: resolutionMode === opt.id ? '#0f172a' : '#64748b',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 4,
                      border: `1.5px solid ${resolutionMode === opt.id ? '#475569' : '#cbd5e1'}`,
                      background: resolutionMode === opt.id ? '#475569' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {resolutionMode === opt.id && (
                        <svg width="8" height="8" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Manual input */}
              {resolutionMode === 'manual' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    value={resolutionPrefix}
                    onChange={e => setResolutionPrefix(e.target.value)}
                    style={{
                      width: 120, padding: '5px 10px', fontSize: 13, fontWeight: 700,
                      color: '#0f172a', background: '#f8fafc',
                      border: '1.5px solid #cbd5e1', borderRadius: 6,
                      fontFamily: 'inherit', textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    {resCount} resolution{resCount !== 1 ? 's' : ''}: {resolutionPrefix} through {(() => {
                      const parts = resolutionPrefix.split('-');
                      const prefix = parts.slice(0, -1).join('-');
                      const startNum = parseInt(parts[parts.length - 1], 10) || 1;
                      return `${prefix}-${String(startNum + resCount - 1).padStart(2, '0')}`;
                    })()}
                  </span>
                </div>
              )}

              {/* Continue from last meeting */}
              {resolutionMode === 'continue' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Last meeting ended at</span>
                  <input
                    value={lastMeetingEndNum}
                    onChange={e => setLastMeetingEndNum(e.target.value)}
                    style={{
                      width: 100, padding: '5px 10px', fontSize: 12, fontWeight: 700,
                      color: '#0f172a', background: '#f8fafc',
                      border: '1.5px solid #cbd5e1', borderRadius: 6,
                      fontFamily: 'inherit', textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    → starting at {effectivePrefix}, {resCount} resolution{resCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* No resolution numbers */}
              {resolutionMode === 'none' && (
                <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>
                  Resolution numbers will not be assigned to motions.
                </span>
              )}
            </div>

            <RollCallSection
              rollCall={data.rollCall}
              isEditing={isEditing}
              onUpdate={updateRollCall}
              onAdd={addAttendee}
              onRemove={removeAttendee}
            />
            {data.sections.map((section, idx) => (
              <MinutesSection
                key={section.id}
                section={section}
                sectionIndex={idx + 1}
                isEditing={isEditing}
                onUpdateContent={html => updateSectionContent(section.id, html)}
                onUpdateMotion={(mi, field, value) => updateMotion(section.id, mi, field, value)}
                onUpdateSubItem={(si, mi, field, value) => updateSubItemMotion(section.id, si, mi, field, value)}
                onRemoveSubItemMotion={(si, mi) => removeSubItemMotion(section.id, si, mi)}
                onReorderSubItemMotion={(si, from, to) => reorderSubItemMotion(section.id, si, from, to)}
                onUpdateSubItemContent={(si, content) => updateSubItemContent(section.id, si, content)}
                onUpdateSubItemTitle={(si, title) => updateSubItemTitle(section.id, si, title)}
                onUpdateSubItemNumber={(si, num) => updateSubItemNumber(section.id, si, num)}
                onAddSubItemMotion={si => addSubItemMotion(section.id, si)}
                onRemoveMotion={mi => removeMotion(section.id, mi)}
                onReorderMotion={(from, to) => reorderMotion(section.id, from, to)}
                onReorderSubItem={(from, to) => reorderSubItem(section.id, from, to)}
                resolutionMap={resolutionMap}
              />
            ))}

            {/* Sign-off block — PC Minutes standard */}
            <ApprovalSignOff
              approval={approval}
              isEditing={isEditing}
              onUpdate={updateApproval}
              metadata={data.metadata}
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
        {/* Gear — settings with color picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: showSettings ? '#f1f5f9' : 'transparent',
              border: showSettings ? '1.5px solid #cbd5e1' : '1.5px solid transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!showSettings) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!showSettings) e.currentTarget.style.background = showSettings ? '#f1f5f9' : 'transparent'; }}
          >
            <svg width="24" height="24" fill="none" stroke="#475569" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {showSettings && (
            <div style={{
              position: 'absolute', top: 0, right: 52,
              background: '#fff', borderRadius: 10, padding: '12px 14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
              width: 200, zIndex: 300,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#94a3b8',
                letterSpacing: '1px', textTransform: 'uppercase',
                display: 'block', marginBottom: 8,
              }}>
                Theme
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(bgThemes || []).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onBgThemeChange?.(t)}
                    title={t.label}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: t.bg?.includes?.('gradient') ? t.bg : t.dot,
                      border: bgTheme?.id === t.id ? '2.5px solid #0f172a' : '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, border 0.15s',
                      transform: bgTheme?.id === t.id ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              {bgTheme && (
                <span style={{ fontSize: 8.5, color: '#94a3b8', display: 'block', marginTop: 6 }}>
                  {bgTheme.label}
                </span>
              )}
            </div>
          )}
        </div>

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
                  <button onClick={() => { approveMinutes(); setShowApprovalPanel(false); }} disabled={!approval.chairperson?.trim()} style={{
                    width: '100%', padding: '8px', marginBottom: 8,
                    background: approval.chairperson?.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e2e8f0',
                    border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    color: approval.chairperson?.trim() ? '#fff' : '#94a3b8', cursor: approval.chairperson?.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve Now
                  </button>
                  {!approval.chairperson?.trim() && (
                    <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginBottom: 8 }}>
                      Fill in the sign-off names at the bottom first
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
