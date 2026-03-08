import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, AlertTriangle, BookOpen, User, Trophy, FileText, BarChart2, X, Settings, LogOut, Megaphone, Shield, Award, Globe, Mountain } from 'lucide-react';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';

// ── Nav definitions ──────────────────────────────────────────────────────────

const NAV_MEMBER = [
  { path: '/app', icon: Home, label: 'Home', exact: true },
  { path: '/app/map', icon: Map, label: 'Peta' },
  { path: '/app/hazards/new', icon: AlertTriangle, label: 'Lapor', highlight: true },
  { path: '/app/learning', icon: BookOpen, label: 'Belajar' },
  { path: '/app/profile', icon: User, label: 'Profil' },
];

const NAV_CANDIDATE = [
  { path: '/app', icon: Home, label: 'Home', exact: true },
  { path: '/app/learning', icon: BookOpen, label: 'Belajar' },
  { path: '/app/hazards/new', icon: AlertTriangle, label: 'Lapor', highlight: true },
  { path: '/app/missions', icon: Trophy, label: 'APELTRI' },
  { path: '/app/profile', icon: User, label: 'Profil' },
];

const NAV_PUBLIC = [
  { path: '/app/hazards', icon: AlertTriangle, label: 'Bahaya' },
  { path: '/app/map', icon: Map, label: 'Peta' },
  { path: '/app/hazards/new', icon: AlertTriangle, label: 'Lapor', highlight: true },
  { path: '/app/k3-regulations', icon: Shield, label: 'Regulasi' },
  { path: '/app/profile', icon: User, label: 'Profil' },
];

const DRAWER_MEMBER = [
  { path: '/app', icon: Home, label: 'Dashboard', exact: true },
  { path: '/app/geodashboard', icon: BarChart2, label: 'GeoDashboard' },
  { path: '/app/map', icon: Map, label: 'Peta Bahaya' },
  { path: '/app/hazards', icon: AlertTriangle, label: 'Laporan Bahaya' },
  { path: '/app/jsa', icon: FileText, label: 'Job Safety Analysis' },
  { path: '/app/safety-moment', icon: FileText, label: 'Safety Moment' },
  { path: '/app/mom', icon: FileText, label: 'Rapat K3 (MoM)' },
  { path: '/app/learning', icon: BookOpen, label: 'Pembelajaran K3' },
  { path: '/app/missions', icon: Trophy, label: 'APELTRI Misi' },
  { path: '/app/reports', icon: BarChart2, label: 'Laporan & Export' },
  { path: '/app/campaign', icon: Megaphone, label: 'Safety Campaign' },
  { path: '/app/k3-regulations', icon: Shield, label: 'Regulasi K3' },
  { path: '/app/certificate', icon: Award, label: 'Sertifikat' },
  { path: '/app/mini-games', icon: Trophy, label: 'Mini Games' },
  { path: '/app/geonova', icon: Mountain, label: 'Geonova' },
];

const DRAWER_CANDIDATE = [
  { path: '/app', icon: Home, label: 'Dashboard', exact: true },
  { path: '/app/geodashboard', icon: BarChart2, label: 'GeoDashboard' },
  { path: '/app/hazards', icon: AlertTriangle, label: 'Laporan Bahaya' },
  { path: '/app/map', icon: Map, label: 'Peta Bahaya' },
  { path: '/app/learning', icon: BookOpen, label: 'Pembelajaran K3' },
  { path: '/app/missions', icon: Trophy, label: 'APELTRI Misi' },
  { path: '/app/k3-regulations', icon: Shield, label: 'Regulasi K3' },
  { path: '/app/certificate', icon: Award, label: 'Sertifikat' },
  { path: '/app/mini-games', icon: Trophy, label: 'Mini Games' },
  { path: '/app/geonova', icon: Mountain, label: 'Geonova' },
];

const DRAWER_PUBLIC = [
  { path: '/app/hazards', icon: AlertTriangle, label: 'Laporan Bahaya' },
  { path: '/app/geodashboard', icon: BarChart2, label: 'GeoDashboard' },
  { path: '/app/map', icon: Map, label: 'Peta Bahaya' },
];

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Admin HSE',     color: 'bg-red-100 text-red-700' },
  member:    { label: 'Anggota HSE',   color: 'bg-green-100 text-green-700' },
  candidate: { label: 'Calon Anggota', color: 'bg-orange-100 text-orange-700' },
  public:    { label: 'Umum',          color: 'bg-blue-100 text-blue-700' },
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, drawerOpen, setDrawerOpen } = useStore();

  const role = user?.role ?? 'public';

  const navItems = role === 'public' ? NAV_PUBLIC
    : role === 'candidate' ? NAV_CANDIDATE
    : NAV_MEMBER;

  const drawerItems = role === 'public' ? DRAWER_PUBLIC
    : role === 'candidate' ? DRAWER_CANDIDATE
    : DRAWER_MEMBER;

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const goToProfile = () => { navigate('/app/profile'); setDrawerOpen(false); };
  const roleInfo = ROLE_LABEL[role] ?? ROLE_LABEL.public;

  return (
    <div className="flex flex-col w-full min-h-dvh relative">

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" style={{ maxWidth: '430px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-[280px] bg-white h-full flex flex-col shadow-2xl overflow-hidden">

            <div className="bg-primary-600 px-4 py-5 relative overflow-hidden">
              <div className="blob w-24 h-24 bg-primary-400 opacity-25 -top-6 -right-6 absolute" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white overflow-hidden shadow">
                    <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm leading-tight">GEMS Unpad</p>
                    <p className="text-primary-200 text-xs">Badan Khusus FTG Unpad</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={goToProfile} className="p-1.5 bg-white/20 rounded-lg text-white">
                    <Settings size={16} />
                  </button>
                  <button onClick={() => setDrawerOpen(false)} className="p-1.5 bg-white/20 rounded-lg text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <button onClick={goToProfile}
                className="mt-4 flex items-center gap-2.5 relative z-10 w-full text-left hover:bg-white/10 rounded-xl p-1.5 -mx-1.5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold truncate">{user?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                    {user?.hse_number && role === 'member' && (
                      <span className="text-primary-200 text-[10px] truncate">{user.hse_number}</span>
                    )}
                  </div>
                </div>
                <Settings size={14} className="text-white/60 flex-shrink-0" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {drawerItems.map(item => (
                <button key={item.path}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all
                    ${isActive(item.path, (item as any).exact)
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-green-50 hover:text-primary-700'}`}>
                  <item.icon size={18} className="flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Public promo */}
            {role === 'public' && (
              <div className="mx-3 mb-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={14} className="text-primary-600" />
                  <p className="text-xs font-bold text-primary-700">Akun Umum</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">Daftar sebagai Calon Anggota untuk akses fitur APELTRI & materi K3.</p>
              </div>
            )}

            <div className="p-4 border-t border-gray-100">
              <button onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors">
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 w-full overflow-x-hidden pb-20">
        <Outlet />
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map(item => {
            const active = isActive(item.path, (item as any).exact);
            if (item.highlight) return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="flex flex-col items-center -mt-4">
                <div className="w-[52px] h-[52px] bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-300/50">
                  <item.icon size={22} color="white" />
                </div>
                <span className="text-xs text-primary-600 font-semibold mt-0.5">{item.label}</span>
              </button>
            );
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[44px]">
                <item.icon size={21} className={active ? 'text-primary-600' : 'text-gray-400'} />
                <span className={`text-[11px] font-medium leading-tight ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
