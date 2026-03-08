import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, ChevronRight, ChevronLeft, Heart, X as XIcon, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const REGULATIONS = [
  {
    id: 'uu1-1970',
    code: 'UU No. 1/1970',
    title: 'Keselamatan Kerja',
    emoji: '⚖️',
    color: 'from-blue-600 to-blue-700',
    summary: 'Dasar utama K3 di Indonesia. Mengatur kewajiban pengurus dan hak pekerja dalam keselamatan kerja di semua tempat kerja.',
    highlights: [
      'Wajib bagi semua tempat kerja yang ada sumber bahaya',
      'Pengurus wajib sediakan APD secara gratis',
      'Pekerja wajib ikuti semua petunjuk K3',
      'Pengawasan oleh Pegawai Pengawas Ketenagakerjaan',
      'Sanksi pidana: kurungan max 1 tahun atau denda max Rp 15 juta',
    ],
    year: 1970,
  },
  {
    id: 'uu13-2003',
    code: 'UU No. 13/2003',
    title: 'Ketenagakerjaan',
    emoji: '👷',
    color: 'from-green-600 to-green-700',
    summary: 'Pasal 86 & 87 menegaskan hak pekerja atas K3 dan kewajiban perusahaan menerapkan Sistem Manajemen K3 (SMK3).',
    highlights: [
      'Pasal 86: Setiap pekerja berhak atas K3',
      'Pasal 87: Perusahaan wajib terapkan SMK3',
      'Perlindungan keselamatan dan kesehatan kerja',
      'Perlindungan moral, kesusilaan, dan perlakuan manusiawi',
      'Sanksi: administratif dan pidana',
    ],
    year: 2003,
  },
  {
    id: 'pp50-2012',
    code: 'PP No. 50/2012',
    title: 'Penerapan SMK3',
    emoji: '🏗️',
    color: 'from-teal-600 to-teal-700',
    summary: 'Sistem Manajemen K3 (SMK3) wajib bagi perusahaan risiko tinggi atau memiliki lebih dari 100 tenaga kerja.',
    highlights: [
      'Wajib bagi perusahaan ≥100 pekerja atau risiko tinggi',
      '5 prinsip dasar: Kebijakan, Perencanaan, Pelaksanaan, Pemantauan, Peninjauan',
      'Audit SMK3 dilakukan tiap 3 tahun oleh lembaga audit independen',
      'Hasil audit: memuaskan, baik, atau kurang',
      'Penghargaan Zero Accident dari Kemnaker RI',
    ],
    year: 2012,
  },
  {
    id: 'permen5-2018',
    code: 'Permenaker No. 5/2018',
    title: 'K3 Lingkungan Kerja',
    emoji: '🌿',
    color: 'from-purple-600 to-purple-700',
    summary: 'Mengatur persyaratan K3 lingkungan kerja mencakup faktor fisik, kimia, biologi, ergonomi, dan psikologi.',
    highlights: [
      'Faktor fisik: kebisingan NAB 85 dB(A)/8 jam',
      'Faktor kimia: Nilai Ambang Batas (NAB) tiap zat',
      'Faktor biologi: kontrol bakteri, virus, jamur',
      'Ergonomi: desain pekerjaan sesuai kemampuan tubuh',
      'Psikologi: cegah stres, kekerasan, dan pelecehan kerja',
    ],
    year: 2018,
  },
  {
    id: 'permen9-2016',
    code: 'Permenaker No. 9/2016',
    title: 'K3 Bekerja di Ketinggian',
    emoji: '🏔️',
    color: 'from-orange-600 to-orange-700',
    summary: 'Mengatur prosedur dan sertifikasi bekerja di ketinggian lebih dari 1,8 meter — sangat relevan untuk kegiatan lapangan geologi!',
    highlights: [
      'Berlaku untuk pekerjaan di ketinggian > 1.8 meter',
      'Wajib Surat Izin Bekerja Aman (SIBA)',
      'Sistem pencegahan jatuh: harness, life line, safety net',
      'Pelatihan dan sertifikasi wajib untuk petugas K3 ketinggian',
      'Kritis untuk: pemetaan tebing, pengamatan singkapan batuan',
    ],
    year: 2016,
  },
  {
    id: 'permenkes48-2016',
    code: 'Permenkes No. 48/2016',
    title: 'K3 Perkantoran',
    emoji: '🏢',
    color: 'from-pink-600 to-pink-700',
    summary: 'Standar keselamatan dan kesehatan di area perkantoran, termasuk laboratorium geologi dan ruang kuliah.',
    highlights: [
      'Suhu ruangan: 18-28°C, kelembaban 40-60%',
      'Pencahayaan: minimal 300 lux untuk ruang kerja',
      'Kualitas udara dalam ruangan terjaga baik',
      'Tersedia toilet bersih, minimum 1 per 25 orang',
      'Kotak P3K tersedia dan lengkap',
    ],
    year: 2016,
  },
  {
    id: 'permen4-1980',
    code: 'Permenaker No. 4/1980',
    title: 'APAR (Alat Pemadam Api Ringan)',
    emoji: '🧯',
    color: 'from-red-600 to-red-700',
    summary: 'Syarat-syarat pemasangan dan pemeliharaan Alat Pemadam Api Ringan (APAR) di setiap tempat kerja.',
    highlights: [
      'APAR dipasang max 1.2 meter dari lantai',
      'Jarak antar APAR max 15 meter',
      'Inspeksi minimal 1 tahun sekali',
      'Jenis: CO₂, dry powder, foam, halon',
      'Latihan pemadam kebakaran wajib dilakukan',
    ],
    year: 1980,
  },
  {
    id: 'kepmen186-1999',
    code: 'Kepmenaker No. 186/1999',
    title: 'Unit Penanggulangan Kebakaran',
    emoji: '🚒',
    color: 'from-yellow-600 to-yellow-700',
    summary: 'Kewajiban membentuk Unit Penanggulangan Kebakaran (UPK) di tempat kerja untuk respons darurat kebakaran.',
    highlights: [
      'Wajib bagi perusahaan risiko kebakaran tinggi',
      'Tim pemadam kebakaran terlatih dan bersertifikat',
      'Rencana tanggap darurat kebakaran tertulis',
      'Simulasi kebakaran minimal 1x per tahun',
      'Koordinasi dengan Dinas Pemadam Kebakaran setempat',
    ],
    year: 1999,
  },
];

export default function K3RegulationsPage() {
  const navigate = useNavigate();
  const [cardIndex, setCardIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [tab, setTab] = useState<'swipe' | 'saved' | 'ai'>('swipe');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Halo! Saya AI Asisten K3. Tanyakan apapun tentang peraturan K3 Indonesia dan keselamatan kerja. 🛡️' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const current = REGULATIONS[cardIndex];
  const done = cardIndex >= REGULATIONS.length;

  const swipe = (dir: 'left' | 'right') => {
    setSwipeDir(dir);
    if (dir === 'right' && current) {
      setSaved(s => [...s, current.id]);
      toast.success('Disimpan! 💚');
    }
    setTimeout(() => {
      setCardIndex(i => i + 1);
      setSwipeDir(null);
    }, 300);
  };

  const askAI = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion('');
    setChatHistory(h => [...h, { role: 'user', text: q }]);
    setAiLoading(true);
    try {
      const { data } = await api.post('/campaigns/ask-k3', { question: q });
      setChatHistory(h => [...h, { role: 'ai', text: data.answer }]);
    } catch {
      setChatHistory(h => [...h, { role: 'ai', text: 'Maaf, saya tidak dapat menjawab saat ini. Coba lagi ya! 🙏' }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100);
    }
  };

  const savedRegs = REGULATIONS.filter(r => saved.includes(r.id));

  return (
    <div className="min-h-dvh safe-bottom flex flex-col fade-in bg-gray-50">
      {/* Header */}
      <div className="bg-unpad-blue px-5 pt-6 pb-4 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-blue-400 opacity-20 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-white font-black text-base">Regulasi K3</h1>
            <p className="text-blue-200 text-xs">Swipe untuk belajar & tanya AI</p>
          </div>
        </div>
        <div className="flex gap-1 relative z-10">
          {(['swipe', 'saved', 'ai'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? 'bg-white text-unpad-blue' : 'bg-white/20 text-white'}`}>
              {t === 'swipe' ? '📚 Swipe' : t === 'saved' ? `💚 Simpan (${saved.length})` : '🤖 Tanya AI'}
            </button>
          ))}
        </div>
      </div>

      {/* Swipe tab */}
      {tab === 'swipe' && (
        <div className="flex-1 flex flex-col items-center px-4 py-6">
          {!done ? (
            <>
              <p className="text-gray-400 text-xs mb-4">{cardIndex + 1} dari {REGULATIONS.length} peraturan</p>

              {/* Card */}
              <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300
                ${swipeDir === 'left' ? '-translate-x-16 opacity-0 rotate-6' : swipeDir === 'right' ? 'translate-x-16 opacity-0 -rotate-6' : ''}`}>
                <div className={`bg-gradient-to-br ${current.color} p-6 pb-4`}>
                  <div className="text-5xl mb-3">{current.emoji}</div>
                  <p className="text-white/70 text-xs font-semibold">{current.code} · {current.year}</p>
                  <h2 className="text-white font-black text-xl leading-tight mt-1">{current.title}</h2>
                </div>
                <div className="bg-white p-5">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{current.summary}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Poin Penting</p>
                    {current.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight size={14} className={`text-${current.color.split('-')[1]}-600 mt-0.5 flex-shrink-0`} />
                        <p className="text-gray-700 text-xs leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Swipe buttons */}
              <div className="flex items-center gap-8 mt-8">
                <button onClick={() => swipe('left')}
                  className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-red-200 flex items-center justify-center hover:bg-red-50 active:scale-90 transition-all">
                  <XIcon size={28} className="text-red-400" />
                </button>
                <p className="text-gray-400 text-xs">Lewati / Simpan</p>
                <button onClick={() => swipe('right')}
                  className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-green-200 flex items-center justify-center hover:bg-green-50 active:scale-90 transition-all">
                  <Heart size={28} className="text-green-500" />
                </button>
              </div>
              <div className="flex gap-16 mt-1">
                <p className="text-xs text-red-400 font-medium">Lewati</p>
                <p className="text-xs text-green-500 font-medium">Simpan</p>
              </div>

              {/* Navigate arrows */}
              <div className="flex gap-4 mt-6">
                <button disabled={cardIndex === 0} onClick={() => setCardIndex(i => i - 1)}
                  className="flex items-center gap-1 text-xs text-gray-400 disabled:opacity-30">
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <button onClick={() => setCardIndex(i => i + 1)}
                  className="flex items-center gap-1 text-xs text-gray-400">
                  Berikutnya <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-black text-gray-800 text-xl">Selesai!</h3>
              <p className="text-gray-500 text-sm mt-2">Kamu menyimpan {saved.length} peraturan</p>
              <button onClick={() => { setCardIndex(0); setSaved([]); }}
                className="mt-6 px-6 py-3 bg-unpad-blue text-white font-bold rounded-xl text-sm">
                Mulai Ulang
              </button>
            </div>
          )}
        </div>
      )}

      {/* Saved tab */}
      {tab === 'saved' && (
        <div className="flex-1 px-4 py-4 space-y-3">
          {savedRegs.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">Belum ada yang disimpan</p>
              <p className="text-gray-400 text-sm mt-1">Swipe kanan untuk menyimpan regulasi</p>
            </div>
          ) : savedRegs.map(r => (
            <div key={r.id} className={`bg-gradient-to-r ${r.color} rounded-2xl p-4 text-white`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <p className="text-white/70 text-xs">{r.code}</p>
                  <p className="font-black text-sm">{r.title}</p>
                </div>
              </div>
              <p className="text-white/80 text-xs mt-2 leading-relaxed">{r.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Q&A tab */}
      {tab === 'ai' && (
        <div className="flex-1 flex flex-col">
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-unpad-blue flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-unpad-blue flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested questions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
            {['Apa itu APD?', 'Bagaimana cara buat JSA?', 'Kapan wajib SMK3?', 'APD untuk geologi lapangan?'].map(q => (
              <button key={q} onClick={() => setQuestion(q)}
                className="flex-shrink-0 px-3 py-1.5 bg-blue-50 text-unpad-blue rounded-full text-xs font-medium border border-blue-100 whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 pt-2 flex gap-2">
            <input value={question} onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAI()}
              placeholder="Tanya tentang K3..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary-400 bg-white" />
            <button onClick={askAI} disabled={aiLoading || !question.trim()}
              className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center disabled:opacity-40">
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
