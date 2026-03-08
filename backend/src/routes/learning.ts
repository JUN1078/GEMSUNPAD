import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { updateMissionProgress } from './missions';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

const PROGRAM_MODULE_COUNT: Record<string, number> = {
  BST: 8, Mining: 10, OilGas: 10, Construction: 17,
};
const PROGRAM_CERT_PREFIX: Record<string, string> = {
  BST: 'HSE-GEO', Mining: 'HSE-MBP', OilGas: 'HSE-OG', Construction: 'HSE-CON',
};

router.get('/modules', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const program = (req.query.program as string) || null;
  const modules = program
    ? db.prepare('SELECT * FROM learning_modules WHERE is_active = 1 AND program = ? ORDER BY order_index').all(program) as any[]
    : db.prepare('SELECT * FROM learning_modules WHERE is_active = 1 ORDER BY program, order_index').all() as any[];
  const progress = db.prepare('SELECT * FROM learning_progress WHERE user_id = ?').all(req.user!.id) as any[];
  const progressMap = Object.fromEntries(progress.map(p => [p.module_code, p]));

  const result = modules.map(m => ({
    ...m,
    progress: progressMap[m.code] || { status: 'not_started', score: 0 }
  }));
  res.json(result);
});

router.get('/modules/:code/questions', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const questions = db.prepare(`SELECT id, question, options, order_index
    FROM questions WHERE module_code = ? AND question_type = 'module'
    ORDER BY RANDOM() LIMIT 3`).all(req.params.code);
  res.json(questions);
});

router.post('/modules/:code/complete-reading', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { code } = req.params;
  const existing = db.prepare('SELECT * FROM learning_progress WHERE user_id = ? AND module_code = ?')
    .get(req.user!.id, code);
  if (!existing) {
    db.prepare(`INSERT INTO learning_progress (id, user_id, module_code, status)
      VALUES (?, ?, ?, 'reading_done')`).run(uuid(), req.user!.id, code);
  }
  res.json({ message: 'Bacaan selesai, silakan kerjakan kuis' });
});

router.post('/modules/:code/submit-quiz', async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    const { code } = req.params;
    const db = getDb();

    const submittedIds = Object.keys(answers);
    if (submittedIds.length === 0) return res.status(400).json({ error: 'Tidak ada jawaban' });
    const placeholders = submittedIds.map(() => '?').join(',');
    const questions = db.prepare(`SELECT id, correct_answer, explanation
      FROM questions WHERE id IN (${placeholders})`).all(...submittedIds) as any[];

    let correct = 0;
    const results = questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correct++;
      return { question_id: q.id, correct: isCorrect, explanation: q.explanation, correct_answer: q.correct_answer };
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    db.prepare(`INSERT INTO assessment_attempts (id, user_id, module_code, attempt_type, score, answers, passed)
      VALUES (?, ?, ?, 'module', ?, ?, ?)`).run(uuid(), req.user!.id, code, score, JSON.stringify(answers), passed ? 1 : 0);

    if (passed) {
      db.prepare(`INSERT OR REPLACE INTO learning_progress (id, user_id, module_code, status, score, completed_at)
        VALUES (COALESCE((SELECT id FROM learning_progress WHERE user_id=? AND module_code=?), ?), ?, ?, 'completed', ?, datetime('now'))`)
        .run(req.user!.id, code, uuid(), req.user!.id, code, score);
      db.prepare('UPDATE users SET points = points + 100 WHERE id = ?').run(req.user!.id);
      await updateMissionProgress(req.user!.id, 'learning_module', code);

      const completedModules = (db.prepare(`SELECT COUNT(*) as c FROM learning_progress
        WHERE user_id = ? AND status = 'completed'`).get(req.user!.id) as any).c;
      if (completedModules >= 8) {
        await updateMissionProgress(req.user!.id, 'all_learning', 'all-8-modules');
      }
    }

    res.json({ score, passed, correct, total: questions.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/final-exam/questions', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const program = (req.query.program as string) || 'BST';
  const required = PROGRAM_MODULE_COUNT[program] || 8;

  const hasCert = db.prepare('SELECT id FROM certificates WHERE user_id = ? AND program = ?').get(req.user!.id, program);
  if (hasCert) return res.status(400).json({ error: 'Kamu sudah memiliki sertifikat untuk program ini!' });

  const completedModules = (db.prepare(`
    SELECT COUNT(*) as c FROM learning_progress lp
    JOIN learning_modules lm ON lp.module_code = lm.code
    WHERE lp.user_id = ? AND lp.status = 'completed' AND lm.program = ?
  `).get(req.user!.id, program) as any).c;
  if (completedModules < required) {
    return res.status(400).json({ error: `Selesaikan semua ${required} modul ${program} terlebih dahulu`, completed: completedModules, required });
  }

  const questions = db.prepare(`
    SELECT q.id, q.question, q.options, q.module_code, q.order_index
    FROM questions q JOIN learning_modules lm ON q.module_code = lm.code
    WHERE lm.program = ? ORDER BY RANDOM() LIMIT 40
  `).all(program);
  res.json({ questions, duration_minutes: 60, program });
});

router.post('/final-exam/submit', async (req: AuthRequest, res: Response) => {
  try {
    const { answers, program = 'BST' } = req.body;
    const db = getDb();
    const allQ = db.prepare('SELECT id, correct_answer, explanation FROM questions').all() as any[];
    const answerMap = Object.fromEntries(allQ.map(q => [q.id, q]));

    let correct = 0;
    const results: any[] = [];
    for (const [qId, userAns] of Object.entries(answers)) {
      const q = answerMap[qId];
      if (!q) continue;
      const isCorrect = userAns === q.correct_answer;
      if (isCorrect) correct++;
      results.push({ question_id: qId, correct: isCorrect, explanation: q.explanation });
    }

    const total = Object.keys(answers).length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= 75;
    const finalCode = `FINAL-${program}`;

    db.prepare(`INSERT INTO assessment_attempts (id, user_id, module_code, attempt_type, score, answers, passed)
      VALUES (?, ?, ?, 'final', ?, ?, ?)`).run(uuid(), req.user!.id, finalCode, score, JSON.stringify(answers), passed ? 1 : 0);

    let certificate = null;
    if (passed) {
      const existingCert = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND program = ?').get(req.user!.id, program);
      if (!existingCert) {
        const certId = uuid();
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
        const prefix = PROGRAM_CERT_PREFIX[program] || 'HSE-K3';
        const certNumber = `${prefix}-${new Date().getFullYear()}-${user.hse_number}`;
        const qrHash = crypto.createHash('sha256').update(`${certId}${req.user!.id}${program}${Date.now()}`).digest('hex').slice(0, 16);
        db.prepare(`INSERT INTO certificates (id, user_id, certificate_number, final_score, qr_hash, program)
          VALUES (?, ?, ?, ?, ?, ?)`).run(certId, req.user!.id, certNumber, score, qrHash, program);
        db.prepare('UPDATE users SET points = points + 1000 WHERE id = ?').run(req.user!.id);
        certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certId);
      }
    }

    res.json({ score, passed, correct, total, results, certificate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/certificate', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const program = (req.query.program as string) || null;
  const certs = program
    ? db.prepare('SELECT * FROM certificates WHERE user_id = ? AND program = ?').all(req.user!.id, program) as any[]
    : db.prepare('SELECT * FROM certificates WHERE user_id = ?').all(req.user!.id) as any[];
  if (certs.length === 0) return res.status(404).json({ error: 'Sertifikat belum tersedia' });
  const user = db.prepare('SELECT name, hse_number, program_studi FROM users WHERE id = ?').get(req.user!.id) as any;
  res.json(program ? { ...certs[0], user } : certs.map(c => ({ ...c, user })));
});

router.get('/certificate/verify/:hash', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const cert = db.prepare('SELECT c.*, u.name, u.hse_number FROM certificates c JOIN users u ON c.user_id = u.id WHERE c.qr_hash = ?')
    .get(req.params.hash) as any;
  if (!cert) return res.status(404).json({ valid: false });
  res.json({ valid: true, certificate: cert });
});

export default router;
