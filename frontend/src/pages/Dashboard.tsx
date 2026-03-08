import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Map, BookOpen, Trophy, FileText, Bell, ChevronRight, Star, TrendingUp, Menu, Megaphone, Shield, Award, Lock, Zap, Mountain } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';
import HazardDetailSheet from '../components/HazardDetailSheet';

const RISK_COLOR: Record<string, string> = {
  Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-500'
};
const RISK_BG: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 border-red-100', High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-yellow-50 text-yellow-700 border-yellow-100', Low: 'bg-green-50 text-green-700 border-green-100'
};

// roles that can access each action (empty = all)
const quickActions = [
  { icon: AlertTriangle, label: 'Lapor\nBahaya',   path: '/app/hazards/new',    bg: 'bg-red-500',    roles: [] },
  { icon: Map,           label: 'Geo\nDashboard',   path: '/app/geodashboard',   bg: 'bg-unpad-blue', roles: [] },
  { icon: FileText,      label: 'Buat\nJSA',        path: '/app/jsa',            bg: 'bg-orange-500', roles: ['admin','member'] },
  { icon: FileText,      label: 'Safety\nMoment',   path: '/app/safety-moment',  bg: 'bg-purple-500', roles: ['admin','member'] },
  { icon: FileText,      label: 'Rapat\nK3 (MoM)',  path: '/app/mom',            bg: 'bg-teal-500',   roles: ['admin','member'] },
  { icon: BookOpen,      label: 'Materi\nK3',        path: '/app/learning',       bg: 'bg-primary-600',roles: ['admin','member','candidate'] },
  { icon: Trophy,        label: 'APELTRI\nMisi',    path: '/app/missions',       bg: 'bg-unpad-gold', roles: ['admin','member','candidate'] },
  { icon: TrendingUp,    label: 'Laporan\n& Export', path: '/app/reports',        bg: 'bg-gray-600',   roles: ['admin','member'] },
  { icon: Megaphone,     label: 'Safety\nCampaign',  path: '/app/campaign',       bg: 'bg-pink-500',   roles: ['admin','member'] },
  { icon: Shield,        label: 'Regulasi\nK3',      path: '/app/k3-regulations', bg: 'bg-indigo-600', roles: ['admin','member','candidate'] },
  { icon: Award,         label: 'Sertifikat',        path: '/app/certificate',    bg: 'bg-yellow-500', roles: ['admin','member','candidate'] },
  { icon: Mountain,      label: 'Geonova',           path: '/app/geonova',        bg: 'bg-orange-500', roles: [] },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setDrawerOpen } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [missions, setMissions] = useState<any>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [learningModules, setLearningModules] = useState<any[]>([]);
  const [selectedHazard, setSelectedHazard] = useState<any>(null);

  useEffect(() => {
    api.get('/reports/geodashboard').then(r => setStats(r.data)).catch(() => {});
    api.get('/hazards?limit=5').then(r => setRecent(r.data.reports || [])).catch(() => {});
    api.get('/missions').then(r => setMissions(r.data)).catch(() => {});
    api.get('/learning/modules').then(r => setLearningModules(r.data || [])).catch(() => {});
    api.get('/reports/notifications').then(r => {
      setNotifCount(r.data.filter((n: any) => !n.is_read).length);
    }).catch(() => {});
  }, []);

  const role = user?.role ?? 'public';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Semangat Pagi';
    if (h < 15) return 'Semangat Siang';
    if (h < 18) return 'Semangat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      {/* Header */}
      <div className="bg-primary-600 relative overflow-hidden pt-safe">
        <div className="blob w-48 h-48 bg-primary-400 opacity-30 -top-12 -right-12 absolute" />
        <div className="blob w-32 h-32 bg-primary-800 opacity-20 bottom-0 -left-8 absolute" />
        <div className="blob w-24 h-24 bg-unpad-gold opacity-15 top-4 right-16 absolute" />

        <div className="relative z-10 px-5 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-lg overflow-hidden">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-primary-100 text-xs font-medium">GEMS Unpad · HSE Geologi Unpad</p>
                <h1 className="text-white font-black text-base leading-tight">{greeting()}, {user?.name?.split(' ')[0]}!</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/app/reports')} className="relative p-2.5 bg-white/20 rounded-xl">
                <Bell size={20} color="white" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {notifCount}
                  </span>
                )}
              </button>
              <button onClick={() => setDrawerOpen(true)} className="p-2.5 bg-white/20 rounded-xl">
                <Menu size={20} color="white" />
              </button>
            </div>
          </div>

          {/* User stats */}
          <div className="bg-white/15 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 font-black text-base">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{user?.name}</p>
                <p className="text-primary-100 text-xs">{user?.hse_number} · {user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-unpad-gold/20 px-3 py-1.5 rounded-xl">
              <Star size={14} className="text-yellow-300" fill="currentColor" />
              <span className="text-white font-black text-sm">{user?.points || 0}</span>
              <span className="text-primary-100 text-xs">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hazard Stats ── */}
      <div className="mx-4 -mt-4 relative z-10 bg-white rounded-2xl shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-xs font-bold text-gray-700">Laporan Bahaya</span>
          </div>
          <button onClick={() => navigate('/app/hazards')} className="text-xs text-primary-600 font-semibold flex items-center gap-0.5">
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: stats?.total_reports ?? 0, color: 'bg-gray-100', text: 'text-gray-800' },
            { label: 'Hari ini', value: stats?.today_reports ?? 0, color: 'bg-primary-600', text: 'text-white' },
            { label: 'Terbuka', value: stats?.open_reports ?? 0, color: 'bg-orange-500', text: 'text-white' },
            { label: 'Critical', value: stats?.critical_open ?? 0, color: 'bg-red-500', text: 'text-white' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-2.5 text-center`}>
              <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
              <p className={`text-[11px] font-medium mt-0.5 ${s.text} opacity-80`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* APELTRI Mission Progress */}
        {missions && (
          <button className="w-full bg-gradient-to-r from-unpad-blue to-primary-700 rounded-2xl p-4 text-white text-left"
            onClick={() => navigate('/app/missions')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-yellow-300" />
                <span className="font-bold text-sm">APELTRI – Misi Aktif</span>
              </div>
              <ChevronRight size={16} className="text-white/60" />
            </div>
            <div className="bg-white/20 rounded-full h-2 mb-2">
              <div className="bg-yellow-300 h-2 rounded-full transition-all"
                style={{ width: `${missions.stats.total > 0 ? (missions.stats.completed / missions.stats.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-blue-100">{missions.stats.completed}/{missions.stats.total} misi selesai · {missions.stats.total_points} poin</p>
          </button>
        )}

        {/* Learning Progress */}
        {learningModules.length > 0 && (() => {
          const completed = learningModules.filter(m => m.progress?.status === 'completed').length;
          const total = learningModules.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-green-100 text-left"
              onClick={() => navigate('/app/learning')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Progress Pembelajaran K3</p>
                    <p className="text-xs text-gray-500">Basic Safety Training (BST)</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <div className="bg-gray-100 rounded-full h-2.5 mb-2">
                <div className="bg-primary-600 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">{completed}/{total} modul selesai</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'}`}>
                  {pct === 100 ? '✓ Siap Ujian Final' : `${pct}%`}
                </span>
              </div>
              {pct === 100 && (
                <div className="mt-2 bg-yellow-50 rounded-xl px-3 py-2 flex items-center gap-2 border border-yellow-100">
                  <Award size={14} className="text-yellow-600" />
                  <p className="text-xs font-bold text-yellow-700">Ikuti Ujian Final untuk raih Sertifikat!</p>
                </div>
              )}
            </button>
          );
        })()}

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">Aksi Cepat</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(a => {
              const locked = a.roles.length > 0 && !a.roles.includes(role);
              return (
                <button key={a.path}
                  onClick={() => locked ? toast.error('Fitur ini hanya untuk Anggota HSE') : navigate(a.path)}
                  className={`flex flex-col items-center gap-1.5 group ${locked ? 'opacity-50 grayscale' : ''}`}>
                  <div className={`w-14 h-14 ${a.bg} rounded-2xl flex items-center justify-center shadow-sm transition-transform relative ${!locked ? 'group-active:scale-95' : ''}`}>
                    <a.icon size={22} color="white" />
                    {locked && (
                      <div className="absolute inset-0 rounded-2xl flex items-end justify-end p-1">
                        <Lock size={11} className="text-white/90 drop-shadow" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight whitespace-pre-line">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution */}
        {stats?.risk_distribution && stats.risk_distribution.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-primary-600" />
                <h2 className="text-sm font-bold text-gray-800">Distribusi Risiko</h2>
              </div>
              <button onClick={() => navigate('/app/geodashboard')} className="text-xs text-primary-600 font-semibold flex items-center gap-1">
                GeoDashboard <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {(['Critical', 'High', 'Medium', 'Low'] as const).map(level => {
                const d = stats.risk_distribution.find((r: any) => r.level === level);
                const count = d?.count || 0;
                const pct = stats.total_reports > 0 ? (count / stats.total_reports) * 100 : 0;
                return (
                  <div key={level} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${RISK_COLOR[level]} flex-shrink-0`} />
                    <span className="text-xs text-gray-600 w-14 font-medium">{level}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${RISK_COLOR[level]} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Hazards – clickable */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-800">Laporan Terbaru</h2>
              <button onClick={() => navigate('/app/hazards')} className="text-xs text-primary-600 font-semibold flex items-center gap-1">
                Semua <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2.5">
              {recent.map(r => (
                <button key={r.id} onClick={() => setSelectedHazard(r)}
                  className="w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-green-50 text-left active:scale-98 transition-transform">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {r.photo_url && <img src={`http://localhost:3001${r.photo_url}`} className="w-full h-full object-cover" alt="hazard" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${RISK_BG[r.ai_risk_level] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                        {r.ai_risk_level}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.ai_category || 'Bahaya'}</p>
                    <p className="text-xs text-gray-500 truncate">{r.location_name || r.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={12} className="text-yellow-500" />
                    <span className="text-xs font-bold text-gray-400">
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {recent.length === 0 && !stats && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={28} className="text-primary-600" />
            </div>
            <p className="text-gray-600 font-semibold">Belum ada laporan bahaya</p>
            <p className="text-gray-400 text-sm mt-1">Mulai laporkan bahaya di sekitar kampus</p>
            <button onClick={() => navigate('/app/hazards/new')}
              className="mt-4 px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl shadow-sm">
              + Lapor Sekarang
            </button>
          </div>
        )}
      </div>

      <HazardDetailSheet hazard={selectedHazard} onClose={() => setSelectedHazard(null)} />
    </div>
  );
}
