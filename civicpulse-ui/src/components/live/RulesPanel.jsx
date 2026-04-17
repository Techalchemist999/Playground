import { Fragment } from 'react';

// Matrix of procedure topics × three sources of authority.
// Column order (per design-rules-sources-vibes #14): Bylaw · Robert's · Precedent.
const RULES_MATRIX = [
  {
    topic: 'Second required',
    bylaw:    { text: 'Adopted verbatim — all motions need a seconder.', ref: 's.11' },
    roberts:  { text: 'Required before debate for nearly all motions.',  ref: '§14' },
    precedent:{ text: 'Enforced consistently; no unseconded motion has reached debate.', ref: 'all years' },
  },
  {
    topic: 'Amendment relevance',
    bylaw:    { text: '—', ref: 'silent' },
    roberts:  { text: 'Must be germane to the subject of the main motion.', ref: '§12' },
    precedent:{ text: 'Wholesale substitution ruled not an amendment.',     ref: '2024-09-10' },
  },
  {
    topic: 'One amend. to an amend.',
    bylaw:    { text: 'Only one amendment to an amendment at a time.', ref: 's.11' },
    roberts:  { text: 'Same rule — third-order amendments out of order.', ref: '§12' },
    precedent:{ text: 'Chair has let 2nd-level stand for brevity once.',  ref: '2023-06-12' },
  },
  {
    topic: 'Friendly amendment',
    bylaw:    { text: 'Not recognised — formal vote required.', ref: 's.11' },
    roberts:  { text: 'Disfavoured in formal practice.',         ref: '§12' },
    precedent:{ text: 'Accepted informally by mover consent.',   ref: '2022-04-08, 2024-03-11' },
  },
  {
    topic: 'Voting method',
    bylaw:    { text: 'Show of hands default; recorded for bylaws.', ref: 's.12' },
    roberts:  { text: 'Voice, show of hands, rising, roll call, ballot.', ref: '§45' },
    precedent:{ text: 'Recorded votes used for contested bylaws.', ref: 'practice' },
  },
  {
    topic: 'Quorum',
    bylaw:    { text: 'Majority of Council members — no business without it.', ref: 's.9' },
    roberts:  { text: 'Quorum is majority unless bylaw provides otherwise.', ref: '§3' },
    precedent:{ text: 'Meeting recessed twice for loss of quorum.', ref: '2023-02, 2024-11' },
  },
  {
    topic: 'Point of Order',
    bylaw:    { text: 'Takes precedence; Chair rules immediately.', ref: 's.9' },
    roberts:  { text: 'Must be raised at the time of the breach.',  ref: '§23' },
    precedent:{ text: 'Appealed once; Chair ruling upheld 4-1.',    ref: '2023-10-09' },
  },
  {
    topic: 'Bylaw readings',
    bylaw:    { text: 'Three readings required; not adopted same meeting as 3rd unless unanimous.', ref: 's.13' },
    roberts:  { text: 'Leaves bylaw process to organization.', ref: 'silent' },
    precedent:{ text: 'Same-meeting adoption used on 2024-06-10 (unanimous).', ref: '2024-06-10' },
  },
  {
    topic: 'Reconsideration',
    bylaw:    { text: 'Mover must be on prevailing side.', ref: 's.11' },
    roberts:  { text: 'Same-session rule; prevailing side only.', ref: '§37' },
    precedent:{ text: 'Used twice in 2024 — once successful, once failed.', ref: '2024' },
  },
  {
    topic: 'Late items',
    bylaw:    { text: 'Unanimous consent of members present required.', ref: 's.10' },
    roberts:  { text: 'Special orders / suspension of rules (2/3).',  ref: '§41' },
    precedent:{ text: 'Chair routinely asks "any late items?" at agenda adoption.', ref: 'practice' },
  },
  {
    topic: 'Adjournment time',
    bylaw:    { text: 'Adjourn at 9:00 PM unless Council resolves to extend.', ref: 's.5' },
    roberts:  { text: 'Motion to adjourn always in order.', ref: '§21' },
    precedent:{ text: 'Extended past 9 PM 3× in 2024.', ref: '2024' },
  },
  {
    topic: 'In-camera session',
    bylaw:    { text: 'Cite s.90(1) Community Charter; no resolutions or bylaws at closed meeting.', ref: 's.15' },
    roberts:  { text: 'Executive session rules; minutes kept separately.', ref: '§9' },
    precedent:{ text: 'Rise-and-report format used for personnel matters.', ref: 'practice' },
  },
];

const SRC_STYLE = {
  bylaw:    { bg: '#dbeafe', text: '#1e3a8a', border: '#1e40af', refColor: '#3b82f6' },
  roberts:  { bg: '#fef3c7', text: '#78350f', border: '#b45309', refColor: '#d97706' },
  precedent:{ bg: '#d1fae5', text: '#064e3b', border: '#065f46', refColor: '#10b981' },
};

function MatrixCell({ source, cell }) {
  const s = SRC_STYLE[source];
  const isSilent = cell.text === '—';
  return (
    <div style={{
      padding: '8px 10px',
      background: '#fff',
      borderTop: `2px solid ${s.border}22`,
      minHeight: 0,
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{
        fontSize: 10, color: isSilent ? '#94a3b8' : '#1e293b',
        lineHeight: 1.4, fontStyle: isSilent ? 'italic' : 'normal',
      }}>
        {cell.text}
      </div>
      <div style={{
        fontSize: 8, fontWeight: 800, letterSpacing: .5,
        color: s.refColor, textTransform: 'uppercase',
        marginTop: 'auto',
      }}>
        {cell.ref}
      </div>
    </div>
  );
}

export default function RulesPanel({ topics, transcript }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{
        padding: '8px 12px 6px', flexShrink: 0, borderBottom: '1px solid #e2e8f0',
        background: '#fafbfc',
      }}>
        <div style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
          color: '#64748b', marginBottom: 2,
        }}>
          Procedure · Source Matrix
        </div>
        <div style={{ fontSize: 9.5, color: '#94a3b8' }}>
          What each source says on the same topic
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(108px, 0.9fr) 1fr 1fr 1fr',
          gap: 1,
          background: '#e2e8f0',
          minWidth: 520,
        }}>
          <div style={{
            position: 'sticky', top: 0, zIndex: 3,
            background: '#0f172a', color: '#fff',
            padding: '7px 10px',
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
          }}>Topic</div>
          <div style={{
            position: 'sticky', top: 0, zIndex: 3,
            background: SRC_STYLE.bylaw.bg, color: SRC_STYLE.bylaw.text,
            padding: '7px 10px',
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
            textAlign: 'center', borderTop: `3px solid ${SRC_STYLE.bylaw.border}`,
          }}>Bylaw</div>
          <div style={{
            position: 'sticky', top: 0, zIndex: 3,
            background: SRC_STYLE.roberts.bg, color: SRC_STYLE.roberts.text,
            padding: '7px 10px',
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
            textAlign: 'center', borderTop: `3px solid ${SRC_STYLE.roberts.border}`,
          }}>Robert's</div>
          <div style={{
            position: 'sticky', top: 0, zIndex: 3,
            background: SRC_STYLE.precedent.bg, color: SRC_STYLE.precedent.text,
            padding: '7px 10px',
            fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
            textAlign: 'center', borderTop: `3px solid ${SRC_STYLE.precedent.border}`,
          }}>Precedent</div>

          {RULES_MATRIX.map((row, ri) => (
            <Fragment key={ri}>
              <div style={{
                background: '#fff', padding: '8px 10px',
                fontSize: 10.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3,
                display: 'flex', alignItems: 'center',
              }}>
                {row.topic}
              </div>
              <MatrixCell source="bylaw"     cell={row.bylaw} />
              <MatrixCell source="roberts"   cell={row.roberts} />
              <MatrixCell source="precedent" cell={row.precedent} />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
