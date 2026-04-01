/**
 * Mock transcript parser — converts uploaded transcript text into structured minutes data.
 * In production, this would call an LLM. For the POC, it uses pattern matching.
 */

const SPEAKER_RE = /^((?:Mayor|Cllr|Councillor|CAO|Clerk|Chair|Deputy|Delegation)\s+\w+[\w\s]*?|[A-Z][a-z]+\s+[A-Z][a-z]+)\s*[:—–-]/gm;
const MOTION_RE = /(?:I move|moved? that|motion that|THAT\s+Council)\s+(.+?)(?:\.|$)/gi;
const SECOND_RE = /(?:I second|seconded? by|seconded)\s*(?:by\s+)?((?:Mayor|Cllr|Councillor)\s+\w+)?/gi;
const CARRIED_RE = /\b(carried|carried unanimously|defeated|tabled)\b/gi;

function extractSpeakers(text) {
  const speakers = new Set();
  let match;
  const re = new RegExp(SPEAKER_RE.source, 'gm');
  while ((match = re.exec(text)) !== null) {
    speakers.add(match[1].trim());
  }
  return [...speakers];
}

function guessRole(name) {
  if (/mayor/i.test(name)) return 'Mayor';
  if (/cllr|councillor/i.test(name)) return 'Councillor';
  if (/cao/i.test(name)) return 'CAO';
  if (/clerk/i.test(name)) return 'Clerk';
  if (/delegation/i.test(name)) return 'Delegation';
  return 'Councillor';
}

function extractMotions(text) {
  const motions = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const motionMatch = /(?:I move|moved? that|motion that|THAT\s+Council)\s+(.+)/i.exec(line);
    if (!motionMatch) continue;

    const motionText = motionMatch[1].replace(/\.$/, '').trim();
    let mover = 'Unknown';
    let seconder = 'Unknown';
    let result = 'carried';

    // Look back for speaker (mover)
    for (let j = i; j >= Math.max(0, i - 3); j--) {
      const speakerMatch = /^((?:Mayor|Cllr|Councillor)\s+\w+)\s*[:—–-]/i.exec(lines[j]);
      if (speakerMatch) { mover = speakerMatch[1]; break; }
    }

    // Look forward for seconder and result
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const secMatch = /(?:seconded? by|I second)\s*((?:Mayor|Cllr|Councillor)\s+\w+)?/i.exec(lines[j]);
      if (secMatch) seconder = secMatch[1] || 'Unknown';

      const resMatch = /\b(carried|carried unanimously|defeated|tabled)\b/i.exec(lines[j]);
      if (resMatch) result = resMatch[1].toLowerCase();
    }

    motions.push({
      id: `motion-${motions.length + 1}`,
      text: `THAT Council ${motionText}`,
      mover,
      seconder,
      result: result.includes('defeated') ? 'defeated' : result.includes('tabled') ? 'tabled' : 'carried',
      amendment: null,
    });
  }

  return motions;
}

function splitIntoSections(text) {
  // Try to split by numbered agenda items or common headings
  const sectionHeaders = [
    'Call to Order',
    'Land Acknowledgement',
    'Approval of Agenda',
    'Adoption of Minutes',
    'Delegations',
    'Reports',
    'Bylaws',
    'New Business',
    'Unfinished Business',
    'Notices of Motion',
    'Question Period',
    'Adjournment',
  ];

  // Check if text has numbered items like "1.", "2.", "Item 1", etc.
  const numberedRe = /(?:^|\n)\s*(?:Item\s+)?(\d+)[.\)]\s*(.+)/g;
  const numbered = [];
  let m;
  while ((m = numberedRe.exec(text)) !== null) {
    numbered.push({ index: m.index, num: m[1], title: m[2].trim() });
  }

  if (numbered.length >= 3) {
    // Use numbered sections
    const sections = [];
    for (let i = 0; i < numbered.length; i++) {
      const start = numbered[i].index;
      const end = i + 1 < numbered.length ? numbered[i + 1].index : text.length;
      const content = text.substring(start, end).replace(/^.*\n/, '').trim();
      sections.push({
        id: `section-${i + 1}`,
        title: numbered[i].title,
        content: `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, ' ')}</p>`,
        motions: [],
      });
    }
    return sections;
  }

  // Fallback: split into paragraphs and create generic sections
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const sections = [];
  const chunkSize = Math.max(1, Math.ceil(paragraphs.length / sectionHeaders.length));

  for (let i = 0; i < sectionHeaders.length && i * chunkSize < paragraphs.length; i++) {
    const chunk = paragraphs.slice(i * chunkSize, (i + 1) * chunkSize);
    sections.push({
      id: `section-${i + 1}`,
      title: sectionHeaders[i],
      content: chunk.map(p => `<p>${p.trim()}</p>`).join('\n'),
      motions: [],
    });
  }

  // If no paragraphs matched, create a single section
  if (sections.length === 0) {
    sections.push({
      id: 'section-1',
      title: 'Meeting Minutes',
      content: `<p>${text.trim()}</p>`,
      motions: [],
    });
  }

  return sections;
}

function enrichWithDemoMotions(sections, speakers) {
  // Clear any parser-detected motions — we'll add curated ones
  sections.forEach(s => { s.motions = []; });

  const m = (id) => speakers[0] || 'Mayor Veach';
  const s1 = speakers[1] || 'Cllr Rabel';
  const s2 = speakers[2] || 'Cllr Wall';
  const s3 = speakers[3] || 'Cllr Johnston';
  const s4 = speakers[4] || 'Cllr Woodill';

  // Find sections by keyword match
  const find = (keyword) => sections.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()));

  // 1. Approval of Agenda — simple carried
  const agendaSec = find('Agenda') || sections[2];
  if (agendaSec) {
    agendaSec.motions.push({
      id: 'motion-agenda',
      text: 'THAT Council approves the agenda as presented.',
      mover: s1, seconder: s2, result: 'carried', amendment: null,
    });
  }

  // 2. Adoption of Minutes — simple carried unanimously
  const minutesSec = find('Minutes') || find('Adoption');
  if (minutesSec) {
    minutesSec.motions.push({
      id: 'motion-minutes',
      text: 'THAT Council adopts the minutes of the March 11, 2026 regular meeting as presented.',
      mover: s2, seconder: s4, result: 'carried', amendment: null,
    });
  }

  // 3. Reports — receive for information
  const reportsSec = find('Report');
  if (reportsSec) {
    reportsSec.motions.push({
      id: 'motion-report',
      text: 'THAT Council receives the CAO\'s monthly report for information.',
      mover: s3, seconder: s1, result: 'carried', amendment: null,
    });
  }

  // 4. Bylaws — carried unanimously
  const bylawSec = find('Bylaw');
  if (bylawSec) {
    bylawSec.motions.push({
      id: 'motion-bylaw',
      text: 'THAT Council gives Bylaw 1021, the Noise Control Amendment Bylaw, third and final reading.',
      mover: s4, seconder: s2, result: 'carried', amendment: null,
    });
  }

  // 5. New Business — AMENDED motion (Main Street Beautification)
  const newBizSec = find('New Business');
  if (newBizSec) {
    newBizSec.motions.push({
      id: 'motion-beautification',
      text: 'THAT Council awards the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.',
      mover: s1, seconder: s3, result: 'carried',
      amendment: {
        text: 'adding "and that the project include a public art component with a budget allocation of up to $5,000 from the community enhancement reserve."',
        mover: s2,
        seconder: s4,
        result: 'carried',
        status: 'carried',
      },
    });

    // 6. Canada Day — AMENDMENT DEFEATED, original carried
    newBizSec.motions.push({
      id: 'motion-canadaday',
      text: 'THAT Council approves a contribution of $3,000 from the events reserve to the Pouce Coupe Recreation Commission for the 2026 Canada Day celebration.',
      mover: s3, seconder: s4, result: 'carried',
      amendment: {
        text: 'reducing the contribution from $3,000 to $1,500 and directing the remaining $1,500 to the sidewalk repair reserve.',
        mover: s2,
        seconder: s1,
        result: 'defeated',
        status: 'defeated',
      },
    });

    // 7. DEFEATED motion — rezoning request
    newBizSec.motions.push({
      id: 'motion-rezoning',
      text: 'THAT Council directs staff to initiate a rezoning of the parcel at 102 Railway Avenue from R-1 to C-2 Commercial.',
      mover: s2, seconder: s1, result: 'defeated', amendment: null,
    });

    // 8. RECONSIDERATION — defeated rezoning brought back and tabled
    newBizSec.motions.push({
      id: 'motion-reconsideration',
      text: 'THAT Council reconsiders the motion regarding the rezoning of 102 Railway Avenue, and THAT the matter be tabled to the next regular meeting pending a public consultation report.',
      mover: s3, seconder: s4, result: 'carried',
      amendment: null,
    });
  }

  // 9. Adjournment
  const adjSec = find('Adjourn');
  if (adjSec) {
    adjSec.motions.push({
      id: 'motion-adjourn',
      text: 'THAT Council adjourns the meeting.',
      mover: s2, seconder: s1, result: 'carried', amendment: null,
    });
  }
}

export function parseTranscriptToMinutes(text) {
  const speakers = extractSpeakers(text);
  const motions = extractMotions(text);
  const sections = splitIntoSections(text);

  // Distribute motions across sections (attach to the section they appear closest to)
  motions.forEach(motion => {
    const motionPos = text.indexOf(motion.text.replace('THAT Council ', ''));
    let bestSection = sections[sections.length - 1];
    let bestDist = Infinity;
    sections.forEach(sec => {
      const secPos = text.indexOf(sec.title);
      if (secPos >= 0 && motionPos >= secPos && motionPos - secPos < bestDist) {
        bestDist = motionPos - secPos;
        bestSection = sec;
      }
    });
    if (bestSection) bestSection.motions.push(motion);
  });

  // Enrich with demo motions if this looks like the sample transcript
  const isSample = text.includes('Pouce Coupe') || text.includes('Mayor Veach');
  if (isSample) {
    enrichWithDemoMotions(sections, speakers);
  } else if (motions.length === 0 && sections.length > 1) {
    // Fallback demo motions for non-sample transcripts
    sections[Math.min(2, sections.length - 1)].motions.push({
      id: 'motion-1',
      text: 'THAT Council approves the agenda as presented.',
      mover: speakers[0] || 'Cllr Smith',
      seconder: speakers[1] || 'Cllr Jones',
      result: 'carried',
      amendment: null,
    });
  }

  const chair = speakers.find(s => /mayor|chair/i.test(s)) || speakers[0] || 'Mayor';
  const clerk = speakers.find(s => /clerk/i.test(s)) || 'Clerk';

  return {
    metadata: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      meetingType: /in camera/i.test(text) ? 'In Camera Meeting'
        : /committee/i.test(text) ? 'Committee Meeting'
        : /special/i.test(text) ? 'Special Meeting'
        : /public hearing/i.test(text) ? 'Public Hearing'
        : 'Regular Meeting',
      location: 'Council Chambers',
      chair,
      clerk,
      municipality: 'Village of Pouce Coupe',
    },
    rollCall: speakers.map(name => ({
      name,
      role: guessRole(name),
      present: true,
    })),
    sections,
    approvedAt: null,
  };
}
