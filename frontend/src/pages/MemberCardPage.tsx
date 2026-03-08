import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';
import cardLogo from '../assets/card-logo.jpeg';

const ANGKATAN_LABEL: Record<string, string> = {
  I:'I', II:'II', III:'III', IV:'IV', V:'V', VI:'VI', VII:'VII', VIII:'VIII', IX:'IX', X:'X',
  XI:'XI', XII:'XII', XIII:'XIII', XIV:'XIV', XV:'XV', XVI:'XVI', XVII:'XVII', XVIII:'XVIII',
  XIX:'XIX', XX:'XX', XXI:'XXI', XXII:'XXII', XXIII:'XXIII', XXIV:'XXIV', XXV:'XXV',
};

export default function MemberCardPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!user || user.role !== 'member') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <p className="text-gray-500 font-semibold">Hanya Anggota HSE yang dapat mengakses kartu anggota</p>
          <button onClick={() => navigate('/app/profile')} className="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold">Kembali</button>
        </div>
      </div>
    );
  }

  const avatarUrl = user.avatar ? `http://localhost:3001${user.avatar}` : null;
  const joinYear = user.hse_number?.match(/HSE\.([IVX]+)-/) ? new Date().getFullYear() : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `kartu-anggota-hse-${user.name?.replace(/\s+/g, '-').toLowerCase() ?? 'member'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Gagal mengunduh kartu. Coba lagi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-100 safe-bottom fade-in">
      {/* Header */}
      <div className="bg-primary-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-primary-400 opacity-25 -top-6 -right-6 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app/profile')} className="p-2.5 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Kartu Anggota</h1>
            <p className="text-primary-100 text-xs">HSE Geologi Unpad</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2.5 bg-white/20 rounded-xl text-white disabled:opacity-60 active:scale-95 transition-transform"
          >
            {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          </button>
        </div>
      </div>

      <div className="px-5 py-6 flex flex-col items-center gap-6">

        {/* ── Card Front ── */}
        <div className="w-full max-w-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Kartu Anggota HSE</p>
          <div
            ref={cardRef}
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 70%, #059669 100%)',
              aspectRatio: '1.586',
            }}>
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="blob w-48 h-48 bg-white -top-16 -right-16 absolute" />
              <div className="blob w-36 h-36 bg-yellow-300 bottom-0 -left-8 absolute" />
            </div>
            {/* Diagonal stripe */}
            <div className="absolute inset-0 overflow-hidden opacity-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute bg-white h-full w-4"
                  style={{ left: `${i * 60 - 20}px`, transform: 'rotate(20deg) translateX(-50%)', top: '-20%', height: '140%' }} />
              ))}
            </div>

            <div className="relative z-10 p-5 h-full flex flex-col justify-between">
              {/* Top row: logos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white overflow-hidden shadow-md">
                    <img src={cardLogo} alt="FTG Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs leading-tight">HSE Geologi Unpad</p>
                    <p className="text-green-200 text-[9px] leading-tight">Badan Khusus FTG Unpad</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white overflow-hidden shadow-md">
                  <img src={logo} alt="HSE Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Middle: avatar + name */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">{user.name}</p>
                  <p className="text-yellow-300 text-xs font-bold mt-0.5">{user.hse_number}</p>
                  {user.angkatan && (
                    <p className="text-green-200 text-[10px]">Angkatan {ANGKATAN_LABEL[user.angkatan] ?? user.angkatan}</p>
                  )}
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-green-300 text-[9px] uppercase tracking-widest font-bold">Anggota HSE</p>
                  <p className="text-white text-[10px] font-semibold">Geology HSE Management System</p>
                </div>
                {joinYear && (
                  <p className="text-green-300 text-[10px] font-bold">{joinYear}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Card Back ── */}
        <div className="w-full max-w-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Informasi Anggota</p>
          <div className="bg-white rounded-3xl shadow-lg p-5 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-600 font-black text-xl">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-black text-gray-800">{user.name}</p>
                <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-bold">Anggota HSE</span>
              </div>
            </div>

            {[
              { label: 'No. Anggota', value: user.hse_number },
              { label: 'Angkatan', value: user.angkatan ? `Angkatan ${ANGKATAN_LABEL[user.angkatan] ?? user.angkatan}` : '-' },
              { label: 'Program Studi', value: user.program_studi || 'Teknik Geologi' },
              { label: 'Poin HSE', value: `${user.points || 0} poin` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{row.label}</span>
                <span className="text-xs font-bold text-gray-700">{row.value}</span>
              </div>
            ))}

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={cardLogo} alt="FTG" className="w-7 h-7 rounded-lg object-cover" />
                <div>
                  <p className="text-[10px] font-black text-gray-700">HSE Geologi Unpad</p>
                  <p className="text-[9px] text-gray-400">Badan Khusus FTG Unpad</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">hse.geologi.unpad.ac.id</p>
            </div>
          </div>
        </div>

        {/* Download hint */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-transform disabled:opacity-60"
        >
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {downloading ? 'Mengunduh...' : 'Unduh Kartu Anggota'}
        </button>

        <p className="text-xs text-gray-400 text-center px-6 leading-relaxed">
          Kartu ini merupakan tanda keanggotaan resmi HSE Geologi Unpad. Harap dijaga dan tidak dipindahtangankan.
        </p>
      </div>
    </div>
  );
}
