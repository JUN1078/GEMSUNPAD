import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function FinalExamPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'exam' | 'result'>('intro');
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 min
  const timerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startExam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/learning/final-exam/questions');
      setQuestions(data.questions);
      setPhase('exam');
      timerRef.current = setInterval(() => setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); submitExam(); return 0; } return t - 1; }), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Tidak bisa memulai ujian');
    } finally { setLoading(false); }
  };

  const submitExam = async () => {
    clearInterval(timerRef.current);
    setLoading(true);
    try {
      const { data } = await api.post('/learning/final-exam/submit', { answers });
      setResult(data);
      setPhase('result');
    } catch { toast.error('Gagal submit'); }
    finally { setLoading(false); }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const q = questions[current];
  const opts: string[] = q ? (() => { try { return JSON.parse(q.options); } catch { return []; } })() : [];

  if (phase === 'intro') return (
    <div className="min-h-dvh flex flex-col fade-in">
      <div className="bg-gradient-to-br from-unpad-blue to-primary-700 px-5 pt-12 pb-10 text-center relative overflow-hidden">
        <div className="blob w-48 h-48 bg-yellow-300 opacity-15 -top-16 -right-16 absolute" />
        <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Trophy size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Ujian Final K3</h1>
        <p className="text-blue-200 text-sm mt-1">40 soal · 60 menit · Nilai lulus ≥ 75</p>
      </div>
      <div className="flex-1 bg-white px-5 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium">{error}</div>}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-2">
          {['Semua 8 modul harus sudah selesai', '40 soal pilihan ganda dari semua modul', 'Waktu ujian: 60 menit', 'Nilai minimal kelulusan: 75/100', 'Lulus = Sertifikat HSE Digital Geologi Unpad'].map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">{r}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/app/learning')} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">Kembali</button>
          <button onClick={startExam} disabled={loading} className="flex-1 py-3.5 bg-unpad-blue text-white font-black rounded-xl shadow-lg disabled:opacity-50">
            {loading ? 'Memuat...' : 'Mulai Ujian!'}
          </button>
        </div>
      </div>
    </div>
  );

  if (phase === 'result' && result) return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className={`${result.passed ? 'bg-gradient-to-br from-unpad-blue to-primary-700' : 'bg-red-600'} px-5 pt-12 pb-10 text-center`}>
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl bounce-in">
          {result.passed ? <Trophy size={36} className="text-yellow-500" /> : <XCircle size={36} className="text-red-500" />}
        </div>
        <h2 className="text-white font-black text-2xl">{result.passed ? '🎉 LULUS!' : 'Belum Lulus'}</h2>
        <p className="text-white text-5xl font-black mt-2">{result.score}<span className="text-xl">/100</span></p>
        <p className="text-white/70 text-sm">{result.correct}/{result.total} benar</p>
      </div>
      <div className="px-5 py-6 space-y-4">
        {result.passed && result.certificate && (
          <button onClick={() => navigate('/app/certificate')}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-black rounded-2xl shadow-lg text-lg">
            🏅 Ambil Sertifikat!
          </button>
        )}
        {!result.passed && (
          <button onClick={() => navigate('/app/learning')} className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl">Pelajari Ulang Materi</button>
        )}
        <button onClick={() => navigate('/app')} className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl">Ke Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh safe-bottom flex flex-col fade-in">
      <div className="bg-unpad-blue px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-blue-200 text-xs font-semibold">Ujian Final K3</p>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm ${timeLeft < 300 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'}`}>
            <Clock size={14} />
            {fmt(timeLeft)}
          </div>
        </div>
        <p className="text-white font-bold text-sm">Soal {current + 1} / {questions.length}</p>
        <div className="bg-white/20 rounded-full h-1.5 mt-2">
          <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 mb-5">
          <p className="text-xs font-semibold text-blue-500 mb-2">{q?.module_code}</p>
          <p className="text-sm font-bold text-gray-800 leading-relaxed">{q?.question}</p>
        </div>
        <div className="space-y-3 flex-1">
          {opts.map((opt, i) => {
            const selected = answers[q?.id] === i;
            return (
              <button key={i} onClick={() => answers[q.id] === undefined && setAnswers(a => ({ ...a, [q.id]: i }))}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all
                  ${selected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700'}`}>
                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-black mr-3
                  ${selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex gap-3">
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)}
              className="flex-1 py-3.5 bg-unpad-blue text-white font-bold rounded-xl flex items-center justify-center gap-2">
              Soal Berikutnya <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={submitExam} disabled={loading}
              className="flex-1 py-3.5 bg-primary-600 text-white font-black rounded-xl disabled:opacity-50">
              {loading ? 'Menghitung Nilai...' : '🏁 Submit Ujian'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
