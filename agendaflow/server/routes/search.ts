import { Router } from 'express';
import { queryAll } from '../db/index.js';

const router = Router();

router.get('/search', (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const meetings = queryAll(`SELECT * FROM meetings WHERE title LIKE ? OR location LIKE ? ORDER BY date DESC LIMIT 20`, [q, q]);
    const items = queryAll(`SELECT ai.*, m.title as meeting_title FROM agenda_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE ai.title LIKE ? OR ai.body_text LIKE ? OR ai.recommendation LIKE ? ORDER BY ai.created_at DESC LIMIT 30`, [q, q, q]);
    res.json({ meetings, items });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/items/pending', (req, res) => {
  try {
    res.json(queryAll(`SELECT ai.*, m.title as meeting_title, m.date as meeting_date FROM agenda_items ai JOIN meetings m ON ai.meeting_id = m.id WHERE ai.status IN ('tabled', 'deferred') ORDER BY m.date DESC`));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
