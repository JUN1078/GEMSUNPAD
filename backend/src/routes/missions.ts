import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Update mission progress (called internally from other routes)
export async function updateMissionProgress(
  userId: string,
  missionType: string,
  evidenceId: string,
  meta?: { lat?: string; lng?: string }
) {
  const db = getDb();
  const missions = db.prepare(`
    SELECT * FROM missions WHERE mission_type = ? OR mission_type = 'campaign' OR mission_type = 'all_missions'
  `).all() as any[];

  for (const mission of missions) {
    let shouldCount = false;

    if (mission.mission_type === missionType) shouldCount = true;
    if (mission.mission_type === 'hazard_location' && missionType === 'hazard_report' && meta?.lat && meta?.lng) shouldCount = true;
    if (mission.mission_type === 'campaign' && ['hazard_report', 'jsa', 'safety_moment'].includes(missionType)) shouldCount = true;

    if (!shouldCount) continue;

    let progress = db.prepare('SELECT * FROM mission_progress WHERE user_id = ? AND mission_id = ?')
      .get(userId, mission.id) as any;

    if (!progress) {
      db.prepare(`INSERT INTO mission_progress (id, user_id, mission_id, status, current_count, evidence_ids)
        VALUES (?, ?, ?, 'in_progress', 0, '[]')`).run(uuid(), userId, mission.id);
      progress = db.prepare('SELECT * FROM mission_progress WHERE user_id = ? AND mission_id = ?')
        .get(userId, mission.id) as any;
    }

    if (progress.status === 'completed') continue;

    const evidenceIds = JSON.parse(progress.evidence_ids || '[]');
    evidenceIds.push(evidenceId);
    const newCount = progress.current_count + 1;
    const completed = newCount >= mission.target_count;

    db.prepare(`UPDATE mission_progress
      SET current_count = ?, evidence_ids = ?, status = ?,
          completed_at = ?, updated_at = datetime('now')
      WHERE user_id = ? AND mission_id = ?`).run(
      newCount, JSON.stringify(evidenceIds),
      completed ? 'completed' : 'in_progress',
      completed ? new Date().toISOString() : null,
      userId, mission.id
    );

    if (completed) {
      // Award badge + points
      db.prepare(`INSERT INTO badges (id, user_id, mission_id, badge_icon, badge_name)
        VALUES (?, ?, ?, ?, ?)`).run(uuid(), userId, mission.id, mission.badge_icon, mission.badge_name);
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(mission.points, userId);

      // Notification
      db.prepare(`INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, ?, ?, ?)`).run(
        uuid(), userId,
        `🏅 APELTRI: Misi Selesai!`,
        `Selamat! Kamu menyelesaikan misi "${mission.title}" dan mendapatkan badge ${mission.badge_icon} ${mission.badge_name} + ${mission.points} poin!`,
        'mission'
      );
    }
  }
}

// Candidate-allowed mission types
const CANDIDATE_MISSION_TYPES = ['hazard_report', 'hazard_location', 'learning_module', 'all_learning'];

// GET /api/missions - all missions with user progress
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const isCandidate = req.user!.role === 'candidate';
  const missions = isCandidate
    ? db.prepare(`SELECT * FROM missions WHERE mission_type IN (${CANDIDATE_MISSION_TYPES.map(() => '?').join(',')}) ORDER BY order_index`).all(...CANDIDATE_MISSION_TYPES) as any[]
    : db.prepare('SELECT * FROM missions ORDER BY order_index').all() as any[];
  const progress = db.prepare('SELECT * FROM mission_progress WHERE user_id = ?').all(req.user!.id) as any[];

  const progressMap = Object.fromEntries(progress.map(p => [p.mission_id, p]));
  const result = missions.map(m => ({
    ...m,
    progress: progressMap[m.id] || { status: 'not_started', current_count: 0, target_count: m.target_count },
  }));

  const totalCompleted = result.filter(m => m.progress.status === 'completed').length;
  const totalPoints = result.filter(m => m.progress.status === 'completed').reduce((s, m) => s + m.points, 0);

  res.json({ missions: result, stats: { total: missions.length, completed: totalCompleted, total_points: totalPoints } });
});

// GET /api/missions/badges - user badges
router.get('/badges', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const badges = db.prepare(`SELECT b.*, m.title as mission_title, m.difficulty, m.category
    FROM badges b JOIN missions m ON b.mission_id = m.id
    WHERE b.user_id = ? ORDER BY b.earned_at DESC`).all(req.user!.id);
  res.json(badges);
});

// GET /api/missions/leaderboard
router.get('/leaderboard', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const board = db.prepare(`
    SELECT u.id, u.name, u.hse_number, u.program_studi, u.points,
      (SELECT COUNT(*) FROM badges WHERE user_id = u.id) as badge_count,
      (SELECT COUNT(*) FROM mission_progress WHERE user_id = u.id AND status = 'completed') as missions_done
    FROM users u ORDER BY u.points DESC LIMIT 20
  `).all();
  res.json(board);
});

export default router;
