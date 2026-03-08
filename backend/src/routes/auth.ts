import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const avatarStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.resolve(process.env.UPLOADS_PATH || './uploads')),
  filename: (_, file, cb) => cb(null, `avatar-${uuid()}${path.extname(file.originalname)}`),
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// Parse Roman numeral to integer (handles I–L range)
function parseRoman(roman: string): number {
  const vals: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
  const r = roman.toUpperCase();
  let result = 0;
  for (let i = 0; i < r.length; i++) {
    const curr = vals[r[i]] ?? 0;
    const next = vals[r[i + 1]] ?? 0;
    result += curr < next ? -curr : curr;
  }
  return result;
}

// Dept number = angkatan_num + 6 (e.g. V=5 → 11, VI=6 → 12)
function getDeptNum(angkatan: string): number {
  const num = parseRoman(angkatan);
  return num > 0 ? num + 6 : 7;
}

// reg_type → role map
const ROLE_MAP: Record<string, string> = {
  umum: 'public',
  candidate: 'candidate',
  member: 'member',
};

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, reg_type = 'candidate', angkatan, member_number } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }

    const role = ROLE_MAP[reg_type];
    if (!role) return res.status(400).json({ error: 'Tipe registrasi tidak valid' });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

    const hash = await bcrypt.hash(password, 10);
    const id = uuid();
    let hse_number: string;
    const angkatanVal = angkatan?.toUpperCase() || '';

    if (role === 'member') {
      if (!angkatan || !member_number) {
        return res.status(400).json({ error: 'Angkatan dan nomor anggota wajib diisi untuk Anggota HSE' });
      }
      const memberNum = parseInt(member_number);
      if (isNaN(memberNum) || memberNum < 1) {
        return res.status(400).json({ error: 'Nomor anggota tidak valid' });
      }
      const deptNum = getDeptNum(angkatan);
      hse_number = `HSE.${angkatanVal}-${deptNum}.${String(memberNum).padStart(3, '0')}`;
    } else {
      // Auto-generate unique id for non-member accounts
      const prefix = role === 'public' ? 'UMUM' : 'CALON';
      hse_number = `${prefix}-${id.slice(0, 8).toUpperCase()}`;
    }

    db.prepare(`INSERT INTO users (id, name, email, password, hse_number, role, angkatan, program_studi)
      VALUES (?, ?, ?, ?, ?, ?, ?, '')`).run(id, name, email, hash, hse_number, role, angkatanVal);

    const token = jwt.sign({ id, role, name, hse_number }, process.env.JWT_SECRET!, { expiresIn: '8h' });
    const user = db.prepare('SELECT id, name, email, hse_number, role, angkatan, program_studi, points, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json({ token, user });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Nomor HSE sudah digunakan. Periksa kembali nomor anggota Anda.' });
    }
    res.status(500).json({ error: 'Gagal registrasi: ' + err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib diisi' });

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(401).json({ error: 'Email atau password salah' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Email atau password salah' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, hse_number: user.hse_number },
      process.env.JWT_SECRET!, { expiresIn: '8h' }
    );
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch {
    res.status(500).json({ error: 'Gagal login' });
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, hse_number, role, angkatan, program_studi, points, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Admin: update user role
router.patch('/users/:id/role', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { role } = req.body;
  if (!['admin', 'member', 'candidate', 'public'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }
  const db = getDb();
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role diperbarui' });
});

// Admin: list all users
router.get('/users', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const users = db.prepare('SELECT id, name, email, hse_number, role, angkatan, points, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// HSE number preview (for Anggota HSE registration)
router.get('/hse-number-preview', (req: Request, res: Response) => {
  const { angkatan, member_number } = req.query as { angkatan: string; member_number: string };
  if (!angkatan || !member_number) return res.status(400).json({ error: 'angkatan and member_number required' });
  const deptNum = getDeptNum(angkatan);
  const padded = String(parseInt(member_number) || 0).padStart(3, '0');
  res.json({ hse_number: `HSE.${angkatan.toUpperCase()}-${deptNum}.${padded}` });
});

router.get('/leaderboard', authenticate, (_req: Request, res: Response) => {
  const db = getDb();
  const users = db.prepare(`
    SELECT id, name, hse_number, angkatan, points,
    (SELECT COUNT(*) FROM badges WHERE user_id = users.id) as badge_count
    FROM users ORDER BY points DESC LIMIT 20
  `).all();
  res.json(users);
});

// Upload avatar photo
router.post('/avatar', authenticate, uploadAvatar.single('photo'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File foto wajib diunggah' });
  const db = getDb();
  const avatarUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user!.id);
  const user = db.prepare('SELECT id, name, email, hse_number, role, angkatan, program_studi, points, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json({ avatar: avatarUrl, user });
});

// Update profile (name, program_studi)
router.patch('/profile', authenticate, (req: AuthRequest, res: Response) => {
  const { name, program_studi } = req.body;
  const db = getDb();
  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user!.id);
  if (program_studi !== undefined) db.prepare('UPDATE users SET program_studi = ? WHERE id = ?').run(program_studi, req.user!.id);
  const user = db.prepare('SELECT id, name, email, hse_number, role, angkatan, program_studi, points, avatar, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

export default router;
