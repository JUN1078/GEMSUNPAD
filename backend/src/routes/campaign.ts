import { Router, Response, Request } from 'express';
import { v4 as uuid } from 'uuid';
import multer from 'multer';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const router = Router();
router.use(authenticate);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.resolve(process.env.UPLOADS_PATH || './uploads')),
  filename: (_req, file, cb) => cb(null, `camp_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Ensure table exists
function ensureCampaignTable() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS safety_campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    category TEXT DEFAULT 'Umum',
    tags TEXT DEFAULT '[]',
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`);
}

router.get('/', (req: AuthRequest, res: Response) => {
  ensureCampaignTable();
  const db = getDb();
  const campaigns = db.prepare(`
    SELECT sc.*, u.name as creator_name
    FROM safety_campaigns sc
    JOIN users u ON sc.user_id = u.id
    ORDER BY sc.created_at DESC
  `).all();
  res.json(campaigns);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  ensureCampaignTable();
  const db = getDb();
  const campaign = db.prepare(`
    SELECT sc.*, u.name as creator_name
    FROM safety_campaigns sc
    JOIN users u ON sc.user_id = u.id
    WHERE sc.id = ?
  `).get(req.params.id) as any;
  if (!campaign) return res.status(404).json({ error: 'Campaign tidak ditemukan' });
  db.prepare('UPDATE safety_campaigns SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json(campaign);
});

router.post('/', upload.single('image'), (req: AuthRequest, res: Response) => {
  ensureCampaignTable();
  const { title, content, author_name, category = 'Umum', tags = '[]' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });
  const db = getDb();
  const id = uuid();
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
  db.prepare(`INSERT INTO safety_campaigns (id, user_id, title, content, author_name, image_url, category, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, req.user!.id, title, content, author_name || req.user!.name, imageUrl, category, tags);
  const campaign = db.prepare('SELECT * FROM safety_campaigns WHERE id = ?').get(id);
  res.status(201).json(campaign);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM safety_campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign tidak ditemukan atau bukan milik Anda' });
  db.prepare('DELETE FROM safety_campaigns WHERE id = ?').run(req.params.id);
  res.json({ message: 'Campaign dihapus' });
});

// AI K3 Q&A endpoint
router.post('/ask-k3', async (req: AuthRequest, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Pertanyaan wajib diisi' });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Kamu adalah AI Konsultan K3 (Keselamatan dan Kesehatan Kerja) untuk Departemen Teknik Geologi Universitas Padjadjaran.
Jawab pertanyaan berikut dengan bahasa Indonesia yang jelas, akurat, dan mudah dipahami mahasiswa.
Fokus pada konteks K3 di lingkungan akademik, laboratorium geologi, dan kegiatan lapangan geologi.
Sertakan referensi peraturan yang relevan jika ada.
Jawab dalam 2-4 paragraf singkat.

Pertanyaan: ${question}`;
    const result = await model.generateContent(prompt);
    res.json({ answer: result.response.text().trim() });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mendapat jawaban AI', detail: err.message });
  }
});

export default router;
