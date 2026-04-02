import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/bylaws', (req, res) => {
  try {
    res.json(queryAll(
      `SELECT b.*, ai.title as item_title, ai.section FROM bylaws b JOIN agenda_items ai ON b.agenda_item_id = ai.id WHERE ai.meeting_id = ?`,
      [Number(req.params.id)]
    ));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/bylaws', (req, res) => {
  try {
    const { agenda_item_id, bylaw_number, title, reading_number, status, linked_bylaw_id } = req.body;
    if (reading_number === 4) {
      const readings = queryAll(`SELECT DISTINCT reading_number FROM bylaws WHERE bylaw_number = ? AND reading_number < 4`, [bylaw_number]);
      if (readings.length < 3) {
        return res.status(400).json({ message: `Warning: Bylaw ${bylaw_number} has only ${readings.length} prior reading(s). 3 readings required before adoption.`, warning: true });
      }
    }
    const { lastId } = execute(
      `INSERT INTO bylaws (agenda_item_id, bylaw_number, title, reading_number, status, linked_bylaw_id) VALUES (?,?,?,?,?,?)`,
      [agenda_item_id, bylaw_number, title, reading_number, status || 'active', linked_bylaw_id || null]
    );
    res.status(201).json(queryOne('SELECT * FROM bylaws WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/bylaws/:id', (req, res) => {
  try {
    const { reading_number, status, linked_bylaw_id } = req.body;
    execute(
      `UPDATE bylaws SET reading_number=COALESCE(?,reading_number), status=COALESCE(?,status), linked_bylaw_id=COALESCE(?,linked_bylaw_id) WHERE id=?`,
      [reading_number, status, linked_bylaw_id, Number(req.params.id)]
    );
    res.json(queryOne('SELECT * FROM bylaws WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
