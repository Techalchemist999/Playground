import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/delegations', (req, res) => {
  try {
    res.json(queryAll(
      `SELECT d.*, ai.title as item_title FROM delegations d JOIN agenda_items ai ON d.agenda_item_id = ai.id WHERE ai.meeting_id = ?`,
      [Number(req.params.id)]
    ));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/delegations', (req, res) => {
  try {
    const { agenda_item_id, delegate_name, organization, topic, time_allocated_minutes, presentation_attached } = req.body;
    const { lastId } = execute(
      `INSERT INTO delegations (agenda_item_id, delegate_name, organization, topic, time_allocated_minutes, presentation_attached) VALUES (?,?,?,?,?,?)`,
      [agenda_item_id, delegate_name, organization || null, topic, time_allocated_minutes || 5, presentation_attached ? 1 : 0]
    );
    res.status(201).json(queryOne('SELECT * FROM delegations WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/delegations/:id', (req, res) => {
  try {
    const { delegate_name, organization, topic, time_allocated_minutes, presentation_attached } = req.body;
    execute(
      `UPDATE delegations SET delegate_name=COALESCE(?,delegate_name), organization=COALESCE(?,organization), topic=COALESCE(?,topic), time_allocated_minutes=COALESCE(?,time_allocated_minutes), presentation_attached=COALESCE(?,presentation_attached) WHERE id=?`,
      [delegate_name, organization, topic, time_allocated_minutes, presentation_attached !== undefined ? (presentation_attached ? 1 : 0) : null, Number(req.params.id)]
    );
    res.json(queryOne('SELECT * FROM delegations WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
