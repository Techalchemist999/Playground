import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

router.get('/search', (req, res) => {
  try {
    const db = getDB();
    const q = `%${req.query.q || ''}%`;

    const meetings = db.prepare(
      `SELECT * FROM meetings WHERE title LIKE ? OR location LIKE ? ORDER BY date DESC LIMIT 20`
    ).all(q, q);

    const items = db.prepare(
      `SELECT ai.*, m.title as meeting_title FROM agenda_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE ai.title LIKE ? OR ai.body_text LIKE ? OR ai.recommendation LIKE ? ORDER BY ai.created_at DESC LIMIT 30`
    ).all(q, q, q);

    const bylaws = db.prepare(
      `SELECT b.*, ai.title as item_title FROM bylaws b JOIN agenda_items ai ON b.agenda_item_id = ai.id WHERE b.bylaw_number LIKE ? OR b.title LIKE ? LIMIT 20`
    ).all(q, q);

    const resolutions = db.prepare(
      `SELECT r.*, ai.title as item_title FROM resolutions r JOIN agenda_items ai ON r.agenda_item_id = ai.id WHERE r.resolution_number LIKE ? OR r.text LIKE ? LIMIT 20`
    ).all(q, q);

    res.json({ meetings, items, bylaws, resolutions });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Pending items (tabled/deferred across all meetings)
router.get('/items/pending', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare(
      `SELECT ai.*, m.title as meeting_title, m.date as meeting_date FROM agenda_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE ai.status IN ('tabled', 'deferred') ORDER BY m.date DESC`
    ).all();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
