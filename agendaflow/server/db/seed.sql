-- Meetings
INSERT INTO meetings (id, type, title, date, time, location, status, quorum_required) VALUES
  (1, 'regular', 'Regular Council Meeting', '2026-04-02', '19:00', 'Council Chambers', 'draft', 3),
  (2, 'special', 'Special Meeting — Budget Review', '2026-03-28', '14:00', 'Council Chambers', 'published', 3),
  (3, 'closed', 'Closed Session — Personnel', '2026-03-25', '18:00', 'Committee Room', 'completed', 3);

-- Update special meeting purpose
UPDATE meetings SET purpose = 'Review and approval of 2026 supplementary budget estimates' WHERE id = 2;

-- Regular Council agenda items (13 items)
INSERT INTO agenda_items (meeting_id, section, item_number, title, type, presenter, recommendation, status, estimated_minutes, sort_order) VALUES
  (1, 'call_to_order', '1', 'Call to Order', 'information', 'Mayor Veach', NULL, 'ready', 1, 1),
  (1, 'adoption_of_agenda', '2', 'Adoption of Agenda', 'motion', NULL, 'THAT Council adopts the agenda as presented.', 'ready', 2, 2),
  (1, 'adoption_of_minutes', '3', 'Adoption of Minutes — March 11, 2026', 'motion', NULL, 'THAT Council adopts the minutes of the March 11, 2026 regular meeting as presented.', 'ready', 2, 3),
  (1, 'delegations', '4', 'Northern Landscapes — Main Street Project', 'delegation', 'Sarah Chen, Northern Landscapes', NULL, 'ready', 10, 4),
  (1, 'bylaws', '5', 'Public Hearing — Bylaw 1021 Noise Control Amendment', 'bylaw', 'CAO Williams', 'THAT Council give Bylaw 1021, the Noise Control Amendment Bylaw, third and final reading.', 'ready', 15, 5),
  (1, 'bylaws', '6', 'Bylaw 1022 — Zoning Amendment, 102 Railway Ave', 'bylaw', 'Planner Davis', 'THAT Council give Bylaw 1022, the Zoning Amendment Bylaw, first reading.', 'ready', 10, 6),
  (1, 'reports', '7', 'CAO Monthly Report', 'staff_report', 'CAO Williams', 'THAT Council receive this report for information.', 'ready', 10, 7),
  (1, 'reports', '8', 'Financial Report — Q1 2026', 'staff_report', 'CFO Thompson', 'THAT Council receive the Q1 2026 financial report for information.', 'ready', 15, 8),
  (1, 'new_business', '9', 'Main Street Beautification Contract Award', 'resolution', NULL, 'THAT Council awards the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.', 'ready', 10, 9),
  (1, 'new_business', '10', 'Canada Day Celebration Funding', 'resolution', NULL, 'THAT Council approves a contribution of $3,000 from the events reserve to the Recreation Commission for the 2026 Canada Day celebration.', 'ready', 10, 10),
  (1, 'information_items', '11', 'Correspondence — Provincial Infrastructure Grant', 'correspondence', NULL, NULL, 'ready', 3, 11),
  (1, 'questions', '12', 'Question Period', 'information', NULL, NULL, 'ready', 5, 12),
  (1, 'adjournment', '13', 'Adjournment', 'motion', NULL, 'THAT Council adjourns the meeting.', 'ready', 1, 13);

-- Special Meeting items
INSERT INTO agenda_items (meeting_id, section, item_number, title, type, presenter, recommendation, status, estimated_minutes, sort_order) VALUES
  (2, 'call_to_order', '1', 'Call to Order', 'information', 'Mayor Veach', NULL, 'ready', 1, 1),
  (2, 'reports', '2', 'Supplementary Budget Estimates — 2026', 'staff_report', 'CFO Thompson', 'THAT Council approve the 2026 supplementary budget estimates as presented.', 'ready', 30, 2),
  (2, 'new_business', '3', 'Roads Maintenance Budget Amendment', 'resolution', NULL, 'THAT Council approves the budget amendment to increase the roads maintenance allocation by $25,000 from the general reserve.', 'ready', 15, 3),
  (2, 'adjournment', '4', 'Adjournment', 'motion', NULL, NULL, 'ready', 1, 4);

-- Closed session items
INSERT INTO agenda_items (meeting_id, section, item_number, title, type, status, is_confidential, estimated_minutes, sort_order) VALUES
  (3, 'call_to_order', '1', 'Call to Order', 'information', 'approved', 1, 1, 1),
  (3, 'new_business', '2', 'Personnel Matter — Senior Staff Review', 'staff_report', 'approved', 1, 30, 2),
  (3, 'adjournment', '3', 'Adjournment', 'motion', 'approved', 1, 1, 3);

-- Bylaws
INSERT INTO bylaws (agenda_item_id, bylaw_number, title, reading_number, status) VALUES
  (5, '1021', 'Noise Control Amendment Bylaw', 3, 'active'),
  (6, '1022', 'Zoning Amendment Bylaw — 102 Railway Avenue', 1, 'active');

-- Resolutions
INSERT INTO resolutions (agenda_item_id, resolution_number, resolution_year, text, moved_by, seconded_by, vote_result) VALUES
  (9, '2026-001', 2026, 'THAT Council awards the Main Street Beautification Project contract to Northern Landscapes in the amount of $78,500.', 'Cllr Rabel', 'Cllr Johnston', 'carried_unanimously'),
  (10, '2026-002', 2026, 'THAT Council approves a contribution of $3,000 from the events reserve to the Recreation Commission for the 2026 Canada Day celebration.', 'Cllr Johnston', 'Cllr Woodill', 'carried'),
  (16, '2026-003', 2026, 'THAT Council approves the budget amendment to increase the roads maintenance allocation by $25,000 from the general reserve.', 'Cllr Johnston', 'Cllr Rabel', 'defeated');

-- Delegations
INSERT INTO delegations (agenda_item_id, delegate_name, organization, topic, time_allocated_minutes, presentation_attached) VALUES
  (4, 'Sarah Chen', 'Northern Landscapes Inc.', 'Main Street Beautification Project — Design Presentation', 10, 1);
