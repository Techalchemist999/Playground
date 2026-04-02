CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('regular','special','closed','committee_of_whole')),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL DEFAULT '19:00',
  location TEXT NOT NULL DEFAULT 'Council Chambers',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','in_progress','completed','cancelled')),
  purpose TEXT,
  notice_sent_at TEXT,
  quorum_required INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agenda_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK(section IN ('call_to_order','adoption_of_agenda','adoption_of_minutes','delegations','reports','bylaws','new_business','unfinished_business','information_items','questions','adjournment')),
  item_number TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'motion' CHECK(type IN ('staff_report','bylaw','resolution','delegation','information','correspondence','motion')),
  presenter TEXT,
  recommendation TEXT,
  body_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','deferred','tabled','approved','defeated','received')),
  is_confidential INTEGER NOT NULL DEFAULT 0,
  is_late_item INTEGER NOT NULL DEFAULT 0,
  late_item_rationale TEXT,
  estimated_minutes INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agenda_item_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agenda_item_id INTEGER NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bylaws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agenda_item_id INTEGER NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  bylaw_number TEXT NOT NULL,
  title TEXT NOT NULL,
  reading_number INTEGER NOT NULL CHECK(reading_number IN (1,2,3,4)),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','deferred','tabled','defeated','adopted')),
  linked_bylaw_id INTEGER REFERENCES bylaws(id)
);

CREATE TABLE IF NOT EXISTS resolutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agenda_item_id INTEGER NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  resolution_number TEXT NOT NULL,
  resolution_year INTEGER NOT NULL,
  text TEXT NOT NULL,
  moved_by TEXT,
  seconded_by TEXT,
  vote_result TEXT CHECK(vote_result IN ('carried','defeated','carried_unanimously','tied')),
  recorded_vote INTEGER NOT NULL DEFAULT 0,
  recorded_vote_detail TEXT
);

CREATE TABLE IF NOT EXISTS delegations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agenda_item_id INTEGER NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  delegate_name TEXT NOT NULL,
  organization TEXT,
  topic TEXT NOT NULL,
  time_allocated_minutes INTEGER NOT NULL DEFAULT 5,
  presentation_attached INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS minutes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  draft_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','adopted')),
  adopted_at TEXT,
  adopted_by_resolution_id INTEGER REFERENCES resolutions(id),
  certified_at TEXT,
  certified_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting ON agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_section ON agenda_items(section);
CREATE INDEX IF NOT EXISTS idx_agenda_items_status ON agenda_items(status);
CREATE INDEX IF NOT EXISTS idx_bylaws_item ON bylaws(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_item ON resolutions(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_year ON resolutions(resolution_year);
CREATE INDEX IF NOT EXISTS idx_delegations_item ON delegations(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_attachments_item ON agenda_item_attachments(agenda_item_id);
