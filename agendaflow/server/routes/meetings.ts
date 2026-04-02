import { Router } from 'express';
import { queryAll, queryOne, execute } from '../db/index.js';

const router = Router();

router.get('/meetings', (req, res) => {
  try {
    let sql = `SELECT m.*, (SELECT COUNT(*) FROM agenda_items WHERE meeting_id = m.id) as item_count FROM meetings m WHERE 1=1`;
    const params: any[] = [];
    if (req.query.type) { sql += ' AND m.type = ?'; params.push(req.query.type); }
    if (req.query.status) { sql += ' AND m.status = ?'; params.push(req.query.status); }
    sql += ' ORDER BY m.date DESC, m.time DESC';
    res.json(queryAll(sql, params));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/meetings/:id', (req, res) => {
  try {
    const meeting = queryOne('SELECT * FROM meetings WHERE id = ?', [Number(req.params.id)]);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/meetings', (req, res) => {
  try {
    const { type, title, date, time, location, quorum_required, purpose } = req.body;
    if (type === 'special' && !purpose) {
      return res.status(400).json({ message: 'Special meetings require a purpose field' });
    }
    const { lastId } = execute(
      `INSERT INTO meetings (type, title, date, time, location, quorum_required, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, title || `${type} Meeting`, date, time || '19:00', location || 'Council Chambers', quorum_required || 3, purpose || null]
    );
    // Auto-create Call to Order + Adjournment
    execute(`INSERT INTO agenda_items (meeting_id, section, item_number, title, type, status, sort_order) VALUES (?, 'call_to_order', '1', 'Call to Order', 'information', 'ready', 1)`, [lastId]);
    execute(`INSERT INTO agenda_items (meeting_id, section, item_number, title, type, status, sort_order) VALUES (?, 'adjournment', '99', 'Adjournment', 'motion', 'ready', 999)`, [lastId]);
    res.status(201).json(queryOne('SELECT * FROM meetings WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/meetings/:id', (req, res) => {
  try {
    const { type, title, date, time, location, status, quorum_required, purpose, notice_sent_at } = req.body;
    execute(
      `UPDATE meetings SET type=COALESCE(?,type), title=COALESCE(?,title), date=COALESCE(?,date), time=COALESCE(?,time), location=COALESCE(?,location), status=COALESCE(?,status), quorum_required=COALESCE(?,quorum_required), purpose=COALESCE(?,purpose), notice_sent_at=COALESCE(?,notice_sent_at), updated_at=datetime('now') WHERE id=?`,
      [type, title, date, time, location, status, quorum_required, purpose, notice_sent_at, Number(req.params.id)]
    );
    res.json(queryOne('SELECT * FROM meetings WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/meetings/:id', (req, res) => {
  try {
    const meeting = queryOne('SELECT * FROM meetings WHERE id = ?', [Number(req.params.id)]);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.status !== 'draft') return res.status(400).json({ message: 'Can only delete draft meetings' });
    execute('DELETE FROM meetings WHERE id = ?', [Number(req.params.id)]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/meetings/:id/publish', (req, res) => {
  try {
    const row = queryOne('SELECT COUNT(*) as c FROM agenda_items WHERE meeting_id = ?', [Number(req.params.id)]);
    if (!row || row.c === 0) return res.status(400).json({ message: 'Cannot publish a meeting with no agenda items' });
    execute(`UPDATE meetings SET status = 'published', updated_at = datetime('now') WHERE id = ?`, [Number(req.params.id)]);
    res.json(queryOne('SELECT * FROM meetings WHERE id = ?', [Number(req.params.id)]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
