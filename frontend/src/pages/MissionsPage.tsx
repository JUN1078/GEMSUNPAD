import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, Lock, CheckCircle, ChevronRight, Zap } from 'lucide-react';
import api from '../lib/api';

const DIFF_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
};
const DIFF_LABEL: Record<string, string> = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit', expert: 'Expert' };

const CAT_COLOR: Record<string, string> = {
  field: 'bg-blue-500', analysis: 'bg-purple-500', documentation: 'bg-teal-500',
  campaign: 'bg-orange-500', learning: 'bg-primary-600', ultimate: 'bg-unpad-gold',
};
const CAT_LABEL: Record<string, string> = {
  field: '🏕️ Lapangan', analysis: '🔬 Analisis', documentation: '📝 Dokumentasi',
  campaign: '📢 Kampanye', learning: '📚 Belajar', ultimate: '⭐ Ultimate',
};

export default function MissionsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tab, setTab] = useState<'missions' | 'badges' | 'leaderboard'>('missions');

  useEffect(() => {
    api.get('/missions').then(r => setData(r.data)).catch(() => {});
    api.get('/missions/badges').then(r => setBadges(r.data)).catch(() => {});
    api.get('/missions/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {});
  }, []);

  const missions = data?.missions || [];
  const stats = data?.stats || {};

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-unpad-blue via-primary-700 to-primary-600 relative overflow-hidden">
        <div className="blob w-48 h-48 bg-yellow-300 opacity-15 -top-12 -right-12 absolute" />
        <div className="blob w-32 h-32 bg-blue-300 opacity-20 bottom-0 -left-8 absolute" />
        <div className="relative z-10 px-5 pt-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white">APELTRI</h1>
              <p className="text-blue-200 text-xs">Aksi Pelatihan Lapangan Terpadu</p>
            </div>
          </div>

          {/* Mission stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{stats.completed || 0}</p>
              <p className="text-blue-200 text-xs mt-0.5">Selesai</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-yellow-300">{stats.total_points || 0}</p>
              <p className="text-blue-200 text-xs mt-0.5">Poin</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{badges.length}</p>
              <p className="text-blue-200 text-xs mt-0.5">Badge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-green-100 px-5">
        <div className="flex">
          {(['missions', 'badges', 'leaderboard'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-all
                ${tab === t ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}>
              {t === 'missions' ? 'Misi' : t === 'badges' ? 'Badge' : 'Leaderboard'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* Missions tab */}
        {tab === 'missions' && (
          <div className="space-y-3">
            {missions.map((m: any) => {
              const p = m.progress;
              const done = p.status === 'completed';
              const started = p.status === 'in_progress';
              const pct = Math.min(100, (p.current_count / m.target_count) * 100);

              return (
                <div key={m.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all
                    ${done ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
                      ${done ? 'bg-green-200' : CAT_COLOR[m.category] || 'bg-gray-200'} ${done ? '' : 'text-white'}`}>
                      {done ? '✅' : m.badge_icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFF_COLOR[m.difficulty]}`}>
                          {DIFF_LABEL[m.difficulty]}
                        </span>
                        <span className="text-xs text-gray-400">{CAT_LABEL[m.category]}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-800">{m.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description}</p>

                      {!done && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{p.current_count}/{m.target_count}</span>
                            <span className="font-semibold text-primary-600">{Math.round(pct)}%</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-1.5">
                            <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Zap size={12} className="text-yellow-500" />
                        <span className="text-xs font-black text-gray-700">{m.points}</span>
                      </div>
                      {done
                        ? <CheckCircle size={18} className="text-green-500" />
                        : started
                          ? <ChevronRight size={18} className="text-primary-400" />
                          : <Lock size={14} className="text-gray-300" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Badges tab */}
        {tab === 'badges' && (
          <div>
            {badges.length === 0 ? (
              <div className="text-center py-12">
                <Trophy size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">Belum ada badge</p>
                <p className="text-gray-400 text-sm">Selesaikan misi untuk mendapat badge!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {badges.map((b: any) => (
                  <div key={b.id} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-yellow-100 bounce-in">
                    <div className="text-3xl mb-1">{b.badge_icon}</div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">{b.badge_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(b.earned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && (
          <div className="space-y-2">
            {leaderboard.map((u: any, i: number) => (
              <div key={u.id} className={`bg-white rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border
                ${i === 0 ? 'border-yellow-200 bg-yellow-50' : i === 1 ? 'border-gray-200 bg-gray-50' : i === 2 ? 'border-orange-100 bg-orange-50' : 'border-green-50'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm
                  ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.hse_number} · {u.missions_done} misi</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" fill="currentColor" />
                  <span className="text-sm font-black text-gray-700">{u.points}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
