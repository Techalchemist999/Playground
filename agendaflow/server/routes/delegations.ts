import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/delegations', (req, res) => {
  try {
    const db = getDB();
    const delegations = db.prepare(
      `SELECT d.*, ai.title as item_title FROM delegations d JOIN agenda_items ai ON d.agenda_item_id = ai.id WHERE ai.meeting_id = ?`
    ).all(req.params.id);
    res.json(delegations);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/delegations', (req, res) => {
  try {
    const db = getDB();
    const { agenda_item_id, delegate_name, organization, topic, time_allocated_minutes, presentation_attached } = req.body;

    const result = db.prepare(
      `INSERT INTO delegations (agenda_item_id, delegate_name, organization, topic, time_allocated_minutes, presentation_attached) VALUES (?,?,?,?,?,?)`
    ).run(agenda_item_id, delegate_name, organization, topic, time_allocated_minutes || 5, presentation_attached ? 1 : 0);

    const delegation = db.prepare('SELECT * FROM delegations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(delegation);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/delegations/:id', (req, res) => {
  try {
    const db = getDB();
    const { delegate_name, organization, topic, time_allocated_minutes, presentation_attached } = req.body;
    db.prepare(
      `UPDATE delegations SET delegate_name=COALESCE(?,delegate_name), organization=COALESCE(?,organization), topic=COALESCE(?,topic), time_allocated_minutes=COALESCE(?,time_allocated_minutes), presentation_attached=COALESCE(?,presentation_attached) WHERE id=?`
    ).run(delegate_name, organization, topic, time_allocated_minutes, presentation_attached !== undefined ? (presentation_attached ? 1 : 0) : null, req.params.id);

    const delegation = db.prepare('SELECT * FROM delegations WHERE id = ?').get(req.params.id);
    res.json(delegation);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
