import { useState } from 'react';
import { COLORS } from '../../styles/tokens';
import ProcedureRules from './ProcedureRules';
import RuleAlert from './RuleAlert';

const ROBERTS_RULES = [
  {
    category: 'Main Motions',
    items: [
      { name: 'Main Motion', template: 'THAT Council [action]...', needs: 'Second required. Debatable. Majority vote.', hint: 'The primary proposal for council to consider.',
        example: { title: 'Award Contract', steps: [
          { role: 'Cllr Rabel', action: 'I move THAT Council awards the contract to Northern Landscapes in the amount of $78,500.' },
          { role: 'Cllr Johnston', action: 'I second.' },
          { role: 'Mayor', action: 'Discussion? All in favour?' },
          { result: 'Carried Unanimously', color: '#22c55e' },
        ]},
      },
      { name: 'Adopt/Approve', template: 'THAT Council adopts [item] as presented.', needs: 'Second required. Debatable. Majority vote.', hint: 'Used for agenda, minutes, reports, bylaws.',
        example: { title: 'Adopt Minutes', steps: [
          { role: 'Cllr Wall', action: 'I move THAT Council adopts the minutes of the March 11 meeting as presented.' },
          { role: 'Cllr Woodill', action: 'I second.' },
          { role: 'Mayor', action: 'Any errors or omissions? All in favour?' },
          { result: 'Carried Unanimously', color: '#22c55e' },
        ]},
      },
    ],
  },
  {
    category: 'Amending Motions',
    items: [
      { name: 'Amend', template: 'THAT the main motion be amended by [adding/striking/substituting]...', needs: 'Second required. Debatable. Majority vote.', hint: 'Vote on amendment first, then main motion.',
        example: { title: 'Add Public Art to Contract', steps: [
          { role: 'Cllr Rabel', action: 'Moves main motion: award contract for $78,500.' },
          { role: 'Cllr Wall', action: 'I move THAT the main motion be amended by adding a public art component with $5,000 from reserves.' },
          { role: 'Cllr Woodill', action: 'I second the amendment.' },
          { role: 'Mayor', action: 'We deal with the amendment first. Discussion? All in favour of the amendment?' },
          { result: 'Amendment Carried', color: '#22c55e' },
          { role: 'Mayor', action: 'We return to the main motion as amended. All in favour?' },
          { result: 'Main Motion Carried (As Amended)', color: '#22c55e' },
        ]},
      },
      { name: 'Amend the Amendment', template: 'THAT the amendment be amended by...', needs: 'Second required. Debatable. Majority vote.', hint: 'Only one amendment to an amendment at a time.',
        example: { title: 'Change $5K to $3K', steps: [
          { role: 'Context', action: 'Amendment on floor to add public art at $5,000.' },
          { role: 'Cllr Johnston', action: 'I move THAT the amendment be amended by changing $5,000 to $3,000.' },
          { role: 'Cllr Rabel', action: 'I second.' },
          { role: 'Mayor', action: 'Vote on the sub-amendment first. All in favour?' },
          { result: 'Sub-Amendment Defeated 2-3', color: '#dc2626' },
          { role: 'Mayor', action: 'Back to the original amendment at $5,000.' },
        ]},
      },
    ],
  },
  {
    category: 'Reconsideration',
    items: [
      { name: 'Reconsider', template: 'THAT Council reconsiders the motion regarding [topic].', needs: 'Must be moved by someone on the prevailing side. Second required. Majority vote.', hint: 'Reopens a previously decided motion.',
        example: { title: 'Reconsider Rezoning', steps: [
          { role: 'Context', action: 'Earlier this meeting, rezoning was defeated 2-3.' },
          { role: 'Cllr Johnston', action: '(voted against) I move THAT Council reconsiders the motion regarding the rezoning of 102 Railway Ave.' },
          { role: 'Cllr Woodill', action: 'I second.' },
          { role: 'Mayor', action: 'All in favour of reconsideration?' },
          { result: 'Reconsideration Carried', color: '#22c55e' },
          { role: 'Mayor', action: 'The rezoning motion is back on the floor for debate.' },
        ]},
      },
      { name: 'Rescind', template: 'THAT Council rescinds the motion regarding [topic] passed on [date].', needs: 'Second required. Two-thirds vote (or majority with notice).', hint: 'Cancels a previously adopted motion entirely.',
        example: { title: 'Rescind Fee Increase', steps: [
          { role: 'Cllr Wall', action: 'I move THAT Council rescinds the motion passed Jan 14 regarding the recreation fee increase.' },
          { role: 'Cllr Rabel', action: 'I second.' },
          { role: 'Mayor', action: 'This requires a two-thirds vote. All in favour?' },
          { result: 'Carried (4-1, meets 2/3 threshold)', color: '#22c55e' },
        ]},
      },
    ],
  },
  {
    category: 'Postpone & Defer',
    items: [
      { name: 'Postpone Definitely', template: 'THAT Council postpones the matter to [date/meeting].', needs: 'Second required. Debatable. Majority vote.', hint: 'Delays to a specific future time.',
        example: { title: 'Postpone to April', steps: [
          { role: 'Cllr Rabel', action: 'I move THAT Council postpones the road budget to the April 2 regular meeting.' },
          { role: 'Cllr Wall', action: 'I second.' },
          { result: 'Carried — Matter postponed to April 2', color: '#22c55e' },
        ]},
      },
      { name: 'Table', template: 'THAT Council tables the matter.', needs: 'Second required. Not debatable. Majority vote.', hint: 'Sets aside. Can be taken from table later.',
        example: { title: 'Table Pending Report', steps: [
          { role: 'Cllr Johnston', action: 'I move THAT Council tables the matter pending a cost estimate from Public Works.' },
          { role: 'Cllr Woodill', action: 'I second.' },
          { role: 'Mayor', action: 'Not debatable. All in favour?' },
          { result: 'Tabled', color: '#22c55e' },
        ]},
      },
      { name: 'Take from Table', template: 'THAT Council takes from the table the motion regarding [topic].', needs: 'Second required. Not debatable. Majority vote.', hint: 'Brings back a tabled motion.',
        example: { title: 'Resume Road Budget', steps: [
          { role: 'Cllr Rabel', action: 'I move THAT Council takes from the table the road maintenance budget motion.' },
          { role: 'Cllr Wall', action: 'I second.' },
          { result: 'Carried — Motion is back on the floor', color: '#22c55e' },
        ]},
      },
    ],
  },
  {
    category: 'Refer & Committee',
    items: [
      { name: 'Refer to Committee', template: 'THAT Council refers the matter to [committee name] for review and report back.', needs: 'Second required. Debatable. Majority vote.', hint: 'Sends to committee for study.',
        example: { title: 'Refer Rezoning to Planning', steps: [
          { role: 'Cllr Wall', action: 'I move THAT Council refers the Pine Ave rezoning to the Planning Committee for review and report at the next meeting.' },
          { role: 'Cllr Rabel', action: 'I second.' },
          { result: 'Carried — Referred to Planning Committee', color: '#22c55e' },
        ]},
      },
      { name: 'Receive for Information', template: 'THAT Council receives [report/presentation] for information.', needs: 'Second required. Majority vote.', hint: 'Acknowledges receipt, no action taken.',
        example: { title: 'Receive CAO Report', steps: [
          { role: 'Cllr Johnston', action: "I move THAT Council receives the CAO's monthly report for information." },
          { role: 'Cllr Rabel', action: 'I second.' },
          { result: 'Carried', color: '#22c55e' },
        ]},
      },
    ],
  },
  {
    category: 'Voting & Procedure',
    items: [
      { name: 'Call the Question', template: 'THAT Council calls the question.', needs: 'Second required. Not debatable. Two-thirds vote.', hint: 'Ends debate, forces immediate vote.',
        example: { title: 'End Debate on Bylaw', steps: [
          { role: 'Cllr Woodill', action: 'I call the question.' },
          { role: 'Cllr Johnston', action: 'I second.' },
          { role: 'Mayor', action: 'Not debatable. Two-thirds required. All in favour of ending debate?' },
          { result: 'Carried — Proceeding to vote on the main motion', color: '#22c55e' },
        ]},
      },
      { name: 'Point of Order', template: 'Point of order, Mayor.', needs: 'No second. Chair rules immediately.', hint: 'Raised when a rule is being violated.',
        example: { title: 'Speaker Out of Order', steps: [
          { role: 'Cllr Wall', action: 'Point of order, Mayor. The speaker is discussing a matter not on the agenda.' },
          { role: 'Mayor', action: 'The point is well taken. Councillor, please confine your remarks to the motion on the floor.' },
        ]},
      },
    ],
  },
  {
    category: 'Readings & Bylaws',
    items: [
      { name: 'First Reading', template: 'THAT Council gives [Bylaw #] first reading.', needs: 'Second required. Debatable. Majority vote.', hint: 'Introduction of the bylaw.',
        example: { title: 'Introduce Noise Bylaw', steps: [
          { role: 'Cllr Woodill', action: 'I move THAT Council gives Bylaw 1021, the Noise Control Amendment Bylaw, first reading.' },
          { role: 'Cllr Wall', action: 'I second.' },
          { result: 'Carried — Bylaw 1021 given first reading', color: '#22c55e' },
        ]},
      },
      { name: 'Third Reading', template: 'THAT Council gives [Bylaw #] third and final reading.', needs: 'Second required. Debatable. Majority vote.', hint: 'Final adoption. Cannot be same meeting as 1st reading unless unanimous.',
        example: { title: 'Adopt Noise Bylaw', steps: [
          { role: 'Cllr Woodill', action: 'I move THAT Council gives Bylaw 1021 third and final reading.' },
          { role: 'Cllr Wall', action: 'I second.' },
          { role: 'Mayor', action: 'No changes since second reading. All in favour?' },
          { result: 'Carried Unanimously — Bylaw 1021 adopted', color: '#22c55e' },
        ]},
      },
    ],
  },
];

export default function RulesPanel({ topics, transcript }) {
  const [tab, setTab] = useState('roberts'); // 'procedure' | 'roberts' | 'tab3'
  const [expandedCat, setExpandedCat] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null); // 'cat-item' key
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  const copyTemplate = (template) => {
    navigator.clipboard.writeText(template).catch(() => {});
    setCopiedTemplate(template);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Tab toggle */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '6px 10px 0', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2,
        }}>
          {[
            { id: 'roberts', label: "Robert's Rules" },
            { id: 'procedure', label: 'Procedure Bylaw' },
            { id: 'precedent', label: 'Past Precedent' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '3px 8px', border: 'none', borderRadius: 4, cursor: 'pointer',
                background: tab === t.id ? '#fff' : 'transparent',
                boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontSize: 9, fontWeight: 600,
                color: tab === t.id ? '#475569' : '#94a3b8',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Procedure Rules tab */}
      {tab === 'procedure' && <ProcedureRules />}

      {/* Roberts Rules cheat sheet — Style A: Bar + Chips */}
      {tab === 'roberts' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <div style={{
            fontSize: 8, fontWeight: 600, color: '#94a3b8', fontStyle: 'italic',
            marginBottom: 8, textAlign: 'center',
          }}>
            Tap a motion type to copy its template
          </div>
          {ROBERTS_RULES.map((cat, ci) => {
            const isOpen = expandedCat === ci;
            return (
              <div key={ci} style={{ marginBottom: 4 }}>
                {/* Grey bar category header */}
                <div
                  onClick={() => setExpandedCat(isOpen ? null : ci)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 8px', background: '#f1f5f9', borderRadius: 6,
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                >
                  <svg width="7" height="7" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>{cat.category}</span>
                  <span style={{ fontSize: 8, color: '#94a3b8', marginLeft: 'auto' }}>{cat.items.length}</span>
                </div>
                {/* Chip items */}
                {isOpen && (
                  <div style={{ padding: '6px 4px 4px 10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                      {cat.items.map((item, ii) => {
                        const itemKey = `${ci}-${ii}`;
                        const isExpanded = expandedItem === itemKey;
                        return (
                          <div
                            key={ii}
                            onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : itemKey); }}
                            style={{
                              padding: '5px 10px', borderRadius: 999,
                              border: `1.5px solid ${isExpanded ? '#475569' : '#e2e8f0'}`,
                              background: isExpanded ? '#f1f5f9' : '#fff',
                              fontSize: 10, fontWeight: isExpanded ? 700 : 600,
                              color: isExpanded ? '#0f172a' : '#334155',
                              cursor: 'pointer', transition: 'all .15s',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {item.name}
                          </div>
                        );
                      })}
                    </div>
                    {/* Expanded example card */}
                    {cat.items.map((item, ii) => {
                      const itemKey = `${ci}-${ii}`;
                      if (expandedItem !== itemKey) return null;
                      return (
                        <div key={ii} style={{
                          border: '1px solid #e2e8f0', borderRadius: 8,
                          overflow: 'hidden', background: '#fff', marginBottom: 4,
                        }}>
                          {/* Template + copy */}
                          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyTemplate(item.template); }}
                                style={{
                                  marginLeft: 'auto', padding: '2px 6px', borderRadius: 4,
                                  border: '1px solid #e2e8f0', background: '#f8fafc',
                                  fontSize: 7, fontWeight: 600, color: '#64748b', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}
                              >
                                {copiedTemplate === item.template ? (
                                  <span style={{ color: '#22c55e' }}>Copied ✓</span>
                                ) : (
                                  <>
                                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <rect x="9" y="9" width="13" height="13" rx="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <div style={{
                              fontSize: 9, color: '#475569', fontFamily: "'Courier New', monospace",
                              background: '#f8fafc', padding: '4px 6px', borderRadius: 4,
                              borderLeft: '2px solid #cbd5e1', marginBottom: 4,
                            }}>
                              {item.template}
                            </div>
                            <div style={{ fontSize: 8, color: '#64748b' }}>{item.needs}</div>
                            <div style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic', marginTop: 1 }}>{item.hint}</div>
                          </div>
                          {/* Example flow */}
                          {item.example && (
                            <div style={{ padding: '8px 10px', background: '#fafafa' }}>
                              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
                                Example: {item.example.title}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {item.example.steps.map((step, si) => (
                                  step.result ? (
                                    <div key={si} style={{
                                      padding: '4px 8px', borderRadius: 4,
                                      background: step.color === '#22c55e' ? '#f0fdf4' : '#fef2f2',
                                      borderLeft: `2px solid ${step.color}`,
                                      fontSize: 9, fontWeight: 700, color: step.color,
                                    }}>
                                      {step.result}
                                    </div>
                                  ) : (
                                    <div key={si} style={{
                                      padding: '3px 8px', borderLeft: '2px solid #e2e8f0',
                                      borderRadius: '0 4px 4px 0',
                                    }}>
                                      <span style={{ fontSize: 7, fontWeight: 700, color: '#64748b' }}>{step.role}: </span>
                                      <span style={{ fontSize: 9, color: '#334155' }}>{step.action}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Precedent — examples from past meetings */}
      {tab === 'precedent' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <div style={{
            fontSize: 8, fontWeight: 600, color: '#94a3b8', fontStyle: 'italic',
            marginBottom: 8, textAlign: 'center',
          }}>
            Examples from past meetings showing how motions were handled
          </div>
          {[
            {
              type: 'Amendment Carried',
              meeting: 'March 25, 2026 — Regular Meeting',
              agendaItem: '8. New Business — Main Street Beautification',
              description: 'Council amended the contract award motion to add a public art component.',
              flow: [
                { label: 'Main Motion', text: 'THAT Council awards the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.', who: 'Moved: Cllr Rabel · Sec\'d: Cllr Johnston' },
                { label: 'Amendment', text: 'THAT the main motion be amended by adding "and that the project include a public art component with a budget allocation of up to $5,000 from the community enhancement reserve."', who: 'Moved: Cllr Wall · Sec\'d: Cllr Woodill' },
                { label: 'Amendment Vote', text: 'Carried Unanimously', isResult: true, color: '#22c55e' },
                { label: 'Main Motion (As Amended)', text: 'Carried', isResult: true, color: '#22c55e' },
              ],
            },
            {
              type: 'Amendment Defeated',
              meeting: 'March 25, 2026 — Regular Meeting',
              agendaItem: '8. New Business — Canada Day Contribution',
              description: 'An amendment to reduce the Canada Day contribution was defeated. Original motion carried.',
              flow: [
                { label: 'Main Motion', text: 'THAT Council approves a contribution of $3,000 from the events reserve to the Recreation Commission for the 2026 Canada Day celebration.', who: 'Moved: Cllr Johnston · Sec\'d: Cllr Woodill' },
                { label: 'Amendment', text: 'THAT the main motion be amended by reducing the contribution from $3,000 to $1,500 and directing the remaining $1,500 to the sidewalk repair reserve.', who: 'Moved: Cllr Wall · Sec\'d: Cllr Rabel' },
                { label: 'Amendment Vote', text: 'Defeated 1-4', isResult: true, color: '#dc2626' },
                { label: 'Main Motion (Original)', text: 'Carried Unanimously', isResult: true, color: '#22c55e' },
              ],
            },
            {
              type: 'Reconsideration',
              meeting: 'March 25, 2026 — Regular Meeting',
              agendaItem: '8. New Business — Rezoning 102 Railway Ave',
              description: 'A defeated rezoning motion was reconsidered and tabled for public consultation.',
              flow: [
                { label: 'Original Motion', text: 'THAT Council directs staff to initiate a rezoning of the parcel at 102 Railway Avenue from R-1 to C-2 Commercial.', who: 'Moved: Cllr Wall · Sec\'d: Cllr Rabel' },
                { label: 'Original Vote', text: 'Defeated', isResult: true, color: '#dc2626' },
                { label: 'Reconsideration', text: 'THAT Council reconsiders the motion regarding the rezoning of 102 Railway Avenue, and THAT the matter be tabled to the next regular meeting pending a public consultation report.', who: 'Moved: Cllr Johnston · Sec\'d: Cllr Woodill' },
                { label: 'Reconsideration Vote', text: 'Carried', isResult: true, color: '#22c55e' },
              ],
            },
            {
              type: 'Tabling',
              meeting: 'Feb 10, 2026 — Regular Meeting',
              agendaItem: '7. Road Maintenance Budget',
              description: 'Motion tabled pending additional cost estimates from Public Works.',
              flow: [
                { label: 'Main Motion', text: 'THAT Council approves the 2025 road maintenance budget of $142,000 as presented.', who: 'Moved: Cllr Johnston · Sec\'d: Mayor Veach' },
                { label: 'Motion to Table', text: 'THAT Council tables the matter pending a revised cost estimate from Public Works.', who: 'Moved: Cllr Rabel · Sec\'d: Cllr Wall' },
                { label: 'Tabling Vote', text: 'Carried 4-1', isResult: true, color: '#22c55e' },
              ],
            },
            {
              type: 'Referral to Committee',
              meeting: 'Jan 14, 2026 — Regular Meeting',
              agendaItem: '9. Zoning Amendment — Pine Ave',
              description: 'Rather than voting directly, council referred the rezoning to the Planning Committee.',
              flow: [
                { label: 'Main Motion', text: 'THAT Council approves the rezoning of 4820 Pine Ave from R1 to R2.', who: 'Moved: Cllr Johnston · Sec\'d: Cllr Woodill' },
                { label: 'Motion to Refer', text: 'THAT Council refers the Pine Avenue rezoning to the Planning Committee for review and report back at the next regular meeting.', who: 'Moved: Cllr Wall · Sec\'d: Cllr Rabel' },
                { label: 'Referral Vote', text: 'Carried Unanimously', isResult: true, color: '#22c55e' },
              ],
            },
            {
              type: 'Defeated Motion',
              meeting: 'Dec 17, 2025 — Regular Meeting',
              agendaItem: '11. New Business — Extended Hours Bylaw',
              description: 'A motion to extend business hours on weekends was defeated by council.',
              flow: [
                { label: 'Main Motion', text: 'THAT Council directs staff to draft a bylaw amendment extending permitted business hours to 11 PM on Fridays and Saturdays.', who: 'Moved: Cllr Wall · Sec\'d: Cllr Woodill' },
                { label: 'Vote', text: 'Defeated 2-3', isResult: true, color: '#dc2626' },
              ],
            },
          ].map((ex, ei) => (
            <div key={ei} style={{
              marginBottom: 8, borderRadius: 8, border: '1px solid #e2e8f0',
              overflow: 'hidden', background: '#fff',
            }}>
              {/* Header */}
              <div
                onClick={() => setExpandedCat(expandedCat === `p${ei}` ? null : `p${ei}`)}
                style={{
                  padding: '8px 10px', cursor: 'pointer',
                  background: expandedCat === `p${ei}` ? '#f8fafc' : '#fff',
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                }}
              >
                <svg width="8" height="8" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"
                  style={{ transform: expandedCat === `p${ei}` ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginTop: 3 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a' }}>{ex.type}</div>
                  <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>{ex.meeting}</div>
                </div>
              </div>
              {/* Expanded */}
              {expandedCat === `p${ei}` && (
                <div style={{ padding: '0 10px 10px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', margin: '8px 0 4px' }}>{ex.agendaItem}</div>
                  <div style={{ fontSize: 9, color: '#475569', marginBottom: 8, fontStyle: 'italic' }}>{ex.description}</div>
                  {/* Flow steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ex.flow.map((step, si) => (
                      <div key={si} style={{
                        padding: '5px 8px',
                        background: step.isResult ? (step.color === '#22c55e' ? '#f0fdf4' : '#fef2f2') : '#f8fafc',
                        borderLeft: `2px solid ${step.isResult ? step.color : '#cbd5e1'}`,
                        borderRadius: '0 5px 5px 0',
                      }}>
                        <div style={{
                          fontSize: 7, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
                          color: step.isResult ? step.color : '#64748b', marginBottom: 2,
                        }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 9, color: step.isResult ? step.color : '#334155', lineHeight: 1.5, fontWeight: step.isResult ? 700 : 400 }}>
                          {step.text}
                        </div>
                        {step.who && <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>{step.who}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Procedure alerts — always visible at bottom */}
      <RuleAlert topics={topics} transcript={transcript} />
    </div>
  );
}
