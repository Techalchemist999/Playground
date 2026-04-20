/**
 * Mock transcript parser — converts uploaded transcript text into structured minutes data.
 * In production, this would call an LLM. For the POC, it uses pattern matching.
 */

const SPEAKER_RE = /^((?:Mayor|Cllr|Councillor|CAO|Clerk|Chair|Deputy|Delegation)\s+\w+[\w\s]*?|[A-Z][a-z]+\s+[A-Z][a-z]+)\s*[:—–-]/gm;
const MOTION_RE = /(?:I move|moved? that|motion that|THAT\s+Council)\s+(.+?)(?:\.|$)/gi;
const SECOND_RE = /(?:I second|seconded? by|seconded)\s*(?:by\s+)?((?:Mayor|Cllr|Councillor)\s+\w+)?/gi;
const CARRIED_RE = /\b(carried|carried unanimously|defeated|tabled)\b/gi;

// Normalize "Cllr" → "Councillor" for formal minutes output
function normalizeName(name) {
  return name.replace(/\bCllr\b/gi, 'Councillor');
}

function extractSpeakers(text) {
  const speakers = new Set();
  let match;
  const re = new RegExp(SPEAKER_RE.source, 'gm');
  while ((match = re.exec(text)) !== null) {
    speakers.add(normalizeName(match[1].trim()));
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

const DEFAULT_ROLL_CALL = [
  { name: 'Mayor Danielle Veach', role: 'Mayor', present: true },
  { name: 'Councillor Kurtis Rabel', role: 'Councillor', present: true },
  { name: 'Councillor James Wall', role: 'Councillor', present: true },
  { name: 'Councillor Raymond Johnston', role: 'Councillor', present: true },
  { name: 'Councillor Marcel Woodill', role: 'Councillor', present: true },
  { name: 'CAO/CO Duncan Malkinson', role: 'Staff', present: true },
  { name: 'NDIT Intern Jimmy Ho', role: 'Staff', present: true },
];

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
      if (speakerMatch) { mover = normalizeName(speakerMatch[1]); break; }
    }

    // Look forward for seconder and result
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const secMatch = /(?:seconded? by|I second)\s*((?:Mayor|Cllr|Councillor)\s+\w+)?/i.exec(lines[j]);
      if (secMatch) seconder = secMatch[1] ? normalizeName(secMatch[1]) : 'Unknown';

      const resMatch = /\b(carried|carried unanimously|defeated|tabled)\b/i.exec(lines[j]);
      if (resMatch) result = resMatch[1].toLowerCase();
    }

    motions.push({
      id: `motion-${motions.length + 1}`,
      text: `THAT Council ${motionText}`,
      mover,
      seconder,
      result: result.includes('defeated') ? 'defeated'
        : result.includes('tabled') ? 'tabled'
        : result.includes('unanimously') ? 'carried unanimously'
        : 'carried',
      subsidiary: null,
    });
  }

  return motions;
}

function splitIntoSections(text) {
  // Try to split by numbered agenda items or common headings
  const sectionHeaders = [
    'Call to Order',
    'Land Acknowledgement',
    'Adoption of Agenda',
    'Adoption of Minutes',
    'Introduction of Late Items',
    'Public Hearing',
    'Delegations',
    'Unfinished Business and Business Arising from the Minutes',
    'New Business',
    'Resolutions',
    'Correspondence',
    'Bylaws',
    'Administration Reports',
    'Reports',
    'Question Period',
    'In-Camera',
    'Rise and Report',
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
    const sections = [];
    for (let i = 0; i < numbered.length; i++) {
      const start = numbered[i].index;
      const end = i + 1 < numbered.length ? numbered[i + 1].index : text.length;
      // Strip the numbered header line itself (e.g. "\n4. Adoption of Previous Minutes\n")
      // so section.content only contains discussion, not a repeat of the section title.
      const content = text.substring(start, end).replace(/^\s*\d+[.\)]\s*[^\n]*\n?/, '').trim();
      sections.push({
        id: `section-${i + 1}`,
        title: numbered[i].title,
        content: `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, ' ')}</p>`,
        motions: [],
        subItems: [],
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
      subItems: [],
    });
  }

  // If no paragraphs matched, create a single section
  if (sections.length === 0) {
    sections.push({
      id: 'section-1',
      title: 'Meeting Minutes',
      content: `<p>${text.trim()}</p>`,
      motions: [],
      subItems: [],
    });
  }

  return sections;
}

function enrichWithDemoMotions(sections, speakers) {
  // Clear any parser-detected motions — we'll add curated ones
  sections.forEach(s => { s.motions = []; });

  const m = (id) => speakers[0] || 'Mayor Veach';
  const s1 = speakers[1] || 'Councillor Rabel';
  const s2 = speakers[2] || 'Councillor Wall';
  const s3 = speakers[3] || 'Councillor Johnston';
  const s4 = speakers[4] || 'Councillor Woodill';

  // Full council — used as the default IN FAVOR roster for unanimous motions.
  const allCouncil = 'Mayor Veach, Councillor Rabel, Councillor Wall, Councillor Johnston, Councillor Woodill';

  // Find sections by keyword match
  const find = (keyword) => sections.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()));

  // Helper to create a motion object
  const mot = (id, text, mover, seconder, result, subsidiary) => ({
    id, text, mover, seconder,
    result: result || 'carried unanimously',
    inFavor: allCouncil,
    opposed: '',
    absent: '',
    subsidiary: subsidiary || null,
  });

  // --- Sections with DIRECT motions (no sub-items) ---

  // Adoption of Agenda — direct motion
  const agendaSec = find('Adoption of Agenda') || find('Agenda') || sections[2];
  if (agendaSec) {
    agendaSec.motions.push(mot('motion-agenda',
      'THAT Council adopt the March 25, 2026 Regular Council Meeting Agenda, as presented.',
      m(), s3));
  }

  // Adjournment — direct motion
  const adjSec = find('Adjourn');
  if (adjSec) {
    adjSec.content = '<p>The Regular Council Meeting on March 25, 2026 was adjourned at 9:15 PM.</p>';
    adjSec.motions.push(mot('motion-adjourn',
      'THAT Council adjourn the meeting.', s2, s1));
  }

  // --- Sections with SUB-ITEMS ---

  // Delegations — sub-items (each delegation as a sub-item, like Adoption of Minutes)
  const delegSec = find('Delegation');
  if (delegSec) {
    delegSec.subItems = [
      {
        id: 'sub-deleg-1',
        title: 'Delegation \u2014 Sarah Chen, South Peace Community Foundation',
        content: 'Sarah Chen presented on the South Peace Community Foundation\u2019s 2026 granting program. The Foundation awarded $142,000 in grants to community organizations in 2025. The 2026 intake is now open, with a focus on youth mental health and infrastructure for seniors. The active living grant stream (up to $25,000 for infrastructure, $10,000 for programming) was highlighted as a potential fit for the proposed trail expansion project. Applications close May 15.',
        motions: [],
      },
    ];
    // Clear the parent section's prose content — everything now lives in sub-items
    delegSec.content = '';
  }

  // Adoption of Minutes — sub-items
  const minutesSec = find('Adoption of Minutes') || find('Minutes');
  if (minutesSec) {
    minutesSec.subItems = [
      {
        id: 'sub-min-1', title: 'March 11, 2026 Regular Council Meeting Minutes',
        content: '', motions: [mot('motion-min-1',
          'THAT Council adopt the March 11, 2026 Regular Council Meeting Minutes, as presented.',
          m(), s2)],
      },
      {
        id: 'sub-min-2', title: 'February 25, 2026 Committee of the Whole Meeting Minutes',
        content: '', motions: [mot('motion-min-2',
          'THAT Council adopt the February 25, 2026 Committee of the Whole Minutes, as presented.',
          m(), s4)],
      },
    ];
  }

  // Unfinished Business — sub-items
  const unfBizSec = find('Unfinished') || find('Business Arising');
  if (unfBizSec) {
    unfBizSec.subItems = [
      {
        id: 'sub-cao', title: 'CAO Monthly Report',
        content: '', motions: [mot('motion-report',
          "THAT Council receive the CAO's monthly report for information.",
          s3, s1)],
      },
    ];
  }

  // New Business — sub-items
  const newBizSec = find('New Business');
  if (newBizSec) {
    newBizSec.subItems = [
      {
        id: 'sub-beautification', title: 'Main Street Beautification Project',
        content: '', motions: [mot('motion-beautification',
          'THAT Council award the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.',
          s1, s3, 'carried unanimously', {
            type: 'amend',
            text: 'adding "and that the project include a public art component with a budget allocation of up to $5,000 from the community enhancement reserve."',
            mover: s2, seconder: s4, result: 'carried', status: 'carried',
            inFavor: 'Mayor Veach, Councillor Wall, Councillor Johnston, Councillor Woodill',
            opposed: 'Councillor Rabel',
            absent: '',
          })],
      },
      {
        id: 'sub-canadaday', title: 'Canada Day Celebration Funding',
        content: '', motions: [mot('motion-canadaday',
          'THAT Council approve a contribution of $3,000 from the events reserve to the Pouce Coupe Recreation Commission for the 2026 Canada Day celebration.',
          s3, s4, 'carried unanimously', {
            type: 'amend',
            text: 'reducing the contribution from $3,000 to $1,500 and directing the remaining $1,500 to the sidewalk repair reserve.',
            mover: s2, seconder: s1, result: 'defeated', status: 'defeated',
            inFavor: 'Councillor Wall, Councillor Rabel',
            opposed: 'Mayor Veach, Councillor Johnston, Councillor Woodill',
            absent: '',
          })],
      },
      {
        id: 'sub-rezoning', title: 'Rezoning \u2014 102 Railway Avenue',
        content: '', motions: [mot('motion-rezoning',
          'THAT Council direct staff to initiate a rezoning of the parcel at 102 Railway Avenue from R-1 to C-2 Commercial.',
          s2, s1, 'defeated')],
      },
      {
        id: 'sub-reconsider', title: 'Reconsideration \u2014 102 Railway Avenue Rezoning',
        content: '', motions: [mot('motion-reconsideration',
          'THAT Council reconsider the motion regarding the rezoning of 102 Railway Avenue, and THAT the matter be tabled to the next regular meeting pending a public consultation report.',
          s3, s4)],
      },
    ];
  }

  // Correspondence — direct motion + sub-items
  const corrSec = find('Correspondence');
  if (corrSec) {
    corrSec.motions.push(mot('motion-correspondence',
      'THAT Council receive the correspondence items for information.', m(), s4));
  }

  // Bylaws — sub-items
  const bylawSec = find('Bylaw');
  if (bylawSec) {
    bylawSec.subItems = [
      {
        id: 'sub-bylaw', title: 'Noise Control Amendment Bylaw No. 1021, 2026',
        content: '', motions: [mot('motion-bylaw',
          'THAT Council adopt the "Noise Control Amendment Bylaw No. 1021, 2026," as presented.',
          s4, s2)],
      },
    ];
  }

  // Reports — sub-items with discussion only (no motions)
  const reportsSec = find('Reports');
  if (reportsSec) {
    reportsSec.subItems = [
      { id: 'sub-rpt-1', title: 'Councillor Johnston Report', content: 'Reported attending the community event and noted good turnout.', motions: [] },
      { id: 'sub-rpt-2', title: 'Councillor Rabel Report', content: 'Reported reviewing Bill M216 in detail.', motions: [] },
      { id: 'sub-rpt-3', title: 'Mayor Veach Report', content: 'Reported meeting with staff to review preliminary 2026 budget figures.', motions: [] },
    ];
  }

  // ─── Every remaining section gets a single sub-item so all sections
  //     share the same "X.1 title → discussion → motion" structure ───
  const wrapIntoSubItem = (sec, title, fallbackContent) => {
    if (!sec || (sec.subItems && sec.subItems.length > 0)) return;
    const stripped = (sec.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    sec.subItems = [{
      id: `sub-${sec.id}`,
      title,
      content: stripped || fallbackContent || '',
      motions: sec.motions || [],
    }];
    sec.content = '';
    sec.motions = [];
  };

  wrapIntoSubItem(find('Call to Order'), 'Meeting Called to Order at 7:00 PM');
  wrapIntoSubItem(find('Land Acknow'), 'Territorial Land Acknowledgement');
  wrapIntoSubItem(find('Adoption of Agenda') || find('Approval of Agenda'), 'March 25, 2026 Regular Council Meeting Agenda');
  wrapIntoSubItem(find('Correspondence'), 'Correspondence Received');
  wrapIntoSubItem(find('Notices of Motion'), 'Notices of Motion');
  wrapIntoSubItem(find('Question Period'), 'Council Question Period');
  wrapIntoSubItem(find('Late Items') || find('Introduction of Late Items'), 'Introduction of Late Items');
  wrapIntoSubItem(find('Public Hearing'), 'Public Hearing');
  wrapIntoSubItem(find('In-Camera') || find('In Camera'), 'In-Camera Session');
  wrapIntoSubItem(find('Rise and Report'), 'Rise and Report');
  wrapIntoSubItem(find('Resolutions'), 'Resolutions');
  wrapIntoSubItem(find('Administration'), 'Administration Report');
  wrapIntoSubItem(find('Adjourn'), 'Meeting Adjourned at 8:23 PM');
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
      mover: speakers[0] || 'Councillor Smith',
      seconder: speakers[1] || 'Councillor Jones',
      result: 'carried',
      subsidiary: null,
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
    rollCall: DEFAULT_ROLL_CALL.map(entry => ({ ...entry })),
    sections,
    approvedAt: null,
  };
}
