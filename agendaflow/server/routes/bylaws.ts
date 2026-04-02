import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/bylaws', (req, res) => {
  try {
    const db = getDB();
    const bylaws = db.prepare(
      `SELECT b.*, ai.title as item_title, ai.section FROM bylaws b JOIN agenda_items ai ON b.agenda_item_id = ai.id WHERE ai.meeting_id = ?`
    ).all(req.params.id);
    res.json(bylaws);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/bylaws', (req, res) => {
  try {
    const db = getDB();
    const { agenda_item_id, bylaw_number, title, reading_number, status, linked_bylaw_id } = req.body;

    // Warn if adoption without 3 prior readings
    if (reading_number === 4) {
      const readings = db.prepare(
        `SELECT DISTINCT reading_number FROM bylaws WHERE bylaw_number = ? AND reading_number < 4`
      ).all(bylaw_number) as any[];
      if (readings.length < 3) {
        return res.status(400).json({
          message: `Warning: Bylaw ${bylaw_number} has only ${readings.length} prior reading(s). 3 readings required before adoption.`,
          warning: true,
        });
      }
    }

    const result = db.prepare(
      `INSERT INTO bylaws (agenda_item_id, bylaw_number, title, reading_number, status, linked_bylaw_id) VALUES (?,?,?,?,?,?)`
    ).run(agenda_item_id, bylaw_number, title, reading_number, status || 'active', linked_bylaw_id || null);

    const bylaw = db.prepare('SELECT * FROM bylaws WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(bylaw);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/bylaws/:id', (req, res) => {
  try {
    const db = getDB();
    const { reading_number, status, linked_bylaw_id } = req.body;
    db.prepare(
      `UPDATE bylaws SET reading_number=COALESCE(?,reading_number), status=COALESCE(?,status), linked_bylaw_id=COALESCE(?,linked_bylaw_id) WHERE id=?`
    ).run(reading_number, status, linked_bylaw_id, req.params.id);

    const bylaw = db.prepare('SELECT * FROM bylaws WHERE id = ?').get(req.params.id);
    res.json(bylaw);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
