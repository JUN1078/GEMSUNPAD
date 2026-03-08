import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Trophy, ChevronRight, Star, HardHat, Flame, Building2, GraduationCap, Gamepad2 } from 'lucide-react';
import api from '../lib/api';

const PROGRAMS = [
  { key: 'BST', label: 'Basic Safety Training', short: 'BST', icon: GraduationCap, color: 'from-blue-600 to-blue-700', bg: 'bg-blue-600', total: 8, desc: 'Dasar-dasar K3 untuk Geologi Unpad' },
  { key: 'Mining', label: 'Safety in Mining', short: 'Mining', icon: HardHat, color: 'from-yellow-600 to-amber-700', bg: 'bg-yellow-600', total: 10, desc: 'K3 di industri pertambangan' },
  { key: 'OilGas', label: 'Safety in Oil & Gas', short: 'Oil & Gas', icon: Flame, color: 'from-cyan-600 to-teal-700', bg: 'bg-cyan-600', total: 10, desc: 'K3 di industri minyak dan gas' },
  { key: 'Construction', label: 'Safety in Construction', short: 'Konstruksi', icon: Building2, color: 'from-gray-600 to-slate-700', bg: 'bg-gray-600', total: 17, desc: 'K3 di industri konstruksi' },
];

const CAT_COLOR: Record<string, string> = {
  Regulasi: 'bg-blue-100 text-blue-700', Prosedur: 'bg-purple-100 text-purple-700',
  Manajemen: 'bg-teal-100 text-teal-700', Analisis: 'bg-orange-100 text-orange-700',
  Pengendalian: 'bg-red-100 text-red-700', Kesehatan: 'bg-pink-100 text-pink-700',
  Higiene: 'bg-indigo-100 text-indigo-700',
};

export default function LearningPage() {
  const navigate = useNavigate();
  const [allModules, setAllModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  useEffect(() => {
    api.get('/learning/modules').then(r => { setAllModules(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const getProgStats = (progKey: string) => {
    const mods = allModules.filter(m => m.program === progKey);
    const done = mods.filter(m => m.progress.status === 'completed').length;
    return { mods, done, total: mods.length || PROGRAMS.find(p => p.key === progKey)?.total || 0 };
  };

  const prog = selectedProgram ? PROGRAMS.find(p => p.key === selectedProgram) : null;
  const { mods: modules, done: completed, total } = selectedProgram ? getProgStats(selectedProgram) : { mods: [], done: 0, total: 0 };
  const canFinalExam = selectedProgram ? completed >= total && total > 0 : false;

  if (selectedProgram && prog) {
    return (
      <div className="min-h-dvh safe-bottom fade-in">
        {/* Header */}
        <div className={`bg-gradient-to-br ${prog.color} relative overflow-hidden`}>
          <div className="blob w-40 h-40 bg-white opacity-10 -top-10 -right-10 absolute" />
          <div className="relative z-10 px-5 pt-6 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setSelectedProgram(null)} className="p-2.5 bg-white/20 rounded-xl text-white">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-white">{prog.label}</h1>
                <p className="text-white/70 text-xs">{prog.desc}</p>
              </div>
            </div>
            <div className="bg-white/15 rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-bold">{completed}/{total} Modul Selesai</span>
                <span className="text-white/70">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
              </div>
              <div className="bg-white/20 rounded-full h-2.5">
                <div className="bg-white h-2.5 rounded-full transition-all" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
              </div>
              {canFinalExam && (
                <p className="text-yellow-200 text-xs mt-2 font-semibold">🎉 Semua modul selesai! Ikuti Ujian Final</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-6 space-y-3">
          {canFinalExam && (
            <button onClick={() => navigate(`/app/learning/final-exam?program=${selectedProgram}`)}
              className={`w-full bg-gradient-to-r ${prog.color} rounded-2xl p-4 text-left`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-black">Ujian Final {prog.short}</p>
                    <p className="text-white/70 text-xs">40 soal · 60 menit · Sertifikat Digital</p>
                  </div>
                </div>
                <ChevronRight className="text-white" size={20} />
              </div>
            </button>
          )}

          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl shimmer" />)}</div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Modul belum tersedia untuk program ini</p>
            </div>
          ) : (
            modules.map((m, i) => {
              const done = m.progress.status === 'completed';
              const locked = i > 0 && modules[i - 1].progress.status !== 'completed' && !done;
              return (
                <button key={m.code}
                  onClick={() => !locked && navigate(`/app/learning/${m.code}`)}
                  disabled={locked}
                  className={`w-full bg-white rounded-2xl p-4 shadow-sm border text-left transition-all active:scale-98
                    ${done ? 'border-green-200' : locked ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-primary-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black
                      ${done ? 'bg-green-100' : locked ? 'bg-gray-100' : prog.bg}`}>
                      {done ? <CheckCircle size={22} className="text-green-600" />
                        : locked ? <Lock size={18} className="text-gray-400" />
                          : <span className="text-white text-lg">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${CAT_COLOR[m.category] || 'bg-gray-100 text-gray-600'}`}>{m.category}</span>
                        <span className="text-xs text-gray-400">{m.code}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 truncate">{m.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{m.description}</p>
                      {m.progress.status === 'reading_done' && (
                        <div className="mt-1.5 bg-gray-100 rounded-full h-1"><div className="bg-primary-400 h-1 rounded-full w-1/3" /></div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {done && (
                        <div className="flex items-center gap-0.5">
                          <Star size={12} className="text-yellow-500" fill="currentColor" />
                          <span className="text-xs font-bold text-gray-600">{m.progress.score}</span>
                        </div>
                      )}
                      <ChevronRight size={16} className={locked ? 'text-gray-200' : 'text-gray-400'} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Program selection screen
  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-primary-600 relative overflow-hidden">
        <div className="blob w-40 h-40 bg-primary-400 opacity-25 -top-10 -right-10 absolute" />
        <div className="blob w-28 h-28 bg-unpad-gold opacity-15 top-6 right-20 absolute" />
        <div className="relative z-10 px-5 pt-6 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white">Pembelajaran K3</h1>
              <p className="text-primary-100 text-xs">Pilih program pelatihan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">4 Program Tersedia</p>
          <button onClick={() => navigate('/app/mini-games')}
            className="flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-primary-200">
            <Gamepad2 size={14} /> Mini Games
          </button>
        </div>
        {PROGRAMS.map(p => {
          const { done, total } = getProgStats(p.key);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const Icon = p.icon;
          return (
            <button key={p.key} onClick={() => setSelectedProgram(p.key)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:border-primary-200 transition-all active:scale-98">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${p.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={26} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-base leading-tight">{p.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${p.bg}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">{loading ? '...' : `${done}/${total}`}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
