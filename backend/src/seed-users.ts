import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { getDb } from './db/schema';

const dummyUsers = [
  {
    name: 'Admin HSE',
    email: 'admin@geologi.unpad.ac.id',
    password: 'Admin123!',
    hse_number: 'HSE-ADMIN-001',
    role: 'admin',
    program_studi: 'Teknik Geologi',
    points: 500,
  },
  {
    name: 'Budi Santoso',
    email: 'budi@geologi.unpad.ac.id',
    password: 'Password123',
    hse_number: 'HSE-2024-001',
    role: 'mahasiswa',
    program_studi: 'Teknik Geologi',
    points: 350,
  },
  {
    name: 'Siti Rahayu',
    email: 'siti@geologi.unpad.ac.id',
    password: 'Password123',
    hse_number: 'HSE-2024-002',
    role: 'mahasiswa',
    program_studi: 'Teknik Geologi',
    points: 420,
  },
  {
    name: 'Rizky Pratama',
    email: 'rizky@geologi.unpad.ac.id',
    password: 'Password123',
    hse_number: 'HSE-2024-003',
    role: 'mahasiswa',
    program_studi: 'Teknik Geologi',
    points: 180,
  },
  {
    name: 'Dewi Lestari',
    email: 'dewi@geologi.unpad.ac.id',
    password: 'Password123',
    hse_number: 'HSE-2024-004',
    role: 'mahasiswa',
    program_studi: 'Teknik Geologi',
    points: 290,
  },
  {
    name: 'Koordinator K3',
    email: 'koordinator@geologi.unpad.ac.id',
    password: 'Koordinator123',
    hse_number: 'HSE-KOOR-001',
    role: 'koordinator',
    program_studi: 'Teknik Geologi',
    points: 1000,
  },
];

async function seedUsers() {
  const db = getDb();
  console.log('\n=== Seeding Dummy Users ===\n');

  for (const u of dummyUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR hse_number = ?').get(u.email, u.hse_number);
    if (existing) {
      console.log(`⚠️  Already exists: ${u.email}`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    const id = uuid();
    db.prepare(`INSERT INTO users (id, name, email, password, hse_number, role, program_studi, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, u.name, u.email, hash, u.hse_number, u.role, u.program_studi, u.points);
    console.log(`✅ Created: ${u.name} | ${u.email} | ${u.hse_number} | Password: ${u.password}`);
  }

  console.log('\n=== Done! Dummy accounts ready. ===\n');
  console.log('📋 Login credentials:');
  console.log('────────────────────────────────────────────────────────');
  dummyUsers.forEach(u => {
    console.log(`  ${u.role.toUpperCase().padEnd(12)} | ${u.email.padEnd(42)} | ${u.password}`);
  });
  console.log('────────────────────────────────────────────────────────\n');
}

seedUsers().catch(console.error);
