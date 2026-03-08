import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Star, Lock, Play, Mountain } from 'lucide-react';

export interface GeoTopic {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  duration: string;
  xp: number;
  emoji: string;
  gradient: string;
}

export const GEO_TOPICS: GeoTopic[] = [
  {
    id: 'geo-1', chapter: 1,
    title: 'Pengantar Geologi',
    subtitle: 'Apa itu geologi? Cabang ilmu, metode, dan tokoh-tokoh besar',
    duration: '8 menit', xp: 60, emoji: '🌍',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'geo-2', chapter: 2,
    title: 'Struktur & Lapisan Bumi',
    subtitle: 'Kerak, mantel, inti luar, inti dalam — komposisi & sifat fisiknya',
    duration: '9 menit', xp: 70, emoji: '🔵',
    gradient: 'from-indigo-600 to-blue-500',
  },
  {
    id: 'geo-3', chapter: 3,
    title: 'Mineral & Identifikasinya',
    subtitle: 'Definisi mineral, 8 sifat identifikasi, mineral silikat dominan kerak bumi',
    duration: '10 menit', xp: 75, emoji: '💎',
    gradient: 'from-purple-600 to-violet-500',
  },
  {
    id: 'geo-4', chapter: 4,
    title: 'Tektonik Lempeng',
    subtitle: 'Teori continental drift, jenis batas lempeng, dan posisi Indonesia',
    duration: '10 menit', xp: 80, emoji: '🌋',
    gradient: 'from-red-600 to-orange-500',
  },
  {
    id: 'geo-5', chapter: 5,
    title: 'Siklus Batuan',
    subtitle: 'Tiga jenis batuan, siklus transformasi, dan batuan ekonomis Indonesia',
    duration: '9 menit', xp: 70, emoji: '🪨',
    gradient: 'from-stone-600 to-amber-600',
  },
  {
    id: 'geo-6', chapter: 6,
    title: 'Batuan Beku',
    subtitle: 'Magma, tekstur, klasifikasi QAPF, Seri Reaksi Bowen, busur vulkanik',
    duration: '11 menit', xp: 85, emoji: '🔥',
    gradient: 'from-orange-600 to-red-500',
  },
];

export const STORAGE_KEY = 'geonova_completed_topics';

export default function GeonovaLearningPage() {
  const navigate = useNavigate();
  const [completed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch { return new Set(); }
  });

  const totalXP = GEO_TOPICS.filter(t => completed.has(t.id)).reduce((s, t) => s + t.xp, 0);
  const totalPossibleXP = GEO_TOPICS.reduce((s, t) => s + t.xp, 0);
  const pct = Math.round((completed.size / GEO_TOPICS.length) * 100);

  return (
    <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-700 to-cyan-600 px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="blob w-48 h-48 bg-blue-500 opacity-25 -top-12 -right-12 absolute" />
        <div className="blob w-28 h-28 bg-cyan-300 opacity-20 bottom-0 left-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app/geonova')} className="p-2.5 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Mountain size={18} className="text-white" />
              <h1 className="text-xl font-black text-white">Geologi Dasar</h1>
            </div>
            <p className="text-blue-100 text-xs mt-0.5">Hasria (2020) · 6 Bab · Microlearning Interaktif</p>
          </div>
        </div>

        {/* Progress */}
        <div className="relative z-10 mt-4 bg-white/20 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white text-xs font-bold">Progress Belajar</p>
              <p className="text-blue-100 text-xs mt-0.5">{completed.size}/{GEO_TOPICS.length} topik selesai</p>
            </div>
            <div className="text-right">
              <p className="text-yellow-300 text-lg font-black">⭐ {totalXP}</p>
              <p className="text-blue-100 text-xs">dari {totalPossibleXP} XP</p>
            </div>
          </div>
          <div className="bg-white/30 rounded-full h-2.5">
            <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-blue-100 text-xs mt-1.5 text-right">{pct}% selesai</p>
        </div>
      </div>

      {/* Topics List */}
      <div className="px-4 py-5 pb-24 space-y-3">
        {/* Course intro card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">Geologi Dasar — Edisi Pertama</p>
              <p className="text-xs text-gray-500 mt-0.5">Prof. Dr. Ir. Hasria, S.T., M.T. · Univ. Halu Oleo · 2020</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                6 bab fundamental geologi · swipe slides · visual novel · mini game · kuis interaktif
              </p>
            </div>
          </div>
        </div>

        {/* Topic cards */}
        {GEO_TOPICS.map((topic) => {
          const isDone = completed.has(topic.id);
          return (
            <button
              key={topic.id}
              onClick={() => navigate(`/app/geonova/lesson/${topic.id}`)}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div className="flex items-stretch">
                {/* Left gradient strip */}
                <div className={`bg-gradient-to-b ${topic.gradient} w-16 flex flex-col items-center justify-center py-4 gap-1 flex-shrink-0`}>
                  <span className="text-2xl">{topic.emoji}</span>
                  <span className="text-white text-xs font-black opacity-80">Bab {topic.chapter}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-black text-gray-800 text-sm leading-tight">{topic.title}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{topic.subtitle}</p>
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      {isDone ? (
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle size={16} className="text-green-500" />
                        </div>
                      ) : (
                        <div className={`w-7 h-7 bg-gradient-to-br ${topic.gradient} rounded-full flex items-center justify-center shadow-sm`}>
                          <Play size={12} className="text-white ml-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-xs text-gray-400">⏱ {topic.duration}</span>
                    <span className="text-xs text-yellow-600 font-bold">⭐ +{topic.xp} XP</span>
                    {isDone && <span className="text-xs text-green-600 font-bold">✓ Selesai</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Completion badge */}
        {completed.size === GEO_TOPICS.length ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 text-center">
            <Star size={32} className="text-yellow-500 mx-auto mb-2" />
            <p className="font-black text-yellow-700 text-lg">🎉 Geologi Dasar Selesai!</p>
            <p className="text-yellow-600 text-sm mt-1">Kamu telah menguasai seluruh materi dasar geologi.</p>
            <p className="text-yellow-500 text-xs mt-1 font-bold">Total XP: {totalPossibleXP} ⭐</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <Lock size={16} className="text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">{GEO_TOPICS.length - completed.size} topik tersisa untuk menyelesaikan kursus</p>
          </div>
        )}
      </div>
    </div>
  );
}
