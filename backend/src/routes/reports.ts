import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import { getDb } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GeoDashboard - real-time hazard condition
router.get('/geodashboard', (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const stats = {
    total_reports: (db.prepare('SELECT COUNT(*) as c FROM hazard_reports').get() as any).c,
    today_reports: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE date(created_at)=?").get(today) as any).c,
    week_reports: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE date(created_at)>=?").get(weekAgo) as any).c,
    open_reports: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE status='open'").get() as any).c,
    critical_open: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE ai_risk_level='Critical' AND status='open'").get() as any).c,
    high_open: (db.prepare("SELECT COUNT(*) as c FROM hazard_reports WHERE ai_risk_level='High' AND status='open'").get() as any).c,

    risk_distribution: db.prepare("SELECT ai_risk_level as level, COUNT(*) as count FROM hazard_reports GROUP BY ai_risk_level").all(),
    category_distribution: db.prepare("SELECT ai_category as category, COUNT(*) as count FROM hazard_reports GROUP BY ai_category ORDER BY count DESC LIMIT 20").all(),
    main_category_distribution: db.prepare(`
      SELECT
        CASE WHEN instr(ai_category, ': ') > 0
          THEN substr(ai_category, 1, instr(ai_category, ': ') - 1)
          ELSE ai_category
        END as main_cat,
        COUNT(*) as count
      FROM hazard_reports
      GROUP BY main_cat
      ORDER BY count DESC
    `).all(),
    recent_critical: db.prepare(`SELECT h.*, u.name as user_name FROM hazard_reports h
      JOIN users u ON h.user_id = u.id WHERE h.ai_risk_level IN ('Critical','High')
      ORDER BY h.created_at DESC LIMIT 5`).all(),
    monthly_trend: db.prepare(`SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM hazard_reports WHERE created_at >= ? GROUP BY month ORDER BY month`).all(monthAgo),
    all_markers: db.prepare(`SELECT id, lat, lng, ai_risk_level, ai_category, location_name,
      description, photo_url, status, created_at FROM hazard_reports WHERE lat IS NOT NULL AND lng IS NOT NULL`).all(),
    active_users_today: (db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM hazard_reports WHERE date(created_at)=?`).get(today) as any).c,
  };

  res.json(stats);
});

router.get('/download', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { period, from, to } = req.query as Record<string, string>;
  const now = new Date();
  let startDate = '';

  if (from && to) {
    startDate = from;
  } else {
    switch (period) {
      case 'daily': startDate = now.toISOString().split('T')[0]; break;
      case 'weekly': startDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]; break;
      case 'monthly': startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`; break;
      case 'quarterly': {
        const q = Math.floor(now.getMonth() / 3);
        startDate = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`; break;
      }
      default: startDate = now.toISOString().split('T')[0];
    }
  }

  const endDate = to || now.toISOString().split('T')[0];
  const reports = db.prepare(`SELECT h.*, u.name as user_name, u.hse_number
    FROM hazard_reports h JOIN users u ON h.user_id = u.id
    WHERE date(h.created_at) >= ? AND date(h.created_at) <= ?
    ORDER BY h.created_at DESC`).all(startDate, endDate) as any[];

  const summary = {
    period, from: startDate, to: endDate,
    total: reports.length,
    by_risk: { Critical: 0, High: 0, Medium: 0, Low: 0 },
    by_status: { open: 0, in_progress: 0, closed: 0 },
  };
  reports.forEach(r => {
    (summary.by_risk as any)[r.ai_risk_level] = ((summary.by_risk as any)[r.ai_risk_level] || 0) + 1;
    (summary.by_status as any)[r.status] = ((summary.by_status as any)[r.status] || 0) + 1;
  });

  res.json({ summary, reports });
});

router.get('/notifications', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user!.id);
  res.json(notifs);
});

router.patch('/notifications/:id/read', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ message: 'Notifikasi ditandai sudah dibaca' });
});

// ── Export endpoints ──────────────────────────────────────────────────────────

function getExportReports(db: ReturnType<typeof getDb>, query: Record<string, string>) {
  const { from, to, risk_level, status } = query;
  let q = `SELECT h.*, u.name as user_name, u.hse_number
    FROM hazard_reports h JOIN users u ON h.user_id = u.id WHERE 1=1`;
  const params: unknown[] = [];
  if (from)        { q += ' AND date(h.created_at) >= ?'; params.push(from); }
  if (to)          { q += ' AND date(h.created_at) <= ?'; params.push(to); }
  if (risk_level)  { q += ' AND h.ai_risk_level = ?';     params.push(risk_level); }
  if (status)      { q += ' AND h.status = ?';            params.push(status); }
  q += ' ORDER BY h.created_at DESC';
  return db.prepare(q).all(...params) as any[];
}

router.get('/export/csv', (req: AuthRequest, res: Response) => {
  if (!['admin', 'member'].includes(req.user!.role)) return res.status(403).json({ error: 'Tidak diizinkan' });
  const db = getDb();
  const reports = getExportReports(db, req.query as Record<string, string>);

  const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const headers = ['No','Tanggal','Pelapor','No. HSE','Kategori','Tingkat Risiko',
    'Deskripsi Bahaya','Lokasi','Status','Tindakan Segera','Rekomendasi',
    'Tindakan Korektif','Deadline Korektif','Respons Admin'];
  const rows = [headers.join(','), ...reports.map((r, i) => [
    i + 1,
    esc(new Date(r.created_at).toLocaleDateString('id-ID')),
    esc(r.user_name), esc(r.hse_number), esc(r.ai_category), esc(r.ai_risk_level),
    esc(r.ai_hazard_description || r.description), esc(r.location_name), esc(r.status),
    esc(r.ai_immediate_action), esc(r.ai_recommendation),
    esc(r.corrective_action), esc(r.corrective_action_deadline), esc(r.admin_response),
  ].join(','))];

  const filename = `laporan_bahaya_${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + rows.join('\n'));
});

router.get('/export/excel', async (req: AuthRequest, res: Response) => {
  if (!['admin', 'member'].includes(req.user!.role)) return res.status(403).json({ error: 'Tidak diizinkan' });
  const db = getDb();
  const reports = getExportReports(db, req.query as Record<string, string>);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'GEMS Unpad HSE System';
  const ws = wb.addWorksheet('Laporan Bahaya');

  ws.columns = [
    { header: 'No',              key: 'no',         width: 5  },
    { header: 'Tanggal',         key: 'tanggal',    width: 14 },
    { header: 'Pelapor',         key: 'pelapor',    width: 20 },
    { header: 'No. HSE',         key: 'hse',        width: 16 },
    { header: 'Kategori',        key: 'kategori',   width: 30 },
    { header: 'Tingkat Risiko',  key: 'risiko',     width: 14 },
    { header: 'Lokasi',          key: 'lokasi',     width: 22 },
    { header: 'Status',          key: 'status',     width: 12 },
    { header: 'Deskripsi',       key: 'deskripsi',  width: 40 },
    { header: 'Tindakan Segera', key: 'segera',     width: 40 },
    { header: 'Rekomendasi',     key: 'rekomendasi',width: 40 },
    { header: 'Tindakan Korektif',key:'korektif',   width: 30 },
    { header: 'Deadline',        key: 'deadline',   width: 14 },
    { header: 'Respons Admin',   key: 'admin',      width: 30 },
  ];

  // Header row styling
  ws.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const RISK_COLORS: Record<string, string> = {
    Critical: 'FFEF4444', High: 'FFF97316', Medium: 'FFEAB308', Low: 'FF22C55E'
  };

  reports.forEach((r, i) => {
    const row = ws.addRow({
      no: i + 1,
      tanggal: new Date(r.created_at).toLocaleDateString('id-ID'),
      pelapor: r.user_name, hse: r.hse_number, kategori: r.ai_category,
      risiko: r.ai_risk_level, lokasi: r.location_name, status: r.status,
      deskripsi: r.ai_hazard_description || r.description,
      segera: r.ai_immediate_action, rekomendasi: r.ai_recommendation,
      korektif: r.corrective_action, deadline: r.corrective_action_deadline,
      admin: r.admin_response,
    });
    row.alignment = { wrapText: true, vertical: 'top' };
    const riskColor = RISK_COLORS[r.ai_risk_level];
    if (riskColor) {
      const cell = row.getCell('risiko');
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: riskColor } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="laporan_bahaya_${new Date().toISOString().split('T')[0]}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

export default router;
