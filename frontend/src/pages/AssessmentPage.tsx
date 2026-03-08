import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function AssessmentPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/learning/modules/${code}/questions`).then(r => { setQuestions(r.data); setLoading(false); }).catch(() => navigate(-1));
  }, [code]);

  const q = questions[current];
  const opts: string[] = q ? (() => { try { return JSON.parse(q.options); } catch { return []; } })() : [];
  const progress = ((current + 1) / questions.length) * 100;

  const select = (i: number) => {
    if (answers[q.id] !== undefined) return;
    setAnswers(a => ({ ...a, [q.id]: i }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/learning/modules/${code}/submit-quiz`, { answers });
      setResult(data);
      setSubmitted(true);
      if (data.passed) toast.success(`Lulus! Nilai ${data.score} 🎉 +100 poin`);
      else toast.error(`Nilai ${data.score} – belum lulus. Baca ulang dan coba lagi!`);
    } catch { toast.error('Gagal submit'); }
    finally { setLoading(false); }
  };

  if (submitted && result) return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className={`${result.passed ? 'bg-primary-600' : 'bg-red-500'} px-5 pt-12 pb-10 text-center`}>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          {result.passed ? <CheckCircle size={32} className="text-primary-600" /> : <XCircle size={32} className="text-red-500" />}
        </div>
        <h2 className="text-white font-black text-2xl">{result.passed ? 'LULUS!' : 'Belum Lulus'}</h2>
        <p className="text-white/80 text-4xl font-black mt-1">{result.score}<span className="text-xl">/100</span></p>
        <p className="text-white/70 text-sm mt-1">{result.correct}/{result.total} jawaban benar</p>
      </div>
      <div className="px-5 pt-5 pb-6 space-y-3">
        {result.passed ? (
          <button onClick={() => navigate(`/app/learning`)} className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg">
            Lanjut ke Modul Berikutnya →
          </button>
        ) : (
          <button onClick={() => navigate(`/app/learning/${code}`)} className="w-full py-3.5 bg-red-500 text-white font-bold rounded-xl">
            Baca Ulang Materi
          </button>
        )}
        <button onClick={() => navigate('/app/learning')} className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">Kembali ke Daftar Materi</button>
      </div>
    </div>
  );

  if (loading || questions.length === 0) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Memuat soal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh safe-bottom fade-in flex flex-col">
      <div className="bg-primary-600 px-5 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <p className="text-primary-100 text-xs">Kuis {code}</p>
            <p className="text-white font-bold text-sm">Soal {current + 1} dari {questions.length}</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2">
          <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 mb-5">
          <p className="text-sm font-bold text-gray-800 leading-relaxed">{q.question}</p>
        </div>

        <div className="space-y-3 flex-1">
          {opts.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <button key={i} onClick={() => select(i)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-sm font-medium transition-all
                  ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'}`}>
                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-black mr-3
                  ${selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} disabled={answers[q.id] === undefined}
              className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              Lanjut <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={submit} disabled={Object.keys(answers).length < questions.length || loading}
              className="flex-1 py-3.5 bg-primary-600 text-white font-bold rounded-xl disabled:opacity-50">
              {loading ? 'Menghitung...' : 'Submit Jawaban'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
