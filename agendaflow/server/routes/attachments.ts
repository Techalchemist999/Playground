import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryOne, execute } from '../db/index.js';

const router = Router();
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/agenda-items/:id/attachments', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { lastId } = execute(
      `INSERT INTO agenda_item_attachments (agenda_item_id, filename, original_filename, file_size, mime_type) VALUES (?,?,?,?,?)`,
      [Number(req.params.id), req.file.filename, req.file.originalname, req.file.size, req.file.mimetype]
    );
    res.status(201).json(queryOne('SELECT * FROM agenda_item_attachments WHERE id = ?', [lastId]));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/attachments/:id', (req, res) => {
  try {
    const att = queryOne('SELECT * FROM agenda_item_attachments WHERE id = ?', [Number(req.params.id)]);
    if (!att) return res.status(404).json({ message: 'Attachment not found' });
    res.sendFile(path.join(uploadDir, att.filename));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
