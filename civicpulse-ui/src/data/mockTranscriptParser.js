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

  // If no motions were found, add some demo ones
  if (motions.length === 0 && sections.length > 1) {
    sections[2].motions.push({
      id: 'motion-1',
      text: 'THAT Council approves the agenda as presented.',
      mover: speakers[0] || 'Cllr Smith',
      seconder: speakers[1] || 'Cllr Jones',
      result: 'carried',
      amendment: null,
    });
    if (sections.length > 4) {
      sections[4].motions.push({
        id: 'motion-2',
        text: 'THAT Council receives the report for information.',
        mover: speakers[1] || 'Cllr Jones',
        seconder: speakers[2] || 'Cllr Brown',
        result: 'carried',
        amendment: null,
      });
    }
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
