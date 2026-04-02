import { Router } from 'express';
import { getDB } from '../db/index.js';

const router = Router();

// List meetings
router.get('/meetings', (req, res) => {
  try {
    const db = getDB();
    let sql = `SELECT m.*, (SELECT COUNT(*) FROM agenda_items WHERE meeting_id = m.id) as item_count FROM meetings m WHERE 1=1`;
    const params: any[] = [];

    if (req.query.type) { sql += ' AND m.type = ?'; params.push(req.query.type); }
    if (req.query.status) { sql += ' AND m.status = ?'; params.push(req.query.status); }
    if (req.query.from) { sql += ' AND m.date >= ?'; params.push(req.query.from); }
    if (req.query.to) { sql += ' AND m.date <= ?'; params.push(req.query.to); }

    sql += ' ORDER BY m.date DESC, m.time DESC';
    const meetings = db.prepare(sql).all(...params);
    res.json(meetings);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get single meeting
router.get('/meetings/:id', (req, res) => {
  try {
    const db = getDB();
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Create meeting
router.post('/meetings', (req, res) => {
  try {
    const db = getDB();
    const { type, title, date, time, location, quorum_required, purpose } = req.body;

    if (type === 'special' && !purpose) {
      return res.status(400).json({ message: 'Special meetings require a purpose field' });
    }

    const result = db.prepare(
      `INSERT INTO meetings (type, title, date, time, location, quorum_required, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(type, title || `${type} Meeting`, date, time || '19:00', location || 'Council Chambers', quorum_required || 3, purpose || null);

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);

    // Auto-create Call to Order + Adjournment
    db.prepare(`INSERT INTO agenda_items (meeting_id, section, item_number, title, type, status, sort_order) VALUES (?, 'call_to_order', '1', 'Call to Order', 'information', 'ready', 1)`).run(result.lastInsertRowid);
    db.prepare(`INSERT INTO agenda_items (meeting_id, section, item_number, title, type, status, sort_order) VALUES (?, 'adjournment', '99', 'Adjournment', 'motion', 'ready', 999)`).run(result.lastInsertRowid);

    res.status(201).json(meeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update meeting
router.put('/meetings/:id', (req, res) => {
  try {
    const db = getDB();
    const { type, title, date, time, location, status, quorum_required, purpose, notice_sent_at } = req.body;
    db.prepare(
      `UPDATE meetings SET type=COALESCE(?,type), title=COALESCE(?,title), date=COALESCE(?,date), time=COALESCE(?,time), location=COALESCE(?,location), status=COALESCE(?,status), quorum_required=COALESCE(?,quorum_required), purpose=COALESCE(?,purpose), notice_sent_at=COALESCE(?,notice_sent_at), updated_at=datetime('now') WHERE id=?`
    ).run(type, title, date, time, location, status, quorum_required, purpose, notice_sent_at, req.params.id);

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Delete meeting (draft only)
router.delete('/meetings/:id', (req, res) => {
  try {
    const db = getDB();
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id) as any;
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.status !== 'draft') return res.status(400).json({ message: 'Can only delete draft meetings' });

    db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Publish meeting
router.put('/meetings/:id/publish', (req, res) => {
  try {
    const db = getDB();
    const count = db.prepare('SELECT COUNT(*) as c FROM agenda_items WHERE meeting_id = ?').get(req.params.id) as any;
    if (count.c === 0) return res.status(400).json({ message: 'Cannot publish a meeting with no agenda items' });

    db.prepare(`UPDATE meetings SET status = 'published', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
