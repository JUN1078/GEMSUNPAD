import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { suggestSafetyMomentTopic } from '../services/gemini';
import { updateMissionProgress } from './missions';

const router = Router();
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.resolve(process.env.UPLOADS_PATH || './uploads')),
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
router.use(authenticate);

router.get('/', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const items = db.prepare(`SELECT sm.*, u.name as user_name FROM safety_moments sm
    JOIN users u ON sm.user_id = u.id ORDER BY sm.created_at DESC`).all();
  res.json(items);
});

router.get('/suggest', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const recent = db.prepare('SELECT ai_category, description FROM hazard_reports ORDER BY created_at DESC LIMIT 10').all() as any[];
  const hazardSummaries = recent.map(h => `${h.ai_category}: ${h.description}`);
  suggestSafetyMomentTopic(hazardSummaries).then(result => res.json(result)).catch(() => res.json({ suggested_topics: [] }));
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM safety_moments WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Safety Moment tidak ditemukan' });
  res.json(item);
});

router.post('/', upload.array('photos', 5), async (req: AuthRequest, res: Response) => {
  try {
    const { title, presenter, topic, content, location, moment_date, attendees } = req.body;
    if (!title || !topic) return res.status(400).json({ error: 'Judul dan topik wajib diisi' });
    const files = req.files as Express.Multer.File[];
    const photos = files?.map(f => `/uploads/${f.filename}`) || [];
    const id = uuid();
    const db = getDb();
    db.prepare(`INSERT INTO safety_moments (id, user_id, title, presenter, topic, content, location, moment_date, photos, attendees)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      id, req.user!.id, title, presenter || '', topic, content || '',
      location || '', moment_date || '', JSON.stringify(photos),
      attendees ? JSON.stringify(JSON.parse(attendees)) : '[]'
    );
    db.prepare('UPDATE users SET points = points + 75 WHERE id = ?').run(req.user!.id);
    await updateMissionProgress(req.user!.id, 'safety_moment', id);
    res.status(201).json(db.prepare('SELECT * FROM safety_moments WHERE id = ?').get(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan Safety Moment' });
  }
});

export default router;
