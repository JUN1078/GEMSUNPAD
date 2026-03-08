import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateJSA } from '../services/gemini';
import { updateMissionProgress } from './missions';

const router = Router();
router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const items = db.prepare(`SELECT j.*, u.name as user_name FROM jsa j
    JOIN users u ON j.user_id = u.id ORDER BY j.created_at DESC`).all();
  res.json(items);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM jsa WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'JSA tidak ditemukan' });
  res.json(item);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, location, work_date, responsible_person, tools_equipment, description } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Judul dan deskripsi wajib diisi' });

    let aiSteps: any = { steps: [] };
    try {
      aiSteps = await generateJSA({ title, location, work_date, responsible_person, tools_equipment, description });
    } catch (aiErr) {
      console.warn('AI JSA generation failed, using empty steps:', aiErr);
    }
    const id = uuid();
    const db = getDb();
    const aiStepsStr = JSON.stringify(aiSteps) || '{"steps":[]}';
    db.prepare(`INSERT INTO jsa (id, user_id, title, location, work_date, responsible_person, tools_equipment, description, ai_steps)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      id, req.user!.id, title, location || '', work_date || '',
      responsible_person || '', tools_equipment || '', description,
      aiStepsStr
    );

    db.prepare('UPDATE users SET points = points + 50 WHERE id = ?').run(req.user!.id);
    await updateMissionProgress(req.user!.id, 'jsa', id);

    res.status(201).json(db.prepare('SELECT * FROM jsa WHERE id = ?').get(id));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat JSA' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { title, location, work_date, responsible_person, tools_equipment, description, ai_steps, status } = req.body;
  db.prepare(`UPDATE jsa SET title=?, location=?, work_date=?, responsible_person=?,
    tools_equipment=?, description=?, ai_steps=?, status=?, updated_at=datetime('now')
    WHERE id = ? AND user_id = ?`).run(
    title, location, work_date, responsible_person, tools_equipment,
    description, ai_steps, status, req.params.id, req.user!.id
  );
  res.json({ message: 'JSA diperbarui' });
});

export default router;
