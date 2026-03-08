import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/hse_unpad.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = db;
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hse_number TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'mahasiswa',
      program_studi TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hazard_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      lat REAL,
      lng REAL,
      location_name TEXT DEFAULT '',
      activity_type TEXT DEFAULT '',
      description TEXT NOT NULL,
      ai_category TEXT DEFAULT '',
      ai_risk_level TEXT DEFAULT 'Medium',
      ai_hazard_description TEXT DEFAULT '',
      ai_immediate_action TEXT DEFAULT '',
      ai_recommendation TEXT DEFAULT '',
      ai_regulation_ref TEXT DEFAULT '',
      ai_ppe_required TEXT DEFAULT '[]',
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jsa (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT DEFAULT '',
      work_date TEXT DEFAULT '',
      responsible_person TEXT DEFAULT '',
      tools_equipment TEXT DEFAULT '',
      description TEXT NOT NULL,
      ai_steps TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS safety_moments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      presenter TEXT DEFAULT '',
      topic TEXT DEFAULT '',
      content TEXT DEFAULT '',
      location TEXT DEFAULT '',
      moment_date TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      attendees TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mom (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      meeting_title TEXT NOT NULL,
      meeting_date TEXT DEFAULT '',
      meeting_time TEXT DEFAULT '',
      location TEXT DEFAULT '',
      chairman TEXT DEFAULT '',
      secretary TEXT DEFAULT '',
      attendees TEXT DEFAULT '[]',
      agenda TEXT DEFAULT '[]',
      discussions TEXT DEFAULT '[]',
      action_items TEXT DEFAULT '[]',
      photos TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS learning_modules (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      program TEXT DEFAULT 'BST',
      thumbnail TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0,
      total_slides INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_code TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      score INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, module_code),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      module_code TEXT NOT NULL,
      question_type TEXT DEFAULT 'module',
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_code TEXT NOT NULL,
      attempt_type TEXT DEFAULT 'module',
      score INTEGER DEFAULT 0,
      answers TEXT DEFAULT '[]',
      passed INTEGER DEFAULT 0,
      attempted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      program TEXT DEFAULT 'BST',
      certificate_number TEXT UNIQUE NOT NULL,
      final_score INTEGER DEFAULT 0,
      qr_hash TEXT UNIQUE NOT NULL,
      issued_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'field',
      difficulty TEXT DEFAULT 'easy',
      points INTEGER DEFAULT 100,
      badge_icon TEXT DEFAULT '🏅',
      badge_name TEXT DEFAULT 'Mission Complete',
      target_count INTEGER DEFAULT 1,
      mission_type TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS mission_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      status TEXT DEFAULT 'not_started',
      current_count INTEGER DEFAULT 0,
      evidence_ids TEXT DEFAULT '[]',
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, mission_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      badge_icon TEXT NOT NULL,
      badge_name TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS geonova_field_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      station_name TEXT DEFAULT '',
      lat REAL,
      lng REAL,
      elevation REAL,
      strike INTEGER,
      dip INTEGER,
      rock_type TEXT DEFAULT '',
      description TEXT DEFAULT '',
      ai_enhanced_description TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      weather TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS geonova_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'rock',
      photo_url TEXT DEFAULT '',
      result TEXT DEFAULT '{}',
      context TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migrations for existing DBs
  try { database.exec(`ALTER TABLE learning_modules ADD COLUMN program TEXT DEFAULT 'BST'`); } catch {}
  try { database.exec(`ALTER TABLE certificates ADD COLUMN program TEXT DEFAULT 'BST'`); } catch {}
  try { database.exec(`ALTER TABLE users ADD COLUMN angkatan TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE missions ADD COLUMN allowed_roles TEXT DEFAULT 'admin,member,candidate,mahasiswa'`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN admin_response TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN admin_response_by TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN admin_response_at TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN corrective_action TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN corrective_action_deadline TEXT DEFAULT ''`); } catch {}
  try { database.exec(`ALTER TABLE hazard_reports ADD COLUMN corrective_action_by TEXT DEFAULT ''`); } catch {}
  // Migrate legacy roles
  try { database.exec(`UPDATE users SET role = 'member' WHERE role = 'mahasiswa'`); } catch {}
  try { database.exec(`UPDATE users SET role = 'public' WHERE role = 'umum'`); } catch {}

  seedLearningModules();
  seedMissions();
  seedDummyUsers();
}

function seedDummyUsers() {
  const database = db;
  const dummies = [
    { id: 'dummy-admin-001', name: 'Admin HSE', email: 'admin@gems.unpad.ac.id', password: 'admin123', hse_number: 'ADMIN-HSE-001', role: 'admin', angkatan: '' },
    { id: 'dummy-member-001', name: 'Budi Santoso', email: 'anggota@gems.unpad.ac.id', password: 'anggota123', hse_number: 'HSE.IX-15.001', role: 'member', angkatan: 'IX' },
    { id: 'dummy-calon-001', name: 'Dini Rahayu', email: 'calon@gems.unpad.ac.id', password: 'calon123', hse_number: 'CALON-DEMO001', role: 'candidate', angkatan: '' },
    { id: 'dummy-umum-001', name: 'User Umum', email: 'umum@gems.unpad.ac.id', password: 'umum1234', hse_number: 'UMUM-DEMO001', role: 'public', angkatan: '' },
  ];
  const stmt = database.prepare(
    `INSERT OR IGNORE INTO users (id, name, email, password, hse_number, role, angkatan, program_studi) VALUES (?, ?, ?, ?, ?, ?, ?, '')`
  );
  for (const u of dummies) {
    const exists = database.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (!exists) stmt.run(u.id, u.name, u.email, bcrypt.hashSync(u.password, 10), u.hse_number, u.role, u.angkatan);
  }
}

function seedLearningModules() {
  const database = db;

  const bstCount = (database.prepare(`SELECT COUNT(*) as c FROM learning_modules WHERE program = 'BST'`).get() as { c: number }).c;
  if (bstCount === 0) {
    const bstModules = [
      { id: 'mod-001', code: 'HSE.BST.001', program: 'BST', title: 'Perundangan K3', description: 'Undang-undang dan peraturan K3 di Indonesia', category: 'Regulasi', order_index: 1, total_slides: 10 },
      { id: 'mod-002', code: 'HSE.BST.002', program: 'BST', title: 'Penyelesaian K3 di Tempat Kerja', description: 'Prosedur penyelesaian masalah K3 secara sistematis', category: 'Prosedur', order_index: 2, total_slides: 10 },
      { id: 'mod-003', code: 'HSE.BST.003', program: 'BST', title: 'SMK3', description: 'Sistem Manajemen K3 sesuai ISO 45001:2018', category: 'Manajemen', order_index: 3, total_slides: 10 },
      { id: 'mod-004', code: 'HSE.BST.004', program: 'BST', title: 'Rapat K3', description: 'Tata cara pelaksanaan rapat K3 yang efektif', category: 'Prosedur', order_index: 4, total_slides: 10 },
      { id: 'mod-005', code: 'HSE.BST.005', program: 'BST', title: 'Identifikasi Bahaya dan Risiko', description: 'Metodologi HIRA untuk identifikasi dan penilaian risiko', category: 'Analisis', order_index: 5, total_slides: 10 },
      { id: 'mod-006', code: 'HSE.BST.006', program: 'BST', title: 'Pengendalian Bahaya', description: 'Hierarchy of controls dan strategi pengendalian bahaya', category: 'Pengendalian', order_index: 6, total_slides: 10 },
      { id: 'mod-007', code: 'HSE.BST.007', program: 'BST', title: 'Kesehatan Kerja', description: 'Program kesehatan kerja dan penyakit akibat kerja', category: 'Kesehatan', order_index: 7, total_slides: 10 },
      { id: 'mod-008', code: 'HSE.BST.008', program: 'BST', title: 'Industrial Hygiene', description: 'Higiene industri: evaluasi dan pengendalian faktor lingkungan kerja', category: 'Higiene', order_index: 8, total_slides: 10 },
    ];
    const s = database.prepare(`INSERT OR IGNORE INTO learning_modules (id,code,program,title,description,category,order_index,total_slides) VALUES (@id,@code,@program,@title,@description,@category,@order_index,@total_slides)`);
    bstModules.forEach(m => s.run(m));
    seedQuestions();
  }

  const miningCount = (database.prepare(`SELECT COUNT(*) as c FROM learning_modules WHERE program = 'Mining'`).get() as { c: number }).c;
  if (miningCount === 0) {
    const miningModules = [
      { id: 'mod-m01', code: 'HSE.MBP.001', program: 'Mining', title: 'Peraturan K3 Pertambangan', description: 'Regulasi K3 khusus sektor pertambangan di Indonesia', category: 'Regulasi', order_index: 1, total_slides: 8 },
      { id: 'mod-m02', code: 'HSE.MBP.002', program: 'Mining', title: 'Dasar-dasar Pertambangan', description: 'Pengenalan teknik dan operasi pertambangan yang aman', category: 'Teknis', order_index: 2, total_slides: 8 },
      { id: 'mod-m03', code: 'HSE.MBP.003', program: 'Mining', title: 'Ventilasi Tambang', description: 'Sistem ventilasi untuk mengendalikan gas berbahaya di tambang', category: 'Teknis', order_index: 3, total_slides: 8 },
      { id: 'mod-m04', code: 'HSE.MBP.004', program: 'Mining', title: 'K3 Peledakan (Blasting)', description: 'Keselamatan kerja dalam kegiatan peledakan di area tambang', category: 'Pengendalian', order_index: 4, total_slides: 8 },
      { id: 'mod-m05', code: 'HSE.MBP.005', program: 'Mining', title: 'Bahaya Gas di Tambang', description: 'Identifikasi dan pengendalian gas berbahaya di pertambangan', category: 'Bahaya', order_index: 5, total_slides: 8 },
      { id: 'mod-m06', code: 'HSE.MBP.006', program: 'Mining', title: 'Penyanggaan & Perkuatan', description: 'Teknik penyanggaan lubang tambang yang aman', category: 'Teknis', order_index: 6, total_slides: 8 },
      { id: 'mod-m07', code: 'HSE.MBP.007', program: 'Mining', title: 'Kelistrikan Tambang', description: 'K3 kelistrikan dan peralatan listrik di pertambangan', category: 'Pengendalian', order_index: 7, total_slides: 8 },
      { id: 'mod-m08', code: 'HSE.MBP.008', program: 'Mining', title: 'Peralatan Berat Tambang', description: 'Keselamatan operasi alat berat dan kendaraan tambang', category: 'Teknis', order_index: 8, total_slides: 8 },
      { id: 'mod-m09', code: 'HSE.MBP.009', program: 'Mining', title: 'Kesehatan Kerja Tambang', description: 'Program kesehatan khusus pekerja tambang', category: 'Kesehatan', order_index: 9, total_slides: 8 },
      { id: 'mod-m10', code: 'HSE.MBP.010', program: 'Mining', title: 'Tanggap Darurat Tambang', description: 'Prosedur tanggap darurat dan evakuasi di pertambangan', category: 'Darurat', order_index: 10, total_slides: 8 },
    ];
    const s = database.prepare(`INSERT OR IGNORE INTO learning_modules (id,code,program,title,description,category,order_index,total_slides) VALUES (@id,@code,@program,@title,@description,@category,@order_index,@total_slides)`);
    miningModules.forEach(m => s.run(m));
  }

  const ogCount = (database.prepare(`SELECT COUNT(*) as c FROM learning_modules WHERE program = 'OilGas'`).get() as { c: number }).c;
  if (ogCount === 0) {
    const ogModules = [
      { id: 'mod-o01', code: 'HSE.OG.001', program: 'OilGas', title: 'Peraturan K3 Migas', description: 'Regulasi K3 sektor minyak dan gas bumi Indonesia', category: 'Regulasi', order_index: 1, total_slides: 8 },
      { id: 'mod-o02', code: 'HSE.OG.002', program: 'OilGas', title: 'Dasar-dasar K3 Migas', description: 'Prinsip dasar keselamatan di industri minyak dan gas', category: 'Dasar', order_index: 2, total_slides: 8 },
      { id: 'mod-o03', code: 'HSE.OG.003', program: 'OilGas', title: 'Inspeksi K3 Migas', description: 'Teknik inspeksi keselamatan instalasi migas', category: 'Prosedur', order_index: 3, total_slides: 8 },
      { id: 'mod-o04', code: 'HSE.OG.004', program: 'OilGas', title: 'Ijin Keselamatan (PTW)', description: 'Sistem izin kerja khusus di fasilitas migas', category: 'Prosedur', order_index: 4, total_slides: 8 },
      { id: 'mod-o05', code: 'HSE.OG.005', program: 'OilGas', title: 'APD di Industri Migas', description: 'Alat pelindung diri khusus lingkungan migas', category: 'Pengendalian', order_index: 5, total_slides: 8 },
      { id: 'mod-o06', code: 'HSE.OG.006', program: 'OilGas', title: 'Pemadam Api Migas', description: 'Teknik pemadaman kebakaran di fasilitas minyak dan gas', category: 'Darurat', order_index: 6, total_slides: 8 },
      { id: 'mod-o07', code: 'HSE.OG.007', program: 'OilGas', title: 'K3 Ruang Terbatas & SCBA', description: 'Prosedur confined space entry dan penggunaan SCBA', category: 'Teknis', order_index: 7, total_slides: 8 },
      { id: 'mod-o08', code: 'HSE.OG.008', program: 'OilGas', title: 'Pengukuran Gas Berbahaya', description: 'Teknik pengukuran dan monitoring gas beracun/flammable', category: 'Teknis', order_index: 8, total_slides: 8 },
      { id: 'mod-o09', code: 'HSE.OG.009', program: 'OilGas', title: 'Pengukuran Kebisingan', description: 'Metode pengukuran dan pengendalian kebisingan di migas', category: 'Higiene', order_index: 9, total_slides: 8 },
      { id: 'mod-o10', code: 'HSE.OG.010', program: 'OilGas', title: 'P3K di Lingkungan Migas', description: 'Pertolongan pertama khusus kecelakaan di fasilitas migas', category: 'Kesehatan', order_index: 10, total_slides: 8 },
    ];
    const s = database.prepare(`INSERT OR IGNORE INTO learning_modules (id,code,program,title,description,category,order_index,total_slides) VALUES (@id,@code,@program,@title,@description,@category,@order_index,@total_slides)`);
    ogModules.forEach(m => s.run(m));
  }

  const conCount = (database.prepare(`SELECT COUNT(*) as c FROM learning_modules WHERE program = 'Construction'`).get() as { c: number }).c;
  if (conCount === 0) {
    const conModules = [
      { id: 'mod-c01', code: 'HSE.CON.001', program: 'Construction', title: 'UU K3 Konstruksi', description: 'Undang-undang K3 yang berlaku di sektor konstruksi', category: 'Regulasi', order_index: 1, total_slides: 8 },
      { id: 'mod-c02', code: 'HSE.CON.002', program: 'Construction', title: 'UU Jasa Konstruksi', description: 'Undang-undang Jasa Konstruksi dan implikasinya pada K3', category: 'Regulasi', order_index: 2, total_slides: 8 },
      { id: 'mod-c03', code: 'HSE.CON.003', program: 'Construction', title: 'Pengetahuan Jasa Konstruksi', description: 'Dasar-dasar industri dan manajemen proyek konstruksi', category: 'Dasar', order_index: 3, total_slides: 8 },
      { id: 'mod-c04', code: 'HSE.CON.004', program: 'Construction', title: 'Pengetahuan Dasar K3 Konstruksi', description: 'Konsep dan prinsip K3 khusus sektor konstruksi', category: 'Dasar', order_index: 4, total_slides: 8 },
      { id: 'mod-c05', code: 'HSE.CON.005', program: 'Construction', title: 'Manajemen K3 Konstruksi', description: 'Sistem manajemen K3 di proyek konstruksi', category: 'Manajemen', order_index: 5, total_slides: 8 },
      { id: 'mod-c06', code: 'HSE.CON.006', program: 'Construction', title: 'K3 Pekerjaan Konstruksi', description: 'Keselamatan kerja pada berbagai pekerjaan konstruksi', category: 'Teknis', order_index: 6, total_slides: 8 },
      { id: 'mod-c07', code: 'HSE.CON.007', program: 'Construction', title: 'Manajemen Lingkungan', description: 'Pengelolaan dampak lingkungan dalam proyek konstruksi', category: 'Lingkungan', order_index: 7, total_slides: 8 },
      { id: 'mod-c08', code: 'HSE.CON.008', program: 'Construction', title: 'K3 Peralatan Konstruksi', description: 'Keselamatan penggunaan peralatan dan tools konstruksi', category: 'Teknis', order_index: 8, total_slides: 8 },
      { id: 'mod-c09', code: 'HSE.CON.009', program: 'Construction', title: 'K3 Mekanikal & Elektrikal', description: 'K3 pekerjaan ME dan instalasi listrik konstruksi', category: 'Teknis', order_index: 9, total_slides: 8 },
      { id: 'mod-c10', code: 'HSE.CON.010', program: 'Construction', title: 'K3 Pesawat Angkat', description: 'Keselamatan crane, hoist, dan alat angkat di konstruksi', category: 'Teknis', order_index: 10, total_slides: 8 },
      { id: 'mod-c11', code: 'HSE.CON.011', program: 'Construction', title: 'K3 Perancah (Scaffolding)', description: 'Keselamatan pemasangan dan penggunaan perancah', category: 'Teknis', order_index: 11, total_slides: 8 },
      { id: 'mod-c12', code: 'HSE.CON.012', program: 'Construction', title: 'Pemadam Kebakaran', description: 'Teknik dan prosedur pemadaman kebakaran di konstruksi', category: 'Darurat', order_index: 12, total_slides: 8 },
      { id: 'mod-c13', code: 'HSE.CON.013', program: 'Construction', title: 'Tanggap Darurat Konstruksi', description: 'Prosedur tanggap darurat dan evakuasi di proyek', category: 'Darurat', order_index: 13, total_slides: 8 },
      { id: 'mod-c14', code: 'HSE.CON.014', program: 'Construction', title: 'Higiene di Konstruksi', description: 'Higiene pekerja dan sanitasi di lokasi proyek', category: 'Higiene', order_index: 14, total_slides: 8 },
      { id: 'mod-c15', code: 'HSE.CON.015', program: 'Construction', title: 'Pelatihan K3 Konstruksi', description: 'Metodologi dan program pelatihan K3 di konstruksi', category: 'Prosedur', order_index: 15, total_slides: 8 },
      { id: 'mod-c16', code: 'HSE.CON.016', program: 'Construction', title: 'Inspeksi K3 Konstruksi', description: 'Teknik inspeksi keselamatan di proyek konstruksi', category: 'Prosedur', order_index: 16, total_slides: 8 },
      { id: 'mod-c17', code: 'HSE.CON.017', program: 'Construction', title: 'Observasi Lapangan', description: 'Teknik observasi dan audit lapangan K3 konstruksi', category: 'Prosedur', order_index: 17, total_slides: 8 },
    ];
    const s = database.prepare(`INSERT OR IGNORE INTO learning_modules (id,code,program,title,description,category,order_index,total_slides) VALUES (@id,@code,@program,@title,@description,@category,@order_index,@total_slides)`);
    conModules.forEach(m => s.run(m));
  }
}

function seedQuestions() {
  const questions = [
    // HSE.BST.001 - Perundangan K3
    { id: 'q-001-1', module_code: 'HSE.BST.001', question_type: 'module', question: 'Undang-Undang Keselamatan Kerja yang menjadi dasar hukum K3 di Indonesia adalah?', options: JSON.stringify(['UU No. 1 Tahun 1970', 'UU No. 13 Tahun 2003', 'UU No. 36 Tahun 2009', 'UU No. 24 Tahun 2011']), correct_answer: 0, explanation: 'UU No. 1 Tahun 1970 tentang Keselamatan Kerja adalah dasar hukum K3 di Indonesia.', order_index: 1 },
    { id: 'q-001-2', module_code: 'HSE.BST.001', question_type: 'module', question: 'Peraturan Pemerintah yang mengatur tentang Sistem Manajemen K3 (SMK3) adalah?', options: JSON.stringify(['PP No. 50 Tahun 2012', 'PP No. 44 Tahun 2015', 'PP No. 102 Tahun 2000', 'PP No. 19 Tahun 1994']), correct_answer: 0, explanation: 'PP No. 50 Tahun 2012 mengatur tentang penerapan SMK3 di perusahaan.', order_index: 2 },
    { id: 'q-001-3', module_code: 'HSE.BST.001', question_type: 'module', question: 'Kewajiban pengusaha dalam menyediakan APD bagi tenaga kerja diatur dalam?', options: JSON.stringify(['Permenaker No. 8 Tahun 2010', 'Permenaker No. 5 Tahun 1996', 'Permenaker No. 3 Tahun 1982', 'Permenaker No. 2 Tahun 1992']), correct_answer: 0, explanation: 'Permenaker No. 8 Tahun 2010 mengatur kewajiban pengusaha menyediakan APD.', order_index: 3 },
    { id: 'q-001-4', module_code: 'HSE.BST.001', question_type: 'module', question: 'Berapa denda maksimum bagi pengusaha yang melanggar UU Keselamatan Kerja?', options: JSON.stringify(['Rp 100.000', 'Rp 500.000', 'Rp 1.000.000', 'Rp 5.000.000']), correct_answer: 0, explanation: 'Menurut UU No. 1/1970 Pasal 15, denda maksimum adalah Rp 100.000.', order_index: 4 },
    { id: 'q-001-5', module_code: 'HSE.BST.001', question_type: 'module', question: 'Panitia Pembina Keselamatan dan Kesehatan Kerja (P2K3) wajib dibentuk di perusahaan yang mempekerjakan minimal berapa orang?', options: JSON.stringify(['100 orang atau lebih', '50 orang atau lebih', '25 orang atau lebih', '10 orang atau lebih']), correct_answer: 0, explanation: 'P2K3 wajib dibentuk di perusahaan dengan 100 karyawan atau lebih, atau yang menggunakan bahan/proses berbahaya.', order_index: 5 },
    { id: 'q-001-6', module_code: 'HSE.BST.001', question_type: 'module', question: 'Standar internasional untuk Sistem Manajemen K3 yang terbaru adalah?', options: JSON.stringify(['ISO 45001:2018', 'OHSAS 18001:2007', 'ISO 9001:2015', 'ISO 14001:2015']), correct_answer: 0, explanation: 'ISO 45001:2018 adalah standar internasional terbaru untuk SMK3, menggantikan OHSAS 18001.', order_index: 6 },
    { id: 'q-001-7', module_code: 'HSE.BST.001', question_type: 'module', question: 'Ahli Keselamatan Kerja (Safety Officer) harus memiliki sertifikat kompetensi dari?', options: JSON.stringify(['Kemnaker RI', 'BPJS Ketenagakerjaan', 'Disnaker setempat', 'Asosiasi profesi K3']), correct_answer: 0, explanation: 'Sertifikat Ahli K3 Umum diterbitkan oleh Kementerian Ketenagakerjaan RI.', order_index: 7 },
    { id: 'q-001-8', module_code: 'HSE.BST.001', question_type: 'module', question: 'Laporan kecelakaan kerja harus disampaikan kepada Disnaker maksimal dalam waktu?', options: JSON.stringify(['2 x 24 jam', '1 x 24 jam', '3 x 24 jam', '7 hari']), correct_answer: 0, explanation: 'Sesuai regulasi, laporan awal kecelakaan kerja harus disampaikan dalam 2x24 jam.', order_index: 8 },
    { id: 'q-001-9', module_code: 'HSE.BST.001', question_type: 'module', question: 'Peraturan yang mengatur tentang Nilai Ambang Batas (NAB) faktor fisika di tempat kerja adalah?', options: JSON.stringify(['Permenaker No. 5 Tahun 2018', 'Permenaker No. 8 Tahun 2010', 'Permenaker No. 13 Tahun 2011', 'Permenaker No. 2 Tahun 2015']), correct_answer: 0, explanation: 'Permenaker No. 5 Tahun 2018 tentang K3 Lingkungan Kerja mengatur NAB faktor fisika dan kimia.', order_index: 9 },
    { id: 'q-001-10', module_code: 'HSE.BST.001', question_type: 'module', question: 'Yang termasuk kewajiban tenaga kerja sesuai UU No. 1 Tahun 1970 adalah?', options: JSON.stringify(['Memakai APD yang diwajibkan', 'Mengatur jadwal kerja', 'Menentukan jenis pekerjaan', 'Memilih rekan kerja']), correct_answer: 0, explanation: 'Salah satu kewajiban tenaga kerja adalah memakai APD yang telah ditetapkan.', order_index: 10 },

    // HSE.BST.005 - HIRA
    { id: 'q-005-1', module_code: 'HSE.BST.005', question_type: 'module', question: 'HIRA singkatan dari?', options: JSON.stringify(['Hazard Identification and Risk Assessment', 'Health Inspection and Risk Analysis', 'Hazard Investigation and Risk Approach', 'Health Identification and Risk Awareness']), correct_answer: 0, explanation: 'HIRA adalah Hazard Identification and Risk Assessment - metodologi identifikasi bahaya dan penilaian risiko.', order_index: 1 },
    { id: 'q-005-2', module_code: 'HSE.BST.005', question_type: 'module', question: 'Risk Score dalam matriks risiko dihitung dengan formula?', options: JSON.stringify(['Likelihood × Severity', 'Frequency + Consequence', 'Probability - Impact', 'Exposure × Duration']), correct_answer: 0, explanation: 'Risk Score = Likelihood (kemungkinan terjadi) × Severity (tingkat keparahan).', order_index: 2 },
    { id: 'q-005-3', module_code: 'HSE.BST.005', question_type: 'module', question: 'Bahaya yang berasal dari paparan bahan kimia berbahaya di tempat kerja termasuk kategori?', options: JSON.stringify(['Bahaya Kimia', 'Bahaya Fisik', 'Bahaya Biologi', 'Bahaya Ergonomi']), correct_answer: 0, explanation: 'Paparan bahan kimia berbahaya termasuk dalam kategori bahaya kimia (Chemical Hazard).', order_index: 3 },
    { id: 'q-005-4', module_code: 'HSE.BST.005', question_type: 'module', question: 'Dalam penilaian risiko, tingkat risiko CRITICAL berada pada kisaran nilai?', options: JSON.stringify(['17-25', '10-16', '5-9', '1-4']), correct_answer: 0, explanation: 'Critical (17-25), High (10-16), Medium (5-9), Low (1-4) dalam matriks 5×5.', order_index: 4 },
    { id: 'q-005-5', module_code: 'HSE.BST.005', question_type: 'module', question: 'Posisi kerja yang tidak ergonomis dalam jangka panjang dapat menyebabkan?', options: JSON.stringify(['Musculoskeletal Disorders (MSDs)', 'Keracunan kimia', 'Gangguan pendengaran', 'Penyakit paru-paru']), correct_answer: 0, explanation: 'Posisi kerja tidak ergonomis menyebabkan MSDs (gangguan muskuloskeletal).', order_index: 5 },
    { id: 'q-005-6', module_code: 'HSE.BST.005', question_type: 'module', question: 'Tahap pertama dalam proses HIRA adalah?', options: JSON.stringify(['Identifikasi bahaya', 'Penilaian risiko', 'Pengendalian risiko', 'Monitoring evaluasi']), correct_answer: 0, explanation: 'Proses HIRA dimulai dengan identifikasi bahaya sebelum penilaian dan pengendalian.', order_index: 6 },
    { id: 'q-005-7', module_code: 'HSE.BST.005', question_type: 'module', question: 'Metode HIRA yang menggunakan pendekatan "What If?" termasuk dalam teknik?', options: JSON.stringify(['HAZOP (Hazard and Operability Study)', 'FTA (Fault Tree Analysis)', 'FMEA (Failure Mode Effect Analysis)', 'Checklist Analysis']), correct_answer: 0, explanation: 'HAZOP menggunakan guide words (What If, When, Where) untuk mengidentifikasi penyimpangan.', order_index: 7 },
    { id: 'q-005-8', module_code: 'HSE.BST.005', question_type: 'module', question: 'Bahaya getaran (vibration) pada operator alat berat termasuk kategori bahaya?', options: JSON.stringify(['Bahaya Fisik', 'Bahaya Mekanik', 'Bahaya Ergonomi', 'Bahaya Kimia']), correct_answer: 0, explanation: 'Getaran adalah faktor fisika yang termasuk bahaya fisik (Physical Hazard).', order_index: 8 },
    { id: 'q-005-9', module_code: 'HSE.BST.005', question_type: 'module', question: 'Dokumen yang digunakan untuk mencatat hasil identifikasi bahaya dan penilaian risiko adalah?', options: JSON.stringify(['Risk Register', 'Incident Report', 'Safety Plan', 'Audit Checklist']), correct_answer: 0, explanation: 'Risk Register adalah dokumen formal untuk mencatat dan mengelola hasil HIRA.', order_index: 9 },
    { id: 'q-005-10', module_code: 'HSE.BST.005', question_type: 'module', question: 'Kebisingan di atas berapa dB(A) selama 8 jam kerja dianggap berbahaya bagi pendengaran?', options: JSON.stringify(['85 dB(A)', '70 dB(A)', '60 dB(A)', '90 dB(A)']), correct_answer: 0, explanation: 'NAB kebisingan adalah 85 dB(A) untuk paparan 8 jam kerja per hari.', order_index: 10 },

    // HSE.BST.006 - Pengendalian Bahaya
    { id: 'q-006-1', module_code: 'HSE.BST.006', question_type: 'module', question: 'Urutan hierarki pengendalian bahaya yang paling efektif adalah?', options: JSON.stringify(['Eliminasi → Substitusi → Engineering → Administratif → APD', 'APD → Administratif → Engineering → Substitusi → Eliminasi', 'Engineering → Eliminasi → APD → Substitusi → Administratif', 'Administratif → APD → Engineering → Eliminasi → Substitusi']), correct_answer: 0, explanation: 'Hierarchy of Controls: Eliminasi (terbaik) → Substitusi → Engineering Control → Administratif → APD (terakhir).', order_index: 1 },
    { id: 'q-006-2', module_code: 'HSE.BST.006', question_type: 'module', question: 'Mengganti bahan kimia berbahaya dengan bahan yang lebih aman disebut?', options: JSON.stringify(['Substitusi', 'Eliminasi', 'Engineering Control', 'Administrative Control']), correct_answer: 0, explanation: 'Substitusi adalah mengganti sumber bahaya dengan sesuatu yang lebih aman.', order_index: 2 },
    { id: 'q-006-3', module_code: 'HSE.BST.006', question_type: 'module', question: 'Pemasangan safety guard pada mesin termasuk pengendalian?', options: JSON.stringify(['Engineering Control', 'Administrative Control', 'APD', 'Eliminasi']), correct_answer: 0, explanation: 'Safety guard adalah pengendalian teknik (Engineering Control) yang memisahkan pekerja dari bahaya.', order_index: 3 },
    { id: 'q-006-4', module_code: 'HSE.BST.006', question_type: 'module', question: 'Pembuatan SOP (Standard Operating Procedure) termasuk pengendalian?', options: JSON.stringify(['Administrative Control', 'Engineering Control', 'Eliminasi', 'Substitusi']), correct_answer: 0, explanation: 'SOP adalah pengendalian administratif yang mengatur cara kerja yang aman.', order_index: 4 },
    { id: 'q-006-5', module_code: 'HSE.BST.006', question_type: 'module', question: 'APD untuk melindungi mata dari percikan bahan kimia adalah?', options: JSON.stringify(['Safety Goggles', 'Safety Glasses', 'Face Shield', 'Welding Mask']), correct_answer: 0, explanation: 'Safety Goggles memberikan perlindungan menyeluruh dari percikan bahan kimia ke area mata.', order_index: 5 },
    { id: 'q-006-6', module_code: 'HSE.BST.006', question_type: 'module', question: 'Mengapa eliminasi disebut pengendalian paling efektif?', options: JSON.stringify(['Menghilangkan sumber bahaya sepenuhnya', 'Paling murah biayanya', 'Paling mudah diterapkan', 'Tidak memerlukan pelatihan']), correct_answer: 0, explanation: 'Eliminasi menghilangkan bahaya sepenuhnya sehingga tidak ada risiko yang tersisa.', order_index: 6 },
    { id: 'q-006-7', module_code: 'HSE.BST.006', question_type: 'module', question: 'Rotasi kerja untuk mengurangi paparan bahaya termasuk pengendalian?', options: JSON.stringify(['Administrative Control', 'Engineering Control', 'Substitusi', 'APD']), correct_answer: 0, explanation: 'Rotasi kerja adalah pengendalian administratif yang membatasi durasi paparan terhadap bahaya.', order_index: 7 },
    { id: 'q-006-8', module_code: 'HSE.BST.006', question_type: 'module', question: 'Ventilasi lokal exhausts (LEV) yang dipasang untuk menyedot uap kimia termasuk?', options: JSON.stringify(['Engineering Control', 'Administrative Control', 'APD', 'Eliminasi']), correct_answer: 0, explanation: 'LEV adalah pengendalian teknik yang mengontrol paparan dengan menghilangkan kontaminan dari sumbernya.', order_index: 8 },
    { id: 'q-006-9', module_code: 'HSE.BST.006', question_type: 'module', question: 'Jenis respirator yang tepat untuk paparan gas beracun konsentrasi tinggi adalah?', options: JSON.stringify(['SCBA (Self Contained Breathing Apparatus)', 'Masker N95', 'Masker kain', 'Half-face respirator']), correct_answer: 0, explanation: 'SCBA memberikan suplai udara bersih sendiri, cocok untuk konsentrasi gas beracun tinggi.', order_index: 9 },
    { id: 'q-006-10', module_code: 'HSE.BST.006', question_type: 'module', question: 'LOTO (Lock Out Tag Out) adalah prosedur yang digunakan untuk?', options: JSON.stringify(['Mengunci energi berbahaya saat maintenance', 'Mengunci area kerja dari pengunjung', 'Menandai APD yang harus dipakai', 'Mencatat laporan kecelakaan']), correct_answer: 0, explanation: 'LOTO digunakan untuk mengisolasi dan mengunci energi berbahaya (listrik, hydraulic, pneumatic) saat perawatan peralatan.', order_index: 10 },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO questions
    (id, module_code, question_type, question, options, correct_answer, explanation, order_index)
    VALUES (@id, @module_code, @question_type, @question, @options, @correct_answer, @explanation, @order_index)
  `);
  questions.forEach(q => stmt.run(q));
}

function seedMissions() {
  const database = db;
  const count = (database.prepare('SELECT COUNT(*) as c FROM missions').get() as { c: number }).c;
  if (count > 0) return;

  // APELTRI = "Aksi Pelatihan Lapangan Terpadu" - Mission program for new members
  const missions = [
    {
      id: 'msn-001', code: 'M001', order_index: 1,
      title: 'Mata Elang Pertama',
      description: 'Laporkan 1 bahaya di sekitar kampus Geologi Unpad. Foto, deskripsikan, dan biarkan AI menilai risikonya!',
      category: 'field', difficulty: 'easy', points: 50, target_count: 1,
      badge_icon: '👁️', badge_name: 'Mata Elang', mission_type: 'hazard_report'
    },
    {
      id: 'msn-002', code: 'M002', order_index: 2,
      title: 'Patroli Keselamatan',
      description: 'Laporkan 5 bahaya berbeda di area kampus. Temukan bahaya fisik, kimia, biologi, ergonomi, dan lingkungan!',
      category: 'field', difficulty: 'easy', points: 200, target_count: 5,
      badge_icon: '🔍', badge_name: 'Patroli Keselamatan', mission_type: 'hazard_report'
    },
    {
      id: 'msn-003', code: 'M003', order_index: 3,
      title: 'Pejuang K3 Kampus',
      description: 'Laporkan 10 bahaya di sekitar Unpad – gedung, lab, parkir, kantin, dan lapangan. Jadilah Guardian K3 kampus!',
      category: 'field', difficulty: 'medium', points: 500, target_count: 10,
      badge_icon: '🦺', badge_name: 'Guardian K3', mission_type: 'hazard_report'
    },
    {
      id: 'msn-004', code: 'M004', order_index: 4,
      title: 'Analis Risiko Junior',
      description: 'Buat Job Safety Analysis (JSA) untuk 1 kegiatan lapangan geologi. AI membantu identifikasi bahaya tiap langkah kerja.',
      category: 'analysis', difficulty: 'medium', points: 300, target_count: 1,
      badge_icon: '📋', badge_name: 'Analis Junior', mission_type: 'jsa'
    },
    {
      id: 'msn-005', code: 'M005', order_index: 5,
      title: 'Master JSA',
      description: 'Selesaikan 3 JSA untuk kegiatan berbeda: pemetaan geologi, pengambilan sampel, dan penggunaan peralatan lab.',
      category: 'analysis', difficulty: 'hard', points: 750, target_count: 3,
      badge_icon: '🧠', badge_name: 'Master JSA', mission_type: 'jsa'
    },
    {
      id: 'msn-006', code: 'M006', order_index: 6,
      title: 'Notulis K3',
      description: 'Buat Minutes of Meeting (MoM) dari 1 rapat K3 atau diskusi keselamatan tim. Dokumentasikan action items dengan jelas!',
      category: 'documentation', difficulty: 'medium', points: 250, target_count: 1,
      badge_icon: '📝', badge_name: 'Notulis K3', mission_type: 'mom'
    },
    {
      id: 'msn-007', code: 'M007', order_index: 7,
      title: 'Promotor Keselamatan',
      description: 'Buat 1 Safety Moment Report: pilih topik K3 relevan, siapkan materi singkat, dan dokumentasikan penyampaiannya.',
      category: 'documentation', difficulty: 'medium', points: 300, target_count: 1,
      badge_icon: '📢', badge_name: 'Promotor K3', mission_type: 'safety_moment'
    },
    {
      id: 'msn-008', code: 'M008', order_index: 8,
      title: 'Safety Campaign',
      description: 'Buat kampanye K3 lengkap: laporkan 3 bahaya terkait 1 isu, buat JSA, dan buat Safety Moment Report-nya!',
      category: 'campaign', difficulty: 'hard', points: 1000, target_count: 5,
      badge_icon: '🚀', badge_name: 'Safety Campaigner', mission_type: 'campaign'
    },
    {
      id: 'msn-009', code: 'M009', order_index: 9,
      title: 'Pelajar K3',
      description: 'Selesaikan modul HSE.BST.005 (Identifikasi Bahaya) dan lulus kuis dengan nilai ≥ 70.',
      category: 'learning', difficulty: 'easy', points: 150, target_count: 1,
      badge_icon: '📚', badge_name: 'Pelajar K3', mission_type: 'learning_module'
    },
    {
      id: 'msn-010', code: 'M010', order_index: 10,
      title: 'Scholar HSE',
      description: 'Selesaikan semua 8 modul pembelajaran K3 dan raih Sertifikat HSE Digital Geologi Unpad!',
      category: 'learning', difficulty: 'expert', points: 2000, target_count: 8,
      badge_icon: '🎓', badge_name: 'Scholar HSE', mission_type: 'all_learning'
    },
    {
      id: 'msn-011', code: 'M011', order_index: 11,
      title: 'Peta Bahaya Unpad',
      description: 'Laporkan bahaya dari 5 lokasi berbeda di kampus. Bantu buat peta risiko lengkap kampus kita!',
      category: 'field', difficulty: 'hard', points: 800, target_count: 5,
      badge_icon: '🗺️', badge_name: 'Mapper Bahaya', mission_type: 'hazard_location'
    },
    {
      id: 'msn-012', code: 'M012', order_index: 12,
      title: 'HSE Ambassador',
      description: 'Selesaikan SEMUA misi APELTRI: 10 laporan bahaya, 3 JSA, 1 MoM, 1 Safety Moment, 8 modul. Jadilah Duta HSE Geologi Unpad!',
      category: 'ultimate', difficulty: 'expert', points: 5000, target_count: 23,
      badge_icon: '⭐', badge_name: 'HSE Ambassador', mission_type: 'all_missions'
    },
  ];

  const stmt = database.prepare(`
    INSERT OR IGNORE INTO missions
    (id, code, title, description, category, difficulty, points, badge_icon, badge_name, target_count, mission_type, order_index)
    VALUES (@id, @code, @title, @description, @category, @difficulty, @points, @badge_icon, @badge_name, @target_count, @mission_type, @order_index)
  `);
  missions.forEach(m => stmt.run(m));
}
