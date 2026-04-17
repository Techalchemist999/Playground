// Hardcoded demo data for UI testing — Village of Pouce Coupe council meeting
// Includes: regular motions (carried/defeated), amendments (carried/defeated)

// Attachments per agenda item. Each item has up to 3 example attachments.
// Type determines how AttachmentModal renders the content.
const ATT_CENTENNIAL_MAP = {
  id: 'att-8-map', type: 'map', title: 'Centennial Park — Site Map',
  subtitle: 'Current layout + proposed playground zone',
  pages: 1,
};
const ATT_GRANT_REPORT = {
  id: 'att-8-report', type: 'report', title: 'Staff Report — NDIT Park Improvement Grant',
  subtitle: 'RPT-2025-041 · 2025-03-18 · CAO',
  pages: 4,
  report: {
    ref: 'RPT-2025-041', date: '2025-03-18', author: 'CAO (T. Sinclair)',
    to: 'Mayor & Council', from: 'CAO',
    subject: 'NDIT Park Improvement Grant Application — Centennial Park Playground',
    sections: [
      { heading: '1. Background',
        text: 'Centennial Park\'s playground equipment was installed in 2006 and has reached the end of its service life. A 2024 inspection flagged three pieces (swings, climber, slide) as requiring replacement within 18 months. The Northern Development Initiative Trust (NDIT) Park Improvement Grant opened its 2025 intake on March 1; deadline for applications is April 30, 2025. This report seeks Council\'s direction to proceed with the grant application before the deadline.' },
      { heading: '2. Analysis',
        text: 'Staff reviewed three playground equipment suppliers and obtained pre-construction estimates. The NDIT program funds up to $75,000 per project at 100% for municipalities with populations under 1,000. Village of Pouce Coupe qualifies. Matching funds are not required, but demonstrated community support (letters, survey results, or consultation) strengthens the application. An informal community canvass conducted March 5–12 returned 41 responses, with 38 in support, 2 opposed, and 1 undecided.' },
      { heading: '3. Financial Implications',
        text: 'If successful, the grant covers 100% of equipment ($62,400) plus installation ($12,600). No impact on 2025 tax levy. Staff time for application: approximately 12 hours, absorbed into existing operations budget. Should the grant be unsuccessful, the existing equipment will require staged decommissioning beginning Q3 2025, with public notice and no direct replacement unless reserves are drawn down.' },
      { heading: '4. Options',
        text: 'A) Authorize staff to submit the application as presented (recommended). B) Defer the decision pending additional community consultation (will miss April 30 deadline). C) Decline to apply, in which case existing equipment will be decommissioned per Option A-3 of the 2024 inspection report.' },
      { heading: '5. Recommendation',
        text: 'THAT Council authorizes staff to submit the NDIT Park Improvement grant application for $75,000 for playground equipment replacement at Centennial Park.' },
      { heading: 'Appendix A — Prior Correspondence',
        text: 'January 18, 2025: Email from NDIT Program Officer confirming Pouce Coupe\'s eligibility. February 3, 2025: Letter of intent submitted (reference NDIT-PI-2025-087). February 19, 2025: Intake workshop attended by CAO and Public Works Supervisor.' },
      { heading: 'Appendix B — Supplier Comparison',
        text: 'PlayWorks Northern: $75,000 all-in, 12-week lead time, CSA certified (recommended). KidKinetics: $79,800 all-in, 8-week lead time, CSA certified. ActivePlay Co.: $71,500 all-in, 16-week lead time, conditional certification pending re-inspection of 2024 shipment.' },
      { heading: 'Appendix C — Community Letters of Support',
        text: 'Letters received from: Centennial Park Parent Group (March 8), Pouce Coupe Elementary PAC (March 11), North Peace Family & Community Centre (March 13). All letters express support for accessible, age-appropriate equipment and urge prompt replacement.' },
    ],
  },
};
const ATT_GRANT_BUDGET = {
  id: 'att-8-budget', type: 'budget', title: 'Playground Equipment — Budget Estimate',
  subtitle: 'Pre-construction quotes · 3 suppliers',
  pages: 1,
  budget: {
    totalEstimate: 75000,
    supplier: 'PlayWorks Northern (recommended)',
    lines: [
      { item: 'Primary play structure (5–12 yrs)',  qty: 1, unitCost: 28400, subtotal: 28400 },
      { item: 'Swing set (2-bay + toddler seat)',   qty: 1, unitCost: 8200,  subtotal: 8200 },
      { item: 'Climber / spinner combo',            qty: 1, unitCost: 14600, subtotal: 14600 },
      { item: 'Safety surfacing (rubber tiles)',    qty: 240, unitCost: 47,  subtotal: 11200, note: 'sq ft' },
      { item: 'Installation + site prep',           qty: 1, unitCost: 12600, subtotal: 12600 },
    ],
    contingency: 0,
    notes: 'Quoted figures include freight to Pouce Coupe. Alternate supplier (KidKinetics) came in at $79,800 — above grant ceiling.',
  },
};

const ATT_BYLAW_1021 = { id: 'att-5-bylaw', type: 'report', title: 'Bylaw 1021 — Council Procedure Bylaw (Third Reading copy)', subtitle: '22 pages · amended Feb 24, 2025', pages: 22,
  report: { ref: 'BYLAW-1021', date: '2025-02-24', author: 'Corporate Officer', to: 'Council', from: 'Corporate Officer', subject: 'Council Procedure Bylaw 1021 — Third Reading',
    sections: [
      { heading: 'Preamble', text: 'A bylaw to establish procedures for the conduct of Council meetings and for the committees of Council.' },
      { heading: 'Part 1 — Authority', text: 'Enacted under authority of the Community Charter, SBC 2003, c. 26.' },
      { heading: 'Part 2 — Meetings', text: 'Regular meetings of Council shall be held on the second and fourth Monday of each month at 7:00 PM.' },
      { heading: 's.14 — Public Consultation (amended)', text: 'Added by amendment 2025-02-24: Council shall consult publicly on matters materially affecting residents, using notice-of-intent or open house processes.' },
    ] } };
const ATT_WATER_REPORT = { id: 'att-6-report', type: 'report', title: 'Staff Report — Water Rate Review', subtitle: 'RPT-2025-028 · 2025-02-14', pages: 6,
  report: { ref: 'RPT-2025-028', date: '2025-02-14', author: 'Finance Officer', to: 'Council', from: 'Finance', subject: 'Proposed 4.5% Water Rate Increase',
    sections: [
      { heading: 'Context', text: 'Water utility operating costs have risen 6.1% year-over-year, driven primarily by chemicals and electricity.' },
      { heading: 'Options Analysis', text: 'A 4.5% rate increase would restore the utility to cost recovery within 2 fiscal years without drawing on reserves.' },
      { heading: 'Recommendation', text: 'THAT Council approve a 4.5% water rate increase effective July 1, 2025.' },
    ] } };
const ATT_ZONING_MAP = { id: 'att-9-map', type: 'map', title: 'Rezoning Sketch — 4820 Pine Ave', subtitle: 'R1 → R2 boundary', pages: 1 };
const ATT_ZONING_REPORT = { id: 'att-9-report', type: 'report', title: 'Staff Report — Zoning Amendment 4820 Pine Ave', subtitle: 'RPT-2025-045 · 2025-03-20', pages: 3,
  report: { ref: 'RPT-2025-045', date: '2025-03-20', author: 'Planner', to: 'Council', from: 'Planning', subject: 'Rezone 4820 Pine Ave (R1 → R2)',
    sections: [
      { heading: 'Applicant', text: 'Property owner requesting rezone from R1 (single-family) to R2 (two-family / duplex).' },
      { heading: 'OCP Alignment', text: 'Consistent with Official Community Plan policy 4.3 encouraging gentle density on arterial frontage.' },
      { heading: 'Recommendation', text: 'THAT Council give first and second reading to Zoning Amendment Bylaw 1038 and refer to Public Hearing.' },
    ] } };

export const DEMO_AGENDA_ITEMS = [
  { number: 1, title: 'Call to Order', description: 'Mayor Veach calls the meeting to order', status: 'discussed', attachments: [] },
  { number: 2, title: 'Adoption of Agenda', description: 'Motion to adopt the agenda as presented', status: 'discussed', attachments: [] },
  { number: 3, title: 'Adoption of Minutes — Feb 10, 2025', description: 'Regular council meeting minutes', status: 'discussed', attachments: [] },
  { number: 4, title: 'Delegation — Pine Ave Residents', description: 'Presentation re: drainage concerns on Pine Avenue', status: 'discussed', attachments: [] },
  { number: 5, title: 'Bylaw 1021 — Third Reading', description: 'Council Procedure Bylaw — final adoption (amendment proposed)', status: 'discussed', attachments: [ATT_BYLAW_1021] },
  { number: 6, title: 'Water Rate Increase — 2025', description: 'Staff report on proposed 4.5% rate adjustment', status: 'discussed', attachments: [ATT_WATER_REPORT] },
  { number: 7, title: 'Road Maintenance Budget', description: 'Review of spring grading and patching program', status: 'discussed', attachments: [] },
  { number: 8, title: 'Park Improvement Grant Application', description: 'NDIT grant for playground equipment replacement', status: 'active',
    attachments: [ATT_CENTENNIAL_MAP, ATT_GRANT_REPORT, ATT_GRANT_BUDGET] },
  { number: 9, title: 'Zoning Amendment — Pine Ave', description: 'Rezone 4820 Pine Ave from R1 to R2', status: 'pending', attachments: [ATT_ZONING_MAP, ATT_ZONING_REPORT] },
  { number: 10, title: 'CAO Report', description: 'Monthly operational update from Chief Administrative Officer', status: 'pending', attachments: [] },
  { number: 11, title: 'New Business', status: 'pending', attachments: [] },
  { number: 12, title: 'In-Camera (Closed Session)', description: 'Personnel matter per Community Charter s.90', status: 'pending', attachments: [] },
  { number: 13, title: 'Adjournment', status: 'pending', attachments: [] },
];

// Motion topics — these drive BiteCard rendering
// amendment field: null = no amendment, object = amendment details
export const DEMO_TOPICS = [
  // Topic bubbles (non-motion)
  { normalized_id: 'bylaw-1021', label: 'Bylaw 1021', category: 'bylaw', state: 'ACTIVE', mention_count: 5, decay_score: 0.9 },
  { normalized_id: 'water-rates', label: 'Water Rates', category: 'budget', state: 'DETECTED', mention_count: 3, decay_score: 0.7 },
  { normalized_id: 'pine-ave', label: 'Pine Ave', category: 'location', state: 'ACTIVE', mention_count: 4, decay_score: 0.85 },
  { normalized_id: 'zoning', label: 'Zoning', category: 'policy', state: 'DETECTED', mention_count: 2, decay_score: 0.6 },
  { normalized_id: 'roads', label: 'Roads', category: 'topic', state: 'ACTIVE', mention_count: 3, decay_score: 0.65 },
  { normalized_id: 'drainage', label: 'Drainage', category: 'topic', state: 'DETECTED', mention_count: 2, decay_score: 0.5 },
  { normalized_id: 'park-grant', label: 'Park Grant', category: 'program', state: 'DETECTED', mention_count: 1, decay_score: 0.4 },
  { normalized_id: 'cao-report', label: 'CAO Report', category: 'department', state: 'DETECTED', mention_count: 1, decay_score: 0.3 },
  { normalized_id: 'public-consultation', label: 'Public Consultation', category: 'policy', state: 'DETECTED', mention_count: 1, decay_score: 0.35 },

  // Motion 1: Adopt Agenda — simple, carried unanimously
  {
    normalized_id: 'motion-adopt-agenda',
    label: 'Adopt Agenda',
    category: 'motion',
    state: 'EXPIRED',
    mention_count: 1,
    decay_score: 0.05,
    agendaItemNumber: 2,
    mover: 'Councillor Rabel',
    seconder: 'Councillor Johnston',
    motionText: 'THAT Council adopts the agenda as presented.',
    votes: ['yes','yes','yes','yes','yes'],
    amendment: null,
  },

  // Motion 2: Adopt Minutes — simple, carried unanimously
  {
    normalized_id: 'motion-adopt-minutes',
    label: 'Adopt Minutes — Feb 10',
    category: 'motion',
    state: 'EXPIRED',
    mention_count: 1,
    decay_score: 0.08,
    agendaItemNumber: 3,
    mover: 'Councillor Wall',
    seconder: 'Councillor Woodill',
    motionText: 'THAT Council adopts the minutes of the February 10, 2025 regular meeting as presented.',
    votes: ['yes','yes','yes','yes','yes'],
    amendment: null,
  },

  // Motion 3: Bylaw 1021 — AMENDMENT CARRIED
  {
    normalized_id: 'motion-bylaw-1021',
    label: 'Bylaw 1021 — Third Reading',
    category: 'motion',
    state: 'EXPIRED',
    mention_count: 3,
    decay_score: 0.9,
    agendaItemNumber: 5,
    mover: 'Councillor Rabel',
    seconder: 'Councillor Wall',
    motionText: 'THAT Council gives Bylaw 1021 third and final reading.',
    votes: ['yes','yes','yes','yes','yes'],
    amendment: {
      status: 'carried', // 'pending' | 'voting' | 'carried' | 'defeated'
      text: 'adding section 14 regarding public consultation requirements.',
      mover: 'Councillor Wall',
      seconder: 'Councillor Johnston',
      votes: ['yes','yes','no','yes','yes'],
      result: 'Carried 4-1',
    },
  },

  // Motion 4: Water Rate — AMENDMENT DEFEATED
  // Amendment tried to reduce from 4.5% to 3%
  {
    normalized_id: 'motion-water-rate',
    label: 'Water Rate Increase',
    category: 'motion',
    state: 'EXPIRED',
    mention_count: 1,
    decay_score: 0.6,
    agendaItemNumber: 6,
    mover: 'Mayor Veach',
    seconder: 'Councillor Rabel',
    motionText: 'THAT Council approves a 4.5% water rate increase effective July 1, 2025.',
    votes: ['yes','yes','no','yes','yes'],
    amendment: {
      status: 'defeated',
      text: 'reducing the increase from 4.5% to 3.0%.',
      mover: 'Councillor Johnston',
      seconder: 'Councillor Woodill',
      votes: ['no','no','yes','yes','no'],
      result: 'Defeated 2-3',
    },
  },

  // Motion 5: Road Budget — simple, awaiting vote (no amendment)
  {
    normalized_id: 'motion-road-budget',
    label: 'Road Maintenance Budget',
    agendaItemNumber: 7,
    category: 'motion',
    state: 'EXPIRED',
    mention_count: 1,
    decay_score: 0.4,
    mover: 'Councillor Johnston',
    seconder: 'Mayor Veach',
    motionText: 'THAT Council approves the 2025 road maintenance budget of $142,000 as presented.',
    votes: ['yes','yes','yes','yes','yes'],
    amendment: null,
  },

  // Motion 6: Park Improvement Grant — ON THE FLOOR (demo showcase)
  // Active amendment pending — drives the "4 AMEND" procedure pill
  {
    normalized_id: 'motion-park-grant',
    label: 'Park Improvement Grant Application',
    agendaItemNumber: 8,
    category: 'motion',
    state: 'ACTIVE',
    mention_count: 2,
    decay_score: 0.95,
    mover: 'Councillor Johnston',
    seconder: 'Councillor Wall',
    motionText: 'THAT Council authorizes staff to submit the NDIT Park Improvement grant application for $75,000 for playground equipment replacement at Centennial Park.',
    votes: [null, null, null, null, null],
    amendment: {
      status: 'pending',
      text: 'adding a requirement for community consultation with Centennial Park neighbours prior to final design approval.',
      mover: 'Councillor Rabel',
      seconder: 'Councillor Wall',
      votes: [null, null, null, null, null],
    },
  },
];

export const DEMO_TRANSCRIPT = [
  { speaker: 'Mayor Veach', text: 'I\'d like to call this meeting of the Village of Pouce Coupe council to order. It is 7:02 PM. We have a quorum present.', timestamp: '19:02:00' },
  { speaker: 'Mayor Veach', text: 'Can I have a motion to adopt the agenda as presented?', timestamp: '19:02:15' },
  { speaker: 'Councillor Rabel', text: 'I move to adopt the agenda.', timestamp: '19:02:22' },
  { speaker: 'Councillor Johnston', text: 'Seconded.', timestamp: '19:02:25' },
  { speaker: 'Mayor Veach', text: 'All in favour? Carried unanimously.', timestamp: '19:02:35' },
  { speaker: 'Councillor Wall', text: 'I move we adopt the minutes of February 10th as presented.', timestamp: '19:02:50' },
  { speaker: 'Councillor Woodill', text: 'I\'ll second that.', timestamp: '19:02:55' },
  { speaker: 'Mayor Veach', text: 'All in favour? Carried. Now we have a delegation from Pine Avenue.', timestamp: '19:03:10' },
  { speaker: 'Delegation', text: 'Thank you Mayor and Council. We represent twelve households on Pine Avenue experiencing drainage issues over the past two winters.', timestamp: '19:03:30' },
  { speaker: 'CAO', text: 'We did an assessment last fall. The ditch needs regrading — approximately $18,000, within the existing roads budget.', timestamp: '19:05:20' },
  { speaker: 'Mayor Veach', text: 'Moving on to item 5. Bylaw 1021, third reading.', timestamp: '19:06:30' },
  { speaker: 'Councillor Rabel', text: 'I move that Council give Bylaw 1021, the Council Procedure Bylaw, third and final reading.', timestamp: '19:06:50' },
  { speaker: 'Councillor Wall', text: 'Seconded.', timestamp: '19:06:58' },
  { speaker: 'Councillor Wall', text: 'Before we vote, I\'d like to propose an amendment. I move that we amend the motion to add section 14 regarding public consultation requirements.', timestamp: '19:07:10' },
  { speaker: 'Councillor Johnston', text: 'I\'ll second that amendment.', timestamp: '19:07:18' },
  { speaker: 'Mayor Veach', text: 'We have an amendment on the floor. We\'ll deal with the amendment first. Discussion?', timestamp: '19:07:25' },
  { speaker: 'Councillor Rabel', text: 'I think the public consultation clause is a good addition. It strengthens the bylaw.', timestamp: '19:07:40' },
  { speaker: 'Mayor Veach', text: 'All in favour of the amendment? The amendment is carried 4-1. We now return to the main motion as amended.', timestamp: '19:08:00' },
  { speaker: 'Mayor Veach', text: 'The motion now reads: THAT Council gives Bylaw 1021 third reading, with the addition of section 14 regarding public consultation. All in favour?', timestamp: '19:08:20' },
  { speaker: 'Mayor Veach', text: 'Item 6. Water rate increase. Can I have a motion?', timestamp: '19:09:00' },
  { speaker: 'Mayor Veach', text: 'I move that Council approves a 4.5% water rate increase effective July 1, 2025.', timestamp: '19:09:10' },
  { speaker: 'Councillor Rabel', text: 'Seconded.', timestamp: '19:09:15' },
  { speaker: 'Councillor Johnston', text: 'I\'d like to propose an amendment to reduce the increase from 4.5% to 3%.', timestamp: '19:09:30' },
  { speaker: 'Councillor Woodill', text: 'I\'ll second that.', timestamp: '19:09:35' },
  { speaker: 'CAO', text: 'I\'d caution that a 3% increase won\'t cover the infrastructure costs we projected.', timestamp: '19:09:50' },
  { speaker: 'Mayor Veach', text: 'All in favour of the amendment to reduce to 3%? The amendment is defeated 2-3. We return to the original motion at 4.5%.', timestamp: '19:10:10' },
  { speaker: 'Councillor Johnston', text: 'I move that Council approves the 2025 road maintenance budget of $142,000 as presented.', timestamp: '19:11:00' },
];

// Timed events for playback simulation
// Each event fires after `delay` ms from session start
export const DEMO_PLAYBACK = [
  { delay: 0, type: 'transcript', index: 0 },
  { delay: 2000, type: 'transcript', index: 1 },
  { delay: 3000, type: 'transcript', index: 2 },
  { delay: 3500, type: 'topic', id: 'motion-adopt-agenda', stateChange: 'DETECTED' },
  { delay: 4000, type: 'transcript', index: 3 },
  { delay: 4500, type: 'topic', id: 'motion-adopt-agenda', stateChange: 'ACTIVE' },
  { delay: 5500, type: 'transcript', index: 4 },
  { delay: 6000, type: 'topic', id: 'motion-adopt-agenda', stateChange: 'EXPIRED' },
  { delay: 7000, type: 'transcript', index: 5 },
  { delay: 7500, type: 'topic', id: 'motion-adopt-minutes', stateChange: 'DETECTED' },
  { delay: 8000, type: 'transcript', index: 6 },
  { delay: 8500, type: 'topic', id: 'motion-adopt-minutes', stateChange: 'ACTIVE' },
  { delay: 9500, type: 'transcript', index: 7 },
  { delay: 10000, type: 'topic', id: 'motion-adopt-minutes', stateChange: 'EXPIRED' },
  { delay: 10000, type: 'agenda', number: 4, status: 'active' },
  { delay: 11000, type: 'transcript', index: 8 },
  { delay: 11500, type: 'topic', id: 'pine-ave', stateChange: 'DETECTED' },
  { delay: 12000, type: 'topic', id: 'drainage', stateChange: 'DETECTED' },
  { delay: 13000, type: 'transcript', index: 9 },
  { delay: 14000, type: 'topic', id: 'roads', stateChange: 'DETECTED' },
  { delay: 15000, type: 'transcript', index: 10 },
  { delay: 15000, type: 'agenda', number: 5, status: 'active' },
  { delay: 16000, type: 'transcript', index: 11 },
  { delay: 16500, type: 'topic', id: 'motion-bylaw-1021', stateChange: 'DETECTED' },
  { delay: 16500, type: 'topic', id: 'bylaw-1021', stateChange: 'ACTIVE' },
  { delay: 17000, type: 'transcript', index: 12 },
  { delay: 17500, type: 'topic', id: 'motion-bylaw-1021', stateChange: 'ACTIVE' },
  // Amendment proposed
  { delay: 18500, type: 'transcript', index: 13 },
  { delay: 19000, type: 'topic', id: 'public-consultation', stateChange: 'DETECTED' },
  { delay: 19500, type: 'transcript', index: 14 },
  { delay: 20000, type: 'transcript', index: 15 },
  { delay: 21000, type: 'transcript', index: 16 },
  // Amendment vote
  { delay: 22000, type: 'transcript', index: 17 },
  // Main motion vote
  { delay: 24000, type: 'transcript', index: 18 },
  // Water rate motion
  { delay: 26000, type: 'transcript', index: 19 },
  { delay: 26000, type: 'agenda', number: 6, status: 'active' },
  { delay: 27000, type: 'transcript', index: 20 },
  { delay: 27500, type: 'topic', id: 'motion-water-rate', stateChange: 'DETECTED' },
  { delay: 27500, type: 'topic', id: 'water-rates', stateChange: 'ACTIVE' },
  { delay: 28000, type: 'transcript', index: 21 },
  { delay: 28500, type: 'topic', id: 'motion-water-rate', stateChange: 'ACTIVE' },
  // Water rate amendment proposed
  { delay: 29500, type: 'transcript', index: 22 },
  { delay: 30000, type: 'transcript', index: 23 },
  { delay: 31000, type: 'transcript', index: 24 },
  // Water rate amendment defeated
  { delay: 32000, type: 'transcript', index: 25 },
  // Road budget motion (mover detected, no seconder yet)
  { delay: 34000, type: 'transcript', index: 26 },
  { delay: 34500, type: 'topic', id: 'motion-road-budget', stateChange: 'DETECTED' },
];

export function buildDemoTopicsMap() {
  const map = new Map();
  DEMO_TOPICS.forEach(t => map.set(t.normalized_id, t));
  return map;
}

// Build initial state (everything visible at once — for instant demo)
export function buildDemoTopicsMapInstant() {
  return buildDemoTopicsMap();
}
