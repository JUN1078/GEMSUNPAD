import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Microscope, Bone, ClipboardList, BookOpen, History, Mountain } from 'lucide-react';

const TOOLS = [
  {
    icon: Camera,
    label: 'Rock ID',
    sub: 'Identifikasi batuan dengan AI',
    path: '/app/geonova/rock-id',
    bg: 'from-orange-500 to-amber-500',
  },
  {
    icon: Microscope,
    label: 'Petrografi',
    sub: 'Analisis sayatan tipis',
    path: '/app/geonova/rock-id?tab=petrographic',
    bg: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Bone,
    label: 'Fosil',
    sub: 'Identifikasi spesimen fosil',
    path: '/app/geonova/rock-id?tab=fossil',
    bg: 'from-stone-500 to-amber-600',
  },
  {
    icon: ClipboardList,
    label: 'Field Log',
    sub: 'Catatan lapangan digital',
    path: '/app/geonova/field-log',
    bg: 'from-green-600 to-emerald-500',
  },
];


export default function GeonovaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-500 px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="blob w-48 h-48 bg-orange-400 opacity-30 -top-12 -right-12 absolute" />
        <div className="blob w-32 h-32 bg-yellow-300 opacity-20 bottom-0 left-1/4 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Mountain size={22} className="text-white" />
              <h1 className="text-2xl font-black text-white">Geonova</h1>
            </div>
            <p className="text-orange-100 text-xs font-medium mt-0.5">Smart Geological Field Logging & Learning System</p>
          </div>
        </div>

        {/* Dataset badge */}
        <div className="relative z-10 mt-4 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold">Dataset: 7 Rock Classes · Gemini 2.5 Flash Vision</span>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-6">
        {/* AI Tools */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">AI Tools</p>
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map(tool => (
              <button
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className={`bg-gradient-to-br ${tool.bg} rounded-2xl p-4 text-left shadow-sm active:scale-95 transition-transform`}
              >
                <tool.icon size={24} className="text-white mb-2" />
                <p className="text-white font-black text-sm">{tool.label}</p>
                <p className="text-white/80 text-xs mt-0.5 leading-tight">{tool.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Learning */}
        <button
          onClick={() => navigate('/app/geonova/learning')}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-white font-black">GeoMaster Learning</p>
            <p className="text-orange-100 text-xs mt-0.5">Geologi Dasar · 6 Bab · Swipe · Mini Game · Kuis</p>
          </div>
        </button>

        {/* Field Log shortcut */}
        <button
          onClick={() => navigate('/app/geonova/field-log')}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 active:scale-98 transition-transform"
        >
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <History size={20} className="text-green-600" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-gray-800">Riwayat Field Log</p>
            <p className="text-xs text-gray-500">Lihat semua catatan stasiun lapangan</p>
          </div>
          <ArrowLeft size={16} className="text-gray-400 rotate-180" />
        </button>
      </div>
    </div>
  );
}
