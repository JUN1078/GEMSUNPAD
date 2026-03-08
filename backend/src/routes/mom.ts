import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { summarizeMoM } from '../services/gemini';
import { updateMissionProgress } from './missions';

const router = Router();
router.use(authenticate);

router.get('/', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const items = db.prepare(`SELECT m.*, u.name as user_name FROM mom m
    JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`).all();
  res.json(items);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM mom WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'MoM tidak ditemukan' });
  res.json(item);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { meeting_title, meeting_date, meeting_time, location, chairman, secretary,
      attendees, agenda, discussions, action_items, photos } = req.body;
    if (!meeting_title) return res.status(400).json({ error: 'Judul rapat wajib diisi' });
    const id = uuid();
    const db = getDb();
    db.prepare(`INSERT INTO mom (id, user_id, meeting_title, meeting_date, meeting_time, location,
      chairman, secretary, attendees, agenda, discussions, action_items, photos)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, req.user!.id, meeting_title, meeting_date || '', meeting_time || '',
      location || '', chairman || '', secretary || '',
      JSON.stringify(attendees || []), JSON.stringify(agenda || []),
      JSON.stringify(discussions || []), JSON.stringify(action_items || []),
      JSON.stringify(photos || [])
    );
    db.prepare('UPDATE users SET points = points + 60 WHERE id = ?').run(req.user!.id);
    await updateMissionProgress(req.user!.id, 'mom', id);
    res.status(201).json(db.prepare('SELECT * FROM mom WHERE id = ?').get(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan MoM' });
  }
});

router.post('/ai-summarize', async (req: AuthRequest, res: Response) => {
  try {
    const { raw_notes } = req.body;
    if (!raw_notes) return res.status(400).json({ error: 'Notulen wajib diisi' });
    const result = await summarizeMoM(raw_notes);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Gagal meringkas notulen' });
  }
});

router.patch('/:id/action-items/:itemIndex', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const mom = db.prepare('SELECT * FROM mom WHERE id = ?').get(req.params.id) as any;
  if (!mom) return res.status(404).json({ error: 'MoM tidak ditemukan' });
  const items = JSON.parse(mom.action_items || '[]');
  const idx = parseInt(req.params.itemIndex);
  if (items[idx]) {
    items[idx] = { ...items[idx], ...req.body };
    db.prepare("UPDATE mom SET action_items = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(items), req.params.id);
  }
  res.json({ message: 'Action item diperbarui' });
});

export default router;
