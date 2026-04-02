export type MeetingType = 'regular' | 'special' | 'closed' | 'committee_of_whole';
export type MeetingStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: number;
  type: MeetingType;
  title: string;
  date: string;
  time: string;
  location: string;
  status: MeetingStatus;
  purpose?: string;
  notice_sent_at?: string;
  quorum_required: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export type AgendaSection = 'call_to_order' | 'adoption_of_agenda' | 'adoption_of_minutes' | 'delegations' | 'reports' | 'bylaws' | 'new_business' | 'unfinished_business' | 'information_items' | 'questions' | 'adjournment';
export type AgendaItemType = 'staff_report' | 'bylaw' | 'resolution' | 'delegation' | 'information' | 'correspondence' | 'motion';
export type AgendaItemStatus = 'draft' | 'ready' | 'deferred' | 'tabled' | 'approved' | 'defeated' | 'received';

export interface AgendaItem {
  id: number;
  meeting_id: number;
  section: AgendaSection;
  item_number: string;
  title: string;
  type: AgendaItemType;
  presenter?: string;
  recommendation?: string;
  body_text?: string;
  status: AgendaItemStatus;
  is_confidential: boolean;
  is_late_item: boolean;
  late_item_rationale?: string;
  estimated_minutes?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  agenda_item_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export type BylawStatus = 'active' | 'deferred' | 'tabled' | 'defeated' | 'adopted';
export interface Bylaw {
  id: number;
  agenda_item_id: number;
  bylaw_number: string;
  title: string;
  reading_number: 1 | 2 | 3 | 4;
  status: BylawStatus;
  linked_bylaw_id?: number;
}

export type VoteResult = 'carried' | 'defeated' | 'carried_unanimously' | 'tied';
export interface Resolution {
  id: number;
  agenda_item_id: number;
  resolution_number: string;
  resolution_year: number;
  text: string;
  moved_by?: string;
  seconded_by?: string;
  vote_result?: VoteResult;
  recorded_vote: boolean;
  recorded_vote_detail?: Record<string, 'yes' | 'no' | 'abstain'>;
}

export interface Delegation {
  id: number;
  agenda_item_id: number;
  delegate_name: string;
  organization?: string;
  topic: string;
  time_allocated_minutes: number;
  presentation_attached: boolean;
}

export type MinutesStatus = 'draft' | 'reviewed' | 'adopted';
export interface Minutes {
  id: number;
  meeting_id: number;
  draft_text: string;
  status: MinutesStatus;
  adopted_at?: string;
  adopted_by_resolution_id?: number;
  certified_at?: string;
  certified_by?: string;
}

export const SECTION_ORDER: { key: AgendaSection; label: string }[] = [
  { key: 'call_to_order', label: 'Call to Order' },
  { key: 'adoption_of_agenda', label: 'Adoption of Agenda' },
  { key: 'adoption_of_minutes', label: 'Adoption of Minutes' },
  { key: 'delegations', label: 'Delegations' },
  { key: 'unfinished_business', label: 'Unfinished Business' },
  { key: 'reports', label: 'Reports' },
  { key: 'bylaws', label: 'Bylaws' },
  { key: 'new_business', label: 'New Business' },
  { key: 'information_items', label: 'Information Items' },
  { key: 'questions', label: 'Question Period' },
  { key: 'adjournment', label: 'Adjournment' },
];

export const PROTECTED_SECTIONS: AgendaSection[] = ['call_to_order', 'adjournment'];

export const RECOMMENDATION_TEMPLATES = [
  'THAT Council receive this report for information.',
  'THAT Council approve the recommendation as presented.',
  'THAT Council give {bylaw} first reading.',
  'THAT Council give {bylaw} second reading.',
  'THAT Council give {bylaw} third and final reading.',
  'THAT Council adopt {bylaw}.',
  'THAT Council refer the matter to {committee} for review and report.',
  'THAT Council table the matter pending {reason}.',
  'THAT Council direct staff to {action}.',
];
