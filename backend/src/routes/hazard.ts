import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { analyzeHazardImage } from '../services/gemini';
import { updateMissionProgress } from './missions';

const router = Router();
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.resolve(process.env.UPLOADS_PATH || './uploads')),
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { status, risk_level, from, to, limit = 50, offset = 0 } = req.query as Record<string, string>;
  let query = `SELECT h.*, u.name as user_name, u.hse_number
    FROM hazard_reports h JOIN users u ON h.user_id = u.id WHERE 1=1`;
  const params: unknown[] = [];
  if (status) { query += ' AND h.status = ?'; params.push(status); }
  if (risk_level) { query += ' AND h.ai_risk_level = ?'; params.push(risk_level); }
  if (from) { query += ' AND h.created_at >= ?'; params.push(from); }
  if (to) { query += ' AND h.created_at <= ?'; params.push(to + ' 23:59:59'); }
  query += ' ORDER BY h.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const reports = db.prepare(query).all(...params);
  const total = (db.prepare('SELECT COUNT(*) as c FROM hazard_reports').get() as { c: number }).c;
  res.json({ reports, total });
});

router.get('/map', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const markers = db.prepare(`
    SELECT id, lat, lng, location_name, ai_risk_level, ai_category, description,
           photo_url, created_at, status
    FROM hazard_reports WHERE lat IS NOT NULL AND lng IS NOT NULL
  `).all();
  res.json(markers);
});

router.get('/stats', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total: (db.prepare('SELECT COUNT(*) as c FROM hazard_reports').get() as any).c,
    today: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE date(created_at) = ?").get(today) as any).c,
    open: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE status = 'open'").get() as any).c,
    critical: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE ai_risk_level = 'Critical'").get() as any).c,
    by_risk: db.prepare("SELECT ai_risk_level, COUNT(*) as count FROM hazard_reports GROUP BY ai_risk_level").all(),
    by_category: db.prepare("SELECT ai_category, COUNT(*) as count FROM hazard_reports GROUP BY ai_category").all(),
  };
  res.json(stats);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const report = db.prepare(`SELECT h.*, u.name as user_name, u.hse_number
    FROM hazard_reports h JOIN users u ON h.user_id = u.id WHERE h.id = ?`).get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  res.json(report);
});

router.post('/', upload.single('photo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Foto wajib diunggah' });
    const { lat, lng, location_name, activity_type, description, manual } = req.body;
    if (!description) return res.status(400).json({ error: 'Deskripsi wajib diisi' });

    const id = uuid();
    const db = getDb();
    const photoUrl = `/uploads/${req.file.filename}`;
    const pointsMap: Record<string, number> = { Low: 10, Medium: 20, High: 30, Critical: 50 };

    if (manual === 'true') {
      // Manual submission - use fields provided by user
      const { category, risk_level, hazard_description, immediate_action, recommendation, regulation_ref, ppe_required } = req.body;
      const validRisks = ['Low', 'Medium', 'High', 'Critical'];
      if (!category) return res.status(400).json({ error: 'Kategori bahaya wajib diisi' });
      if (!validRisks.includes(risk_level)) return res.status(400).json({ error: 'Tingkat risiko tidak valid' });

      db.prepare(`INSERT INTO hazard_reports
        (id, user_id, photo_url, lat, lng, location_name, activity_type, description,
         ai_category, ai_risk_level, ai_hazard_description, ai_immediate_action,
         ai_recommendation, ai_regulation_ref, ai_ppe_required)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, req.user!.id, photoUrl,
        lat ? parseFloat(lat) : null,
        lng ? parseFloat(lng) : null,
        location_name || '', activity_type || '', description,
        category, risk_level,
        hazard_description || '', immediate_action || '',
        recommendation || '', regulation_ref || '',
        ppe_required || '[]'
      );

      const pts = pointsMap[risk_level] || 10;
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pts, req.user!.id);
      await updateMissionProgress(req.user!.id, 'hazard_report', id, { lat, lng });
      const report = db.prepare('SELECT * FROM hazard_reports WHERE id = ?').get(id);
      return res.status(201).json({ report, points_earned: pts, manual: true });
    }

    // AI analysis
    const aiResult = await analyzeHazardImage(req.file.path, description);

    db.prepare(`INSERT INTO hazard_reports
      (id, user_id, photo_url, lat, lng, location_name, activity_type, description,
       ai_category, ai_risk_level, ai_hazard_description, ai_immediate_action,
       ai_recommendation, ai_regulation_ref, ai_ppe_required)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, req.user!.id, photoUrl,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      location_name || '', activity_type || '', description,
      aiResult.category || '', aiResult.risk_level || 'Medium',
      aiResult.hazard_description || '', aiResult.immediate_action || '',
      aiResult.control_recommendation || '', aiResult.regulation_reference || '',
      JSON.stringify(aiResult.ppe_required || [])
    );

    const pts = pointsMap[aiResult.risk_level] || 10;
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pts, req.user!.id);
    await updateMissionProgress(req.user!.id, 'hazard_report', id, { lat, lng });

    const report = db.prepare('SELECT * FROM hazard_reports WHERE id = ?').get(id);
    res.status(201).json({ report, points_earned: pts });
  } catch (err: any) {
    console.error('Hazard report error:', err);
    res.status(500).json({ error: err.message || 'Gagal membuat laporan' });
  }
});

// Admin: update status + add response note + corrective action
router.patch('/:id/respond', (req: AuthRequest, res: Response) => {
  if (!['admin'].includes(req.user!.role)) return res.status(403).json({ error: 'Hanya Admin HSE yang dapat merespons' });
  const db = getDb();
  const { status, admin_response, corrective_action, corrective_action_deadline } = req.body;
  const valid = ['open', 'in_progress', 'closed'];
  if (status && !valid.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
  db.prepare(`UPDATE hazard_reports
    SET status = COALESCE(?, status),
        admin_response = COALESCE(?, admin_response),
        admin_response_by = ?,
        admin_response_at = datetime('now'),
        corrective_action = COALESCE(?, corrective_action),
        corrective_action_deadline = COALESCE(?, corrective_action_deadline),
        corrective_action_by = ?,
        updated_at = datetime('now')
    WHERE id = ?`).run(
    status ?? null, admin_response ?? null, req.user!.name,
    corrective_action ?? null, corrective_action_deadline ?? null, req.user!.name,
    req.params.id
  );
  const report = db.prepare('SELECT * FROM hazard_reports WHERE id = ?').get(req.params.id);
  res.json({ message: 'Respons berhasil disimpan', report });
});

// Admin: delete a hazard report
router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!['admin'].includes(req.user!.role)) return res.status(403).json({ error: 'Hanya Admin HSE yang dapat menghapus laporan' });
  const db = getDb();
  const report = db.prepare('SELECT id FROM hazard_reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  db.prepare('DELETE FROM hazard_reports WHERE id = ?').run(req.params.id);
  res.json({ message: 'Laporan berhasil dihapus' });
});

router.patch('/:id/status', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { status } = req.body;
  const valid = ['open', 'in_progress', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
  db.prepare('UPDATE hazard_reports SET status = ?, updated_at = datetime("now") WHERE id = ?')
    .run(status, req.params.id);
  res.json({ message: 'Status diperbarui' });
});

export default router;
