import { COLORS } from '../../styles/tokens';

// Key rules from Bylaw 1021 — Village of Pouce Coupe Council Procedure Bylaw
const RULES = [
  {
    section: '5',
    title: 'Time and Location of Meetings',
    rules: [
      'All Council meetings must take place within the Village Office except when Council resolves to hold a meeting elsewhere.',
      'Regular Council meetings must be held on the first and third Wednesday of each month, and begin at 7:00 p.m.',
      'Meetings be adjourned at 9:00 p.m. unless Council resolves to proceed beyond that time.',
      'When a meeting falls on a statutory holiday, it must be held on the next day the Village Office is open.',
    ],
  },
  {
    section: '6',
    title: 'Notice of Council Meetings',
    rules: [
      'Council must prepare annually, on or before December 31st, a schedule of dates, times, and places of regular Council meetings.',
      'The schedule must be made available to the public by posting at the Public Notice Posting Places.',
      'Revisions to the schedule must be posted as soon as possible by the Corporate Officer.',
    ],
  },
  {
    section: '7',
    title: 'Notice of Special Meetings',
    rules: [
      'Notice of special meetings must be given at least 24 hours before the meeting.',
      'Notice must be posted in Council chambers, at Public Notice Posting Places, and in each Council member\'s mailbox.',
      'The notice must describe in general terms the purpose of the meeting and be signed by the Mayor or Corporate Officer.',
    ],
  },
  {
    section: '8',
    title: 'Designation of Member to Act in Place of Mayor',
    rules: [
      'Annually in December, Council must designate Councillors to serve on a rotating basis as the member responsible for acting in the place of the Mayor.',
      'If both the Mayor and designated member are absent, Council members rotate to the next Councillor listed.',
      'The designated member has the same powers and duties as the Mayor.',
    ],
  },
  {
    section: '9',
    title: 'Council Proceedings',
    rules: [
      'Matters pertaining to Council proceedings are governed by the Community Charter.',
      'Quorum is a majority of Council members.',
      'The Mayor is the Chair of Council meetings.',
    ],
  },
  {
    section: '10',
    title: 'Agenda',
    rules: [
      'The Corporate Officer must prepare an agenda for each Council meeting.',
      'The agenda must be posted at least 24 hours before the meeting.',
      'Late items may be added with unanimous consent of Council members present.',
    ],
  },
  {
    section: '11',
    title: 'Motions',
    rules: [
      'A motion must be moved and seconded before being debated or voted upon.',
      'A motion to amend must be relevant to the original motion.',
      'Only one amendment to an amendment may be considered at a time.',
      'A motion to table removes the matter from discussion until Council votes to take it from the table.',
    ],
  },
  {
    section: '12',
    title: 'Voting',
    rules: [
      'Each Council member present must vote on every question unless they have a conflict of interest.',
      'Voting is by show of hands unless a recorded vote is requested.',
      'The Chair votes and may make or second motions.',
      'A tie vote is defeated.',
    ],
  },
  {
    section: '13',
    title: 'Bylaws',
    rules: [
      'A bylaw must receive three readings before adoption.',
      'A bylaw may receive first, second, and third reading at the same meeting.',
      'A bylaw must not be adopted at the same meeting it receives third reading unless unanimous.',
    ],
  },
  {
    section: '14',
    title: 'Delegations',
    rules: [
      'Delegations wishing to appear before Council must submit a written request to the Corporate Officer.',
      'Delegations are limited to 10 minutes unless Council grants an extension.',
      'Council may limit or refuse a delegation.',
    ],
  },
  {
    section: '15',
    title: 'In-Camera (Closed) Meetings',
    rules: [
      'Council may close a meeting to the public under Section 90(1) of the Community Charter.',
      'Permitted topics include: legal advice, litigation, labour relations, land acquisitions, law enforcement, and personal information.',
      'A motion to go in-camera must state the applicable section of the Community Charter.',
      'No resolution or bylaw may be passed at a closed meeting.',
    ],
  },
];

export default function ProcedureRules() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {RULES.map((group) => (
          <div key={group.section} style={{
            background: '#f8fafc',
            border: `1px solid ${COLORS.cardBorder}`,
            borderLeft: `3px solid #ca8a04`,
            borderRadius: '0 8px 8px 0',
            padding: '8px 10px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#ca8a04',
                background: '#fefce8', border: '1px solid #fde68a',
                borderRadius: 4, padding: '1px 6px',
              }}>
                s.{group.section}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.headingText }}>
                {group.title}
              </span>
            </div>
            <ul style={{
              margin: 0, paddingLeft: 16,
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {group.rules.map((rule, i) => (
                <li key={i} style={{
                  fontSize: 10.5, color: COLORS.bodyText, lineHeight: 1.6,
                }}>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
