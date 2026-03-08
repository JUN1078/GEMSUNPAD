import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, Trophy, Star, BookOpen, AlertTriangle, ChevronRight, Camera, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useStore } from '../store/useStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setAuth, token, logout } = useStore();
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [cert, setCert] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/reports/geodashboard').then(r => setStats(r.data)).catch(() => {});
    api.get('/missions/badges').then(r => setBadges(r.data.slice(0, 6))).catch(() => {});
    api.get('/learning/certificate').then(r => setCert(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post('/auth/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAuth(data.user, token!);
      toast.success('Foto profil diperbarui!');
    } catch {
      toast.error('Gagal mengunggah foto');
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const avatarUrl = user?.avatar ? `http://localhost:3001${user.avatar}` : null;

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-unpad-blue to-primary-700 px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="blob w-48 h-48 bg-yellow-300 opacity-10 -top-16 -right-16 absolute" />
        <div className="relative z-10 text-center">
          {/* Avatar with upload button */}
          <div className="relative w-20 h-20 mx-auto mb-3">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-primary-700">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-primary-600">
              {uploadingAvatar
                ? <span className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                : <Camera size={13} className="text-primary-600" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <h2 className="text-white font-black text-xl">{user?.name}</h2>
          <p className="text-blue-200 text-sm">{user?.hse_number}</p>
          <p className="text-blue-200 text-xs">{user?.program_studi || user?.role}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 bg-white/15 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Star size={14} className="text-yellow-300" fill="currentColor" />
            <span className="text-white font-black">{user?.points || 0} poin</span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 space-y-4 pb-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Laporan', value: stats?.total_reports || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Badge', value: badges.length, icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Modul', value: 0, icon: BookOpen, color: 'text-primary-600', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={18} className={s.color} />
              </div>
              <p className="text-xl font-black text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Member Card button — only for member role */}
        {user?.role === 'member' && (
          <button onClick={() => navigate('/app/member-card')}
            className="w-full bg-gradient-to-r from-primary-600 to-unpad-blue rounded-2xl p-4 text-left shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Kartu Anggota HSE</p>
                  <p className="text-primary-100 text-xs">GEMS Unpad · {user.hse_number}</p>
                </div>
              </div>
              <ChevronRight className="text-white/70" size={20} />
            </div>
          </button>
        )}

        {/* Certificate */}
        {cert ? (
          <button onClick={() => navigate('/app/certificate')} className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-4 text-left shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-white" />
                <div>
                  <p className="text-white font-black">Sertifikat HSE Digital</p>
                  <p className="text-yellow-100 text-xs">{cert.certificate_number}</p>
                </div>
              </div>
              <ChevronRight className="text-white" size={20} />
            </div>
          </button>
        ) : (
          <button onClick={() => navigate('/app/learning')} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Award size={20} className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-700 text-sm">Belum ada sertifikat</p>
                <p className="text-xs text-gray-400">Selesaikan semua modul untuk mendapatkan sertifikat</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </button>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 text-sm">Badge APELTRI</p>
              <button onClick={() => navigate('/app/missions?tab=badges')} className="text-xs text-primary-600 font-semibold">Semua</button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {badges.map((b: any) => (
                <div key={b.id} className="aspect-square bg-yellow-50 rounded-xl flex items-center justify-center text-xl border border-yellow-100">
                  {b.badge_icon}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {[
            { label: 'Peta Bahaya', icon: '🗺️', path: '/app/map' },
            { label: 'GeoDashboard', icon: '📊', path: '/app/geodashboard' },
            { label: 'APELTRI Misi', icon: '🏆', path: '/app/missions' },
            { label: 'Laporan & Export', icon: '📥', path: '/app/reports' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-base">{item.icon}</span>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">{item.label}</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button onClick={handleLogout}
          className="w-full py-3.5 border-2 border-red-200 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </div>
  );
}
