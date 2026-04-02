import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/resolutions', (req, res) => {
  try {
    res.json(queryAll(
      `SELECT r.*, ai.title as item_title FROM resolutions r JOIN agenda_items ai ON r.agenda_item_id = ai.id WHERE ai.meeting_id = ?`,
      [Number(req.params.id)]
    ));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/resolutions', (req, res) => {
  try {
    const year = new Date().getFullYear();
    const { agenda_item_id, text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail } = req.body;
    const last = queryOne(`SELECT resolution_number FROM resolutions WHERE resolution_year = ? ORDER BY resolution_number DESC LIMIT 1`, [year]);
    let num = 1;
    if (last) {
      const parts = last.resolution_number.split('-');
      num = parseInt(parts[1] || '0') + 1;
    }
    const resolution_number = `${year}-${String(num).padStart(3, '0')}`;
    const { lastId } = execute(
      `INSERT INTO resolutions (agenda_item_id, resolution_number, resolution_year, text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail) VALUES (?,?,?,?,?,?,?,?,?)`,
      [agenda_item_id, resolution_number, year, text, moved_by || null, seconded_by || null, vote_result || null, recorded_vote ? 1 : 0, recorded_vote_detail ? JSON.stringify(recorded_vote_detail) : null]
    );
    res.status(201).json(queryOne('SELECT * FROM resolutions WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/resolutions/:id', (req, res) => {
  try {
    const { text, moved_by, seconded_by, vote_result, recorded_vote, recorded_vote_detail } = req.body;
    execute(
      `UPDATE resolutions SET text=COALESCE(?,text), moved_by=COALESCE(?,moved_by), seconded_by=COALESCE(?,seconded_by), vote_result=COALESCE(?,vote_result), recorded_vote=COALESCE(?,recorded_vote), recorded_vote_detail=COALESCE(?,recorded_vote_detail) WHERE id=?`,
      [text, moved_by, seconded_by, vote_result, recorded_vote !== undefined ? (recorded_vote ? 1 : 0) : null, recorded_vote_detail ? JSON.stringify(recorded_vote_detail) : null, Number(req.params.id)]
    );
    res.json(queryOne('SELECT * FROM resolutions WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
