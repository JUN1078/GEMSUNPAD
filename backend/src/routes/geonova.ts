import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  analyzeRockImage, analyzePetrographicImage, analyzeFossilImage, aiEnhanceFieldDescription
} from '../services/gemini';

const router = Router();
router.use(authenticate);

const UPLOADS_PATH = path.resolve(process.env.UPLOADS_PATH || './uploads');
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_PATH),
  filename: (_, file, cb) => cb(null, `geo-${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Dataset reference image map (Igneous/Metamorphic/Sedimentary)
const DATASET_PATH = path.resolve('e:/AI PROJECT/Hazard_Report/archive (1)/Dataset');
const ROCK_CLASS_MAP: Record<string, string> = {
  basalt:    'Igneous/Basalt',
  granite:   'Igneous/Granite',
  marble:    'Metamorphic/Marble',
  quartzite: 'Metamorphic/Quartzite',
  coal:      'Sedimentary/Coal',
  limestone: 'Sedimentary/Limestone',
  sandstone: 'Sedimentary/Sandstone',
};

// ── AI Analysis Endpoints ────────────────────────────────────────────────────

router.post('/rock-id', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { context = '' } = req.body;
  const photoUrl = `/uploads/${req.file.filename}`;
  try {
    const result = await analyzeRockImage(req.file.path, context);
    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO geonova_analyses (id,user_id,type,photo_url,result,context) VALUES (?,?,?,?,?,?)')
      .run(id, req.user!.id, 'rock', photoUrl, JSON.stringify(result), context);
    res.json({ id, photo_url: photoUrl, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/petrographic', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { context = '' } = req.body;
  const photoUrl = `/uploads/${req.file.filename}`;
  try {
    const result = await analyzePetrographicImage(req.file.path, context);
    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO geonova_analyses (id,user_id,type,photo_url,result,context) VALUES (?,?,?,?,?,?)')
      .run(id, req.user!.id, 'petrographic', photoUrl, JSON.stringify(result), context);
    res.json({ id, photo_url: photoUrl, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/fossil-id', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const { context = '' } = req.body;
  const photoUrl = `/uploads/${req.file.filename}`;
  try {
    const result = await analyzeFossilImage(req.file.path, context);
    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO geonova_analyses (id,user_id,type,photo_url,result,context) VALUES (?,?,?,?,?,?)')
      .run(id, req.user!.id, 'fossil', photoUrl, JSON.stringify(result), context);
    res.json({ id, photo_url: photoUrl, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enhance-description', async (req: AuthRequest, res: Response) => {
  const { description, rock_type = '' } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });
  try {
    const result = await aiEnhanceFieldDescription(description, rock_type);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Analysis History ─────────────────────────────────────────────────────────

router.get('/analyses', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { type } = req.query as { type?: string };
  let query = 'SELECT * FROM geonova_analyses WHERE user_id = ?';
  const params: any[] = [req.user!.id];
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  res.json(db.prepare(query).all(...params));
});

// ── Field Log Photo Upload ───────────────────────────────────────────────────

const photoStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_PATH),
  filename: (_, file, cb) => cb(null, `fl-${uuid()}${path.extname(file.originalname)}`),
});
const uploadPhotos = multer({ storage: photoStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/field-log-photos', uploadPhotos.array('photos', 10), (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const urls = files.map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// ── Field Logs ───────────────────────────────────────────────────────────────

router.get('/field-logs', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM geonova_field_logs WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  res.json(logs);
});

router.post('/field-logs', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const id = uuid();
  const {
    station_name, lat, lng, elevation, strike, dip,
    rock_type, description, ai_enhanced_description,
    photos = [], weather, notes
  } = req.body;
  db.prepare(`INSERT INTO geonova_field_logs
    (id,user_id,station_name,lat,lng,elevation,strike,dip,rock_type,description,ai_enhanced_description,photos,weather,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user!.id, station_name, lat, lng, elevation, strike, dip,
      rock_type, description, ai_enhanced_description, JSON.stringify(photos), weather, notes);
  res.json(db.prepare('SELECT * FROM geonova_field_logs WHERE id = ?').get(id));
});

router.put('/field-logs/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM geonova_field_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const {
    station_name, lat, lng, elevation, strike, dip,
    rock_type, description, ai_enhanced_description,
    photos = [], weather, notes
  } = req.body;
  db.prepare(`UPDATE geonova_field_logs SET
    station_name=?,lat=?,lng=?,elevation=?,strike=?,dip=?,rock_type=?,description=?,
    ai_enhanced_description=?,photos=?,weather=?,notes=?,updated_at=datetime('now')
    WHERE id=?`)
    .run(station_name, lat, lng, elevation, strike, dip, rock_type, description,
      ai_enhanced_description, JSON.stringify(photos), weather, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM geonova_field_logs WHERE id = ?').get(req.params.id));
});

router.delete('/field-logs/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM geonova_field_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM geonova_field_logs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ── Dataset Reference Images ─────────────────────────────────────────────────

router.get('/reference/:rockType', (req: AuthRequest, res: Response) => {
  const key = req.params.rockType.toLowerCase();
  const relDir = ROCK_CLASS_MAP[key];
  if (!relDir) return res.json({ images: [] });
  const dir = path.join(DATASET_PATH, relDir);
  if (!fs.existsSync(dir)) return res.json({ images: [] });
  const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 6);
  res.json({
    images: files.map(f => `/api/geonova/reference-img/${key}/${encodeURIComponent(f)}`),
    rock_class: relDir.split('/')[0],
  });
});

router.get('/reference-img/:rockType/:filename', (req: AuthRequest, res: Response) => {
  const relDir = ROCK_CLASS_MAP[req.params.rockType.toLowerCase()];
  if (!relDir) return res.status(404).end();
  const filePath = path.join(DATASET_PATH, relDir, decodeURIComponent(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

export default router;
