import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

// List agenda items for a meeting
router.get('/meetings/:id/agenda-items', (req, res) => {
  try {
    const db = getDB();
    const items = db.prepare('SELECT * FROM agenda_items WHERE meeting_id = ? ORDER BY sort_order ASC').all(req.params.id);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create agenda item
router.post('/meetings/:id/agenda-items', (req, res) => {
  try {
    const db = getDB();
    const { section, title, type, presenter, recommendation, body_text, status, is_confidential, is_late_item, late_item_rationale, estimated_minutes, sort_order } = req.body;

    // Auto-number: count existing items in this section
    const count = db.prepare('SELECT COUNT(*) as c FROM agenda_items WHERE meeting_id = ? AND section = ?').get(req.params.id, section) as any;
    const itemNumber = String(sort_order || count.c + 1);

    const result = db.prepare(
      `INSERT INTO agenda_items (meeting_id, section, item_number, title, type, presenter, recommendation, body_text, status, is_confidential, is_late_item, late_item_rationale, estimated_minutes, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.params.id, section, itemNumber, title, type || 'motion', presenter, recommendation, body_text, status || 'draft', is_confidential ? 1 : 0, is_late_item ? 1 : 0, late_item_rationale, estimated_minutes, sort_order || 0);

    const item = db.prepare('SELECT * FROM agenda_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update agenda item
router.put('/agenda-items/:id', (req, res) => {
  try {
    const db = getDB();
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
      params.push(req.params.id);
      db.prepare(`UPDATE agenda_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const item = db.prepare('SELECT * FROM agenda_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete agenda item
router.delete('/agenda-items/:id', (req, res) => {
  try {
    const db = getDB();
    const item = db.prepare('SELECT * FROM agenda_items WHERE id = ?').get(req.params.id) as any;
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.section === 'call_to_order' || item.section === 'adjournment') {
      return res.status(400).json({ message: 'Cannot delete Call to Order or Adjournment sections' });
    }
    db.prepare('DELETE FROM agenda_items WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Reorder items
router.post('/agenda-items/reorder', (req, res) => {
  try {
    const db = getDB();
    const { items } = req.body;
    const stmt = db.prepare('UPDATE agenda_items SET sort_order = ? WHERE id = ?');
    const tx = db.transaction((list: any[]) => {
      for (const item of list) stmt.run(item.sort_order, item.id);
    });
    tx(items);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
