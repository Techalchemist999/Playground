// Hardcoded demo data for UI testing — Village of Pouce Coupe council meeting
// Includes: regular motions (carried/defeated), amendments (carried/defeated)

export const DEMO_AGENDA_ITEMS = [
  { number: 1, title: 'Call to Order', description: 'Mayor Veach calls the meeting to order', status: 'discussed' },
  { number: 2, title: 'Adoption of Agenda', description: 'Motion to adopt the agenda as presented', status: 'discussed' },
  { number: 3, title: 'Adoption of Minutes — Feb 10, 2025', description: 'Regular council meeting minutes', status: 'discussed' },
  { number: 4, title: 'Delegation — Pine Ave Residents', description: 'Presentation re: drainage concerns on Pine Avenue', status: 'discussed' },
  { number: 5, title: 'Bylaw 1021 — Third Reading', description: 'Council Procedure Bylaw — final adoption (amendment proposed)', status: 'active' },
  { number: 6, title: 'Water Rate Increase — 2025', description: 'Staff report on proposed 4.5% rate adjustment', status: 'pending' },
  { number: 7, title: 'Road Maintenance Budget', description: 'Review of spring grading and patching program', status: 'pending' },
  { number: 8, title: 'Park Improvement Grant Application', description: 'NDIT grant for playground equipment replacement', status: 'pending' },
  { number: 9, title: 'Zoning Amendment — Pine Ave', description: 'Rezone 4820 Pine Ave from R1 to R2', status: 'pending' },
  { number: 10, title: 'CAO Report', description: 'Monthly operational update from Chief Administrative Officer', status: 'pending' },
  { number: 11, title: 'New Business', status: 'pending' },
  { number: 12, title: 'In-Camera (Closed Session)', description: 'Personnel matter per Community Charter s.90', status: 'pending' },
  { number: 13, title: 'Adjournment', status: 'pending' },
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
    mover: 'Cllr Rabel',
    seconder: 'Cllr Johnston',
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
    mover: 'Cllr Wall',
    seconder: 'Cllr Woodill',
    motionText: 'THAT Council adopts the minutes of the February 10, 2025 regular meeting as presented.',
    votes: ['yes','yes','yes','yes','yes'],
    amendment: null,
  },

  // Motion 3: Bylaw 1021 — AMENDMENT CARRIED
  // Amendment adds section 14 re: public consultation
  {
    normalized_id: 'motion-bylaw-1021',
    label: 'Bylaw 1021 — Third Reading',
    category: 'motion',
    state: 'ACTIVE',
    mention_count: 3,
    decay_score: 0.9,
    mover: 'Cllr Rabel',
    seconder: 'Cllr Wall',
    motionText: 'THAT Council gives Bylaw 1021 third and final reading.',
    votes: ['yes','yes','yes', null, null],
    amendment: {
      status: 'carried', // 'pending' | 'voting' | 'carried' | 'defeated'
      text: '...with the addition of section 14 regarding public consultation requirements.',
      mover: 'Cllr Wall',
      seconder: 'Cllr Johnston',
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
    state: 'DETECTED',
    mention_count: 1,
    decay_score: 0.6,
    mover: 'Mayor Veach',
    seconder: 'Cllr Rabel',
    motionText: 'THAT Council approves a 4.5% water rate increase effective July 1, 2025.',
    votes: [null, null, null, null, null],
    amendment: {
      status: 'defeated',
      text: '...reducing the increase from 4.5% to 3.0%.',
      mover: 'Cllr Johnston',
      seconder: 'Cllr Woodill',
      votes: ['no','no','yes','yes','no'],
      result: 'Defeated 2-3',
    },
  },

  // Motion 5: Road Budget — simple, awaiting vote (no amendment)
  {
    normalized_id: 'motion-road-budget',
    label: 'Road Maintenance Budget',
    category: 'motion',
    state: 'DETECTED',
    mention_count: 1,
    decay_score: 0.4,
    mover: 'Cllr Johnston',
    seconder: null,
    motionText: 'THAT Council approves the 2025 road maintenance budget of $142,000 as presented.',
    votes: [null, null, null, null, null],
    amendment: null,
  },
];

export const DEMO_TRANSCRIPT = [
  { speaker: 'Mayor Veach', text: 'I\'d like to call this meeting of the Village of Pouce Coupe council to order. It is 7:02 PM. We have a quorum present.', timestamp: '19:02:00' },
  { speaker: 'Mayor Veach', text: 'Can I have a motion to adopt the agenda as presented?', timestamp: '19:02:15' },
  { speaker: 'Cllr Rabel', text: 'I move to adopt the agenda.', timestamp: '19:02:22' },
  { speaker: 'Cllr Johnston', text: 'Seconded.', timestamp: '19:02:25' },
  { speaker: 'Mayor Veach', text: 'All in favour? Carried unanimously.', timestamp: '19:02:35' },
  { speaker: 'Cllr Wall', text: 'I move we adopt the minutes of February 10th as presented.', timestamp: '19:02:50' },
  { speaker: 'Cllr Woodill', text: 'I\'ll second that.', timestamp: '19:02:55' },
  { speaker: 'Mayor Veach', text: 'All in favour? Carried. Now we have a delegation from Pine Avenue.', timestamp: '19:03:10' },
  { speaker: 'Delegation', text: 'Thank you Mayor and Council. We represent twelve households on Pine Avenue experiencing drainage issues over the past two winters.', timestamp: '19:03:30' },
  { speaker: 'CAO', text: 'We did an assessment last fall. The ditch needs regrading — approximately $18,000, within the existing roads budget.', timestamp: '19:05:20' },
  { speaker: 'Mayor Veach', text: 'Moving on to item 5. Bylaw 1021, third reading.', timestamp: '19:06:30' },
  { speaker: 'Cllr Rabel', text: 'I move that Council give Bylaw 1021, the Council Procedure Bylaw, third and final reading.', timestamp: '19:06:50' },
  { speaker: 'Cllr Wall', text: 'Seconded.', timestamp: '19:06:58' },
  { speaker: 'Cllr Wall', text: 'Before we vote, I\'d like to propose an amendment. I move that we amend the motion to add section 14 regarding public consultation requirements.', timestamp: '19:07:10' },
  { speaker: 'Cllr Johnston', text: 'I\'ll second that amendment.', timestamp: '19:07:18' },
  { speaker: 'Mayor Veach', text: 'We have an amendment on the floor. We\'ll deal with the amendment first. Discussion?', timestamp: '19:07:25' },
  { speaker: 'Cllr Rabel', text: 'I think the public consultation clause is a good addition. It strengthens the bylaw.', timestamp: '19:07:40' },
  { speaker: 'Mayor Veach', text: 'All in favour of the amendment? The amendment is carried 4-1. We now return to the main motion as amended.', timestamp: '19:08:00' },
  { speaker: 'Mayor Veach', text: 'The motion now reads: THAT Council gives Bylaw 1021 third reading, with the addition of section 14 regarding public consultation. All in favour?', timestamp: '19:08:20' },
  { speaker: 'Mayor Veach', text: 'Item 6. Water rate increase. Can I have a motion?', timestamp: '19:09:00' },
  { speaker: 'Mayor Veach', text: 'I move that Council approves a 4.5% water rate increase effective July 1, 2025.', timestamp: '19:09:10' },
  { speaker: 'Cllr Rabel', text: 'Seconded.', timestamp: '19:09:15' },
  { speaker: 'Cllr Johnston', text: 'I\'d like to propose an amendment to reduce the increase from 4.5% to 3%.', timestamp: '19:09:30' },
  { speaker: 'Cllr Woodill', text: 'I\'ll second that.', timestamp: '19:09:35' },
  { speaker: 'CAO', text: 'I\'d caution that a 3% increase won\'t cover the infrastructure costs we projected.', timestamp: '19:09:50' },
  { speaker: 'Mayor Veach', text: 'All in favour of the amendment to reduce to 3%? The amendment is defeated 2-3. We return to the original motion at 4.5%.', timestamp: '19:10:10' },
  { speaker: 'Cllr Johnston', text: 'I move that Council approves the 2025 road maintenance budget of $142,000 as presented.', timestamp: '19:11:00' },
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
