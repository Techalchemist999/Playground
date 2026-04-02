import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';

const router = Router();

router.get('/meetings/:id/agenda-items', (req, res) => {
  try {
    res.json(queryAll('SELECT * FROM agenda_items WHERE meeting_id = ? ORDER BY sort_order ASC', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings/:id/agenda-items', (req, res) => {
  try {
    const { section, title, type, presenter, recommendation, body_text, status, is_confidential, is_late_item, late_item_rationale, estimated_minutes, sort_order } = req.body;
    const row = queryOne('SELECT COUNT(*) as c FROM agenda_items WHERE meeting_id = ? AND section = ?', [Number(req.params.id), section]);
    const itemNumber = String(sort_order || (row?.c || 0) + 1);

    const { lastId } = execute(
      `INSERT INTO agenda_items (meeting_id, section, item_number, title, type, presenter, recommendation, body_text, status, is_confidential, is_late_item, late_item_rationale, estimated_minutes, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [Number(req.params.id), section, itemNumber, title, type || 'motion', presenter || null, recommendation || null, body_text || null, status || 'draft', is_confidential ? 1 : 0, is_late_item ? 1 : 0, late_item_rationale || null, estimated_minutes || null, sort_order || 0]
    );
    res.status(201).json(queryOne('SELECT * FROM agenda_items WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/agenda-items/:id', (req, res) => {
  try {
    const fields = ['section', 'item_number', 'title', 'type', 'presenter', 'recommendation', 'body_text', 'status', 'is_confidential', 'is_late_item', 'late_item_rationale', 'estimated_minutes', 'sort_order'];
    const updates: string[] = [];
    const params: any[] = [];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        const val = req.body[field];
        params.push(field === 'is_confidential' || field === 'is_late_item' ? (val ? 1 : 0) : val);
      }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(Number(req.params.id));
      execute(`UPDATE agenda_items SET ${updates.join(', ')} WHERE id = ?`, params);
    }
    res.json(queryOne('SELECT * FROM agenda_items WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/agenda-items/:id', (req, res) => {
  try {
    const item = queryOne('SELECT * FROM agenda_items WHERE id = ?', [Number(req.params.id)]);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.section === 'call_to_order' || item.section === 'adjournment') {
      return res.status(400).json({ message: 'Cannot delete Call to Order or Adjournment sections' });
    }
    execute('DELETE FROM agenda_items WHERE id = ?', [Number(req.params.id)]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/agenda-items/reorder', (req, res) => {
  try {
    const { items } = req.body;
    for (const item of items) {
      execute('UPDATE agenda_items SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
