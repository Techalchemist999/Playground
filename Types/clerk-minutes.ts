// ============================================================
// Clerk 2.0 — Minutes Generation Types
// ============================================================
//
// Scope: the draft meeting-minutes DOCUMENT that a clerk assembles
// and edits. Not live-meeting / on-the-floor state.
//
// Every decision point Jessica needs to redline is tagged `[REDLINE]`.
// Every type here is backed by a field that actually exists in
// the CivicPulse minutes-generation UI — nothing invented.
// ============================================================


// ─── Meeting Metadata ─────────────────────────────────────────

export type MeetingBody =
	| "Council"
	| "Committee"
	| "Committee of the Whole"
	| "Board of Variance"
	| "Public Hearing";

export type MeetingModality = "Regular" | "Special";

export type MeetingAccess = "Open" | "In Camera";

export type MeetingType = {
	body: MeetingBody;
	modality?: MeetingModality;    // absent only for Public Hearing
};

export type MinutesMetadata = {
	municipality: OrganizationName;
	meetingType: MeetingType;
	schedule: MeetingSchedule;
	location: LocationName;
	chair: PersonRef;
	clerk: PersonRef;
};


// ─── Roll Call / Attendees ────────────────────────────────────

export type Attendee = {
	person: PersonRef;
	present: boolean;
	regrets?: boolean;          // true = absence with advance notice (only meaningful when present = false)
	arrivedAt?: TimeString;     // only when present = true and the person arrived late
	departedAt?: TimeString;    // only when present = true and the person left before adjournment
};


// ─── Disposition ──────────────────────────────────────────────

export type Disposition =
	| "carried"
	| "carried unanimously"
	| "defeated"
	| "tabled"
	| "withdrawn";

export type SubDisposition =
	| "referred"
	| "postponed"
	| "deferred"
	| "rescinded"
	| "reconsidered";


// ─── Recusal (Conflict of Interest) ───────────────────────────

export type Recusal = {
	person: PersonRef;
	reason: string;                      // disclosure stated on the record, e.g. "Applicant is my employer"
	leftRoom?: boolean;                  // true = physically left for the vote; false/absent = remained in the room
};


// ─── Amendment (Nested, Recursive) ────────────────────────────

export type Amendment = {
	id: Uid;
	text: SpanText;
	mover: PersonRef;
	seconder: PersonRef;
	status: Disposition;
	resolutionNumber?: DocumentNumber;   // populated when numbering mode is "start-at" or "continue-from-last"
	inFavor: PersonRef[];
	opposed: PersonRef[];
	absent: PersonRef[];                 // members physically not present for the vote
	recusals?: Recusal[];                // members who recused themselves — must NOT also appear in `absent`
	abstentions?: PersonRef[];           // members present but declined to vote, no conflict stated
	amendments?: Amendment[];            // recursive — amendments to this amendment
};


// ─── Subsidiary (Non-Amendment Procedural Motion) ─────────────

export type SubsidiaryType =
	| "postpone"
	| "refer"
	| "defer"
	| "table"
	| "withdraw"
	| "previous-question";

export type Subsidiary = {
	type: SubsidiaryType;
	text: SpanText;
	mover: PersonRef;
	seconder: PersonRef;
	status: Disposition;
	resolutionNumber?: DocumentNumber;   // populated when numbering mode is "start-at" or "continue-from-last"
	inFavor: PersonRef[];
	opposed: PersonRef[];
	absent: PersonRef[];                 // members physically not present for the vote
	recusals?: Recusal[];                // members who recused themselves — must NOT also appear in `absent`
	abstentions?: PersonRef[];           // members present but declined to vote, no conflict stated
};


// ─── Motion ──────────────────────────────────────────────────

export type MotionId = string;            // [REDLINE] reuse Traces' `Uid`?

export type Motion = {
	id: MotionId;
	text: SpanText;
	mover: PersonRef;
	seconder: PersonRef;
	result: Disposition;
	resolutionNumber?: DocumentNumber;   // populated when numbering mode is "start-at" or "continue-from-last"
	inFavor: PersonRef[];
	opposed: PersonRef[];
	absent: PersonRef[];                 // members physically not present for the vote
	recusals?: Recusal[];                // members who recused themselves — must NOT also appear in `absent`
	abstentions?: PersonRef[];           // members present but declined to vote, no conflict stated
	amendments: Amendment[];             // 0 or more; each has its own vote
	subsidiaries: Subsidiary[];          // 0 or more non-amendment procedural motions (refer, table, etc.)
};


// ─── Sub-Item  (e.g. "4.1 Main Street Beautification") ───────

export type SubItemId = string;

export type SubItem = {
	id: SubItemId;
	title: DocumentTitle;
	content: SpanText;                   // Narrative/discussion text; can be empty
	motions: Motion[];
	manualNumber?: DocumentNumber;       // Optional override for auto "8.1", "8.2" → "7a", "A-3"
};


// ─── Section  (e.g. "3. ADOPTION OF AGENDA") ─────────────────

export type SectionId = string;

export type Section = {
	id: SectionId;
	title: DocumentTitle;
	content: SpanText;                   // Section-level discussion text; can be empty
	motions: Motion[];                   // Direct motions that have no sub-item parent
	subItems: SubItem[];
};


// ─── Approval / Sign-Off ──────────────────────────────────────

export type MinutesApproval = {
	chairperson: PersonRef;
	officer: PersonRef;            // Corporate officer / clerk who signs off
	approvedAt: ISODate | null;          // null until approved
};


// ─── Resolution Numbering & Meeting Templates ─────────────────

export type ResolutionNumberFormat = string;
// Template string with tokens:
//   YYYY  → 4-digit year
//   ###   → zero-padded incrementing counter
// Default system formats (applied at runtime by MeetingType + MeetingAccess):
//   "YYYY-###"     open regular
//   "IC-YYYY-###"  in camera
//   "C-YYYY-###"   committee

export type MeetingTemplate = {
	templateId: Uid;
	name: string;                                // e.g. "Regular Council — Open"
	meetingType: MeetingType;                    // which meeting type this template applies to
	resolutionNumberFormat?: ResolutionNumberFormat;   // overrides the system default
};

export type ResolutionNumbering =
	| { mode: "start-at"; startNumber: DocumentNumber }    // clerk enters first number manually
	| { mode: "continue-from-last" }                        // system continues from prior meeting of the same MeetingType
	| { mode: "none" };                                     // no numbering applied


// ─── Minutes Document (top-level) ─────────────────────────────

export type MinutesDocument = {
	metadata: MinutesMetadata;
	rollCall: Attendee[];
	sections: Section[];
	approval: MinutesApproval;
	access: MeetingAccess;
	resolutionNumbering: ResolutionNumbering;
	templateId?: Uid;                            // which MeetingTemplate applies; absent = use system default for MeetingType + access
};
// [REDLINE] Traces already has a type named `Minutes` — but there it represents
// a SINGLE motion artifact (one motion + its disposition). This type here is a
// WHOLE meeting's draft minutes document — different scope. Recommend the name
// `MinutesDocument` (used above) to avoid collision. Alternatives: `DraftMinutes`,
// `MinutesFile`, `MeetingMinutes`.


// ============================================================
// Types.ts — Canonical Type Definitions
// ============================================================
//
// Authoritative frontend type specification aligned with the
// backend data model. Organized by domain concern.
// ============================================================


// ─── Primitives & Domain Aliases ──────────────────────────────

// ── Scores ──
export type Score = number;              // Normalized 0–1 relevance/match score
export type OccurrenceCount = number;    // Non-negative count of mentions/documents/items
export type VoteCount = number;          // Non-negative vote tally
export type PageNumber = number;         // 1-based page reference within a document

// ── Persons ──
export type PersonName = string;         // Display name, may include title ("Mayor Michetti", "Gary Nason, Interim CAO")
export type RoleTitle = string;          // Functional role or title: "CAO", "Director of Finance"

export type PersonRef = {                // Lightweight reference: id + display name
	personId: Uid;
	name: PersonName;
};

export type CommitteeRole = "Chair" | "Vice-Chair" | "Member";

export type CommitteeMembership = {
	committee: string;                   // committee name, freeform
	role: CommitteeRole;
};

export type PersonRole =
	| { personId: Uid; category: "Elected Official"; body: "Council"; role: "Mayor" | "Councillor"; committees?: CommitteeMembership[] }
	| { personId: Uid; category: "Elected Official"; body: "Board"; role: "Chair" | "Director"; committees?: CommitteeMembership[] }
	| { personId: Uid; category: "Staff"; position: RoleTitle; committees?: CommitteeMembership[] }
	| { personId: Uid; category: "Appointed Member"; committees: CommitteeMembership[] };

// ── Dates & Times ──
export type ISODate = string;            // "YYYY-MM-DD" calendar date
export type YearMonth = string;          // "YYYY-MM" month bucket (timeline aggregation)
export type TimeString = string;         // Non-ISO display time: "7:00 p.m.", "10:30 AM"
export type SignificanceNote = string;   // Brief description of why a date matters
export type DateReference = {            // A date with its contextual significance
	date: ISODate;
	significance: SignificanceNote;
};

export type MeetingSchedule = {
	date: ISODate;
	scheduledStartTime: TimeString;
	actualStartTime?: TimeString;          // often later than scheduled
	endTime?: TimeString;                  // set when adjourned
	recesses?: { start: TimeString; end: TimeString }[];
};

// ── Financial ──
export type CurrencyAmount = number;             // Numeric currency value
export type FormattedCurrency = string;          // Display string: "$25,000", "$1,500.00"
export type FinancialDescription = string;       // What the amount pertains to
export type FinancialFigure = {
	amount: CurrencyAmount;
	formatted?: FormattedCurrency;
	description?: FinancialDescription;
};

// ── Locations & Organizations ──
export type LocationName = string;       // Named place: "Council Chambers", "Pouce Coupe"
export type OrganizationName = string;   // Named org: "Village of Pouce Coupe", "UBCM"
export type DepartmentName = string;     // Organizational department: "Planning", "Public Works"

export type OrganizationKind =
	| "Municipality"
	| "Township"
	| "County"
	| "Regional District"
	| "Regional Municipality"
	| "Improvement District"
	| "Local Service District";

export type Organization = {
	name: OrganizationName;
	kind: OrganizationKind;
};

// ── Documents ──
export type DocumentTitle = string;      // Display title: bylaw title, policy title, artifact title, report subject
export type DocumentNumber = string;     // Official identifier: bylaw number ("2024-001"), policy number ("FIN-003")
export type SectionNumber = string;      // Section/clause reference: "3.1", "IV", clause_number
export type FileName = string;           // Source file name
export type DocumentContent = string;    // Raw document body/contents

// ── Text Extractions ──
export type SpanText = string;           // Extracted text span from a document (motion, agenda item, provision, recommendation)
export type ContextSummary = string;     // Backend tags[].context_summary — AI-generated contextual summary
export type SearchQuery = string;        // User-entered search/chat query text
export type UserAnnotation = string;     // User-provided free-text note (userContext, userTitle)

// ─── Topic Taxonomy ─── Category > Subcategory > Canonical > Topic ───

// ── Base UID ──
export type Uid = string;

// ── Hierarchy Primitives ──
export type CategoryName = string;
export type CategoryUid = Uid;
export type SubcategoryName = string;
export type SubcategoryUid = Uid;
export type CanonicalName = string;
export type CanonicalUid = Uid;
export type TopicName = string;

// ── Hierarchy Nodes (top to bottom — clear one-to-many relationships) ──

export type Category = {
	name: CategoryName;
	uid: CategoryUid;
	subcategories: SubcategoryUid[];
};

export type Subcategory = {
	name: SubcategoryName;
	uid: SubcategoryUid;
	category: CategoryUid;
	canonicals: CanonicalUid[];
};

export type Canonical = {
	name: CanonicalName;
	uid: CanonicalUid;
	subcategory: SubcategoryUid;
	topics: Topic[];
};

export type Topic = {
	name: TopicName;
	occurrenceCount: OccurrenceCount;
};

// ── Topic Search (GET /topic-graph/autocomplete) ──

export type TopicMatchTarget = TopicName | CanonicalName | null;

export type TopicSearchResult = Canonical & {
	score: Score;                         // Blended relevance score (0–1)
	fulltextScore: Score;                 // Raw fulltext component
	matchedOn: TopicMatchTarget;          // Which name matched the query
};

export type TopicSearchResponse = {
	query: SearchQuery;
	total: OccurrenceCount;
	results: TopicSearchResult[];
};


// ─── Topic Timelines (discriminated union) ────────────────────

// Per-source mention counts within a single month
export type SourceMentionCounts = Partial<Record<ArtifactType, OccurrenceCount>>;

export type MonthlyMentionBreakdown = {
	month: YearMonth;
	total: OccurrenceCount;               // Sum across all sources for this month
	bySource: SourceMentionCounts;        // Per-source breakdown
};

// ── Timeline Bodies (mode-specific payloads) ──
// Invariant: matchedAliases ⊆ Canonical.topics[].name (not enforceable at type level)
// Invariant: totalMentions = Σ monthlyCounts[].total (not enforceable at type level)

export type ActiveTimelineItem = Canonical & {
	matchedAliases: TopicName[];
	totalMentions: OccurrenceCount;
	monthlyCounts: MonthlyMentionBreakdown[];
};

export type RecurringTimelineItem = Canonical & {
	matchedAliases: TopicName[];
	totalMentions: OccurrenceCount;
	maxAcf: Score;                        // Peak autocorrelation coefficient
	bestLag: OccurrenceCount;             // Lag period in months for best ACF
	seriesLength: OccurrenceCount;        // Dense monthly series length
	monthlyCounts: MonthlyMentionBreakdown[];
};

export type RichTimelineItem = Canonical & {
	matchedAliases: TopicName[];
	datasetCount: OccurrenceCount;        // Number of distinct dataset types
	distinctDocuments: OccurrenceCount;   // Total unique documents
	sourceTypes: ArtifactType[];          // Which source types contain this topic
	monthlyCounts: MonthlyMentionBreakdown[];
};

// Discriminated union — mirrors ArtifactVariant pattern
export type TopicTimelineVariant =
	| { mode: "active"; timelineItems: ActiveTimelineItem[] }
	| { mode: "recurring"; timelineItems: RecurringTimelineItem[] }
	| { mode: "rich"; timelineItems: RichTimelineItem[] };

export type TopicTimelineResponse = {
	resolvedCount: OccurrenceCount;
	totalAliases: OccurrenceCount;
	items: TopicTimelineVariant;
};


// ─── Traces ─────────────────────────────────────────────────

export type SearchTrace = {
	traceSummary: SearchTraceSummary;
	artifacts: SearchArtifact[];
};

export type SavedTrace = {
	traceSummary: SavedTraceSummary;
	artifacts: SavedArtifact[];
};


// ─── Trace Summaries ────────────────────────────────────────

export type SearchTraceSummary = {
	traceTitle: TraceTitle;
	lastRefreshDate: Date;
	traceTimeline: TraceTimeline;
};

export type SavedTraceSummary = {
	userTitle: UserAnnotation;
	lastRefreshDate: Date;
	traceTimeline: TraceTimeline;
	userContext: UserAnnotation;
};

export type TraceTitle = string;


// ─── Trace Timelines ──────────────────────────────────────────

export type TraceTimeline = {
	canonicals: Canonical[];
	artifactTypes: ArtifactType[];
	artifactsByDate: [Date, SearchArtifact | SavedArtifact, ArtifactType][];
};


// ─── Artifacts ──────────────────────────────────────────────

export type Artifact = ArtifactVariant & {
	context: ContextSummary;
};

export type SearchArtifact = Artifact & {
	source: ArtifactSource;
	title: DocumentTitle;
};

export type SavedArtifact = Artifact & {
	source: ArtifactSource;
	title: DocumentTitle;
	userContext: UserAnnotation;
};


// ─── Artifact Variant (discriminated union) ─────────────────

// Backend source_type — derived from ArtifactVariant

export type ArtifactVariant =
	| { artifactType: "Minutes"; content: Minutes }
	| { artifactType: "StaffReport"; content: StaffReport }
	| { artifactType: "Agenda"; content: Agenda }
	| { artifactType: "Bylaw"; content: Bylaw }
	| { artifactType: "Policy"; content: Policy }
	| { artifactType: "Ordinance"; content: Ordinance }
	| { artifactType: "ConsolidatedBylaw"; content: ConsolidatedBylaw }
	| { artifactType: "MunicipalCodeSection"; content: MunicipalCodeSection };

export type ArtifactSource = {
	fileName: FileName;
	contents: DocumentContent;
	date?: Date;
};

export type ArtifactType = ArtifactVariant["artifactType"];


// ─── Enums & Literal Types ─────────────────────────────────


export type BylawStatus = "InForce" | "Repealed";
export type PolicyOrResolutionStatus = "Active" | "Repealed";


// ─── Artifact Bodies ────────────────────────────────────────

export type Minutes = {
	motion: SpanText;
	motioners: Motioners;
	disposition: Disposition;
	meetingType: MeetingType;
	subDisposition?: SubDisposition;
	opposer?: PersonRef;
	votes?: VoteCount;
	motionType?: MotionType;
};

export type Motioners = {
	movedBy: PersonRef;
	secondedBy: PersonRef;
};

export type MotionType =
	| "StandardMotion"
	| "PrivilegedMotion"
	| "Amendment"
	| "Resolution"
	| "ConsentAgenda";



export type StaffReport = {
	meetingType: MeetingType;
	recommendation: SpanText;
	author?: PersonRef;
	department?: DepartmentName;
	subject?: DocumentTitle;
	reportDate?: ISODate;
	memoTo?: PersonRef;
	persons?: PersonRef[];
	organizations?: OrganizationName[];
	locations?: LocationName[];
	dateReferences?: DateReference[];
	financialFigures?: FinancialFigure[];
	pageNumber?: PageNumber;
	clauseNumber?: SectionNumber;
};


export type Agenda = {
	item: SpanText;
	meetingType: MeetingType;
	itemType?: AgendaItemType;
	time?: TimeString;
	location?: LocationName;
};

export type AgendaItemType =
	| "CallToOrder"
	| "AgendaAdoption"
	| "MinutesAdoption"
	| "PublicHearing"
	| "Delegation"
	| "UnfinishedBusiness"
	| "NewBusiness"
	| "Correspondence"
	| "Resolution"
	| "BylawReading"
	| "AdministrationReport"
	| "CouncillorReport"
	| "InCamera"
	| "QuestionPeriod"
	| "RiseAndReport"
	| "Adjournment"
	| "LateIntroduction";


export type BylawOrOrdinance = {
	name: DocumentTitle;
	status: BylawStatus;
	clauses: Clause[];
	number?: DocumentNumber;
	municipality?: OrganizationName;
	firstReadingDate?: ISODate;
	secondReadingDate?: ISODate;
	thirdReadingDate?: ISODate;
	adoptedDate?: ISODate;
	statutoryHearingDate?: ISODate;
	electorApprovalDate?: ISODate;
};

export type Bylaw = BylawOrOrdinance;
export type Ordinance = BylawOrOrdinance;

export type ConsolidatedBylaw = {
	bylaws: Bylaw[];
	versionNumber?: DocumentNumber;
	updatedToDate?: ISODate;
};

export type MunicipalCodeSection = {
	municipalCodeName: DocumentTitle;
	sectionNumber: SectionNumber;
	sectionTitle: DocumentTitle;
	subsections?: MunicipalCodeSection[];
	provision?: SpanText;
	citedOrdinances?: Ordinance[];
	citedAmendments?: Amendment[];
	municipality?: OrganizationName;
	effectiveDate?: ISODate;
};

export type Amendment =
	| BylawOrOrdinance
	| Resolution;

export type Resolution = {
	resolutionName: DocumentTitle;
	resolutionStatus: PolicyOrResolutionStatus;
	clauses: Clause[];
	resolutionNumber?: DocumentNumber;
	department?: DepartmentName;
	dateAdopted?: ISODate;
	dateAmended?: ISODate;
};

export type Clause = {
	section: SectionNumber;
	title: DocumentTitle;
	provision: SpanText;
	bylaws?: Bylaw[];
};


export type Policy = {
	policyName: DocumentTitle;
	policyStatus: PolicyOrResolutionStatus;
	clauses: Clause[];
	policyNumber?: DocumentNumber;
	department?: DepartmentName;
	dateAdopted?: ISODate;
	dateAmended?: ISODate;
};


// ─── Chat Types ─────────────────────────────────────────────

export type Chat = {
	chatHistory: ChatHistory;
	chatInput: ChatInput;
};

export type ChatHistory = {
	messages: ChatMessage[];
};

export type ChatMessage =
	| { role: "user"; content: string }
	| { role: "assistant"; content: string }
	| { role: "assistant"; content: SearchTrace[] };

export type ChatInput =
	| { mode: "prompt"; query: SearchQuery }
	| { mode: "advanced"; query: SearchQuery; dateRange?: [Date, Date]; artifactType?: ArtifactVariant["artifactType"] };
