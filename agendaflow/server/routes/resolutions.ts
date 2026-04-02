import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/resolutions', (req, res) => {
  try {
    const db = getDB();
    const resolutions = db.prepare(
      `SELECT r.*, ai.title as item_title FROM resolutions r JOIN agenda_items ai ON r.agenda_item_id = ai.id WHERE ai.meeting_id = ?`
    ).all(req.params.id);
    res.json(resolutions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/resolutions', (req, res) => {
  try {
    const db = getDB();
    const year = new Date().getFullYear();
    const { agenda_item_id, text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail } = req.body;

    // Auto-generate resolution number
    const last = db.prepare(
      `SELECT resolution_number FROM resolutions WHERE resolution_year = ? ORDER BY resolution_number DESC LIMIT 1`
    ).get(year) as any;

    let num = 1;
    if (last) {
      const parts = last.resolution_number.split('-');
      num = parseInt(parts[1] || '0') + 1;
    }
    const resolution_number = `${year}-${String(num).padStart(3, '0')}`;

    const result = db.prepare(
      `INSERT INTO resolutions (agenda_item_id, resolution_number, resolution_year, text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail) VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(agenda_item_id, resolution_number, year, text, moved_by, seconded_by, vote_result, recorded_vote ? 1 : 0, recorded_vote_detail ? JSON.stringify(recorded_vote_detail) : null);

    const resolution = db.prepare('SELECT * FROM resolutions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(resolution);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/resolutions/:id', (req, res) => {
  try {
    const db = getDB();
    const { text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail } = req.body;
    db.prepare(
      `UPDATE resolutions SET text=COALESCE(?,text), moved_by=COALESCE(?,moved_by), seconded_by=COALESCE(?,seconded_by), vote_result=COALESCE(?,vote_result), recorded_vote=COALESCE(?,recorded_vote), recorded_vote_detail=COALESCE(?,recorded_vote_detail) WHERE id=?`
    ).run(text, moved_by, seconded_by, vote_result, recorded_vote !== undefined ? (recorded_vote ? 1 : 0) : null, recorded_vote_detail ? JSON.stringify(recorded_vote_detail) : null, req.params.id);

    const resolution = db.prepare('SELECT * FROM resolutions WHERE id = ?').get(req.params.id);
    res.json(resolution);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
