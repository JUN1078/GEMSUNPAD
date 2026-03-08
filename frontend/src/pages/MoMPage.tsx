import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function MoMPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [form, setForm] = useState({ meeting_title: '', meeting_date: '', meeting_time: '', location: '', chairman: '', secretary: '' });
  const [discussions, setDiscussions] = useState('');
  const [actionItems, setActionItems] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { api.get('/mom').then(r => setList(r.data)).catch(() => {}); }, [showForm]);

  const aiSummarize = async () => {
    if (!rawNotes) return toast.error('Tulis notulen terlebih dahulu');
    setAiLoading(true);
    try {
      const { data } = await api.post('/mom/ai-summarize', { raw_notes: rawNotes });
      setDiscussions(data.summary_points?.join('\n') || '');
      setActionItems(data.action_items?.map((a: any) => `${a.task} (PIC: ${a.pic || '?'}, Deadline: ${a.deadline || '?'})`).join('\n') || '');
      toast.success('AI berhasil meringkas notulen!');
    } catch { toast.error('Gagal meringkas'); }
    finally { setAiLoading(false); }
  };

  const submit = async () => {
    if (!form.meeting_title) return toast.error('Judul rapat wajib diisi');
    setLoading(true);
    try {
      await api.post('/mom', {
        ...form,
        discussions: discussions.split('\n').filter(Boolean),
        action_items: actionItems.split('\n').filter(Boolean).map(t => ({ task: t, status: 'open' })),
      });
      toast.success('MoM tersimpan! +60 poin 🎉');
      setShowForm(false);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Gagal'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-teal-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-teal-400 opacity-25 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Rapat K3 (MoM)</h1>
            <p className="text-teal-100 text-xs">Minutes of Meeting + AI Ringkas</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-2.5 bg-white/20 rounded-xl text-white"><Plus size={20} /></button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-4">
        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-teal-100 slide-up">
            <h3 className="font-bold text-gray-800 mb-4">Buat MoM Baru</h3>
            <div className="space-y-3">
              {[
                { label: 'Judul Rapat *', k: 'meeting_title', placeholder: 'cth: Rapat K3 Mingguan' },
                { label: 'Tanggal', k: 'meeting_date', type: 'date', placeholder: '' },
                { label: 'Waktu', k: 'meeting_time', type: 'time', placeholder: '' },
                { label: 'Lokasi', k: 'location', placeholder: 'Ruangan rapat' },
                { label: 'Pimpinan Rapat', k: 'chairman', placeholder: 'Nama pimpinan' },
                { label: 'Notulis', k: 'secretary', placeholder: 'Nama notulis' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={(form as any)[f.k]} onChange={set(f.k)} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-teal-400 outline-none" />
                </div>
              ))}

              {/* AI Summarize */}
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-teal-600" />
                  <p className="text-xs font-bold text-teal-700">AI Ringkas Notulen</p>
                </div>
                <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)} rows={3}
                  placeholder="Paste notulen panjang di sini, AI akan meringkasnya..."
                  className="w-full px-3 py-2 rounded-lg border border-teal-200 text-xs bg-white outline-none resize-none" />
                <button onClick={aiSummarize} disabled={aiLoading}
                  className="mt-2 w-full py-2 bg-teal-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">
                  {aiLoading ? 'Meringkas...' : '✨ Ringkas dengan AI'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Pembahasan / Diskusi</label>
                <textarea value={discussions} onChange={e => setDiscussions(e.target.value)} rows={3} placeholder="Poin-poin pembahasan (1 poin per baris)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-teal-400 outline-none resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Action Items</label>
                <textarea value={actionItems} onChange={e => setActionItems(e.target.value)} rows={3} placeholder="Action item (1 per baris, format: tugas (PIC: nama, Deadline: tanggal))..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-teal-400 outline-none resize-none" />
              </div>
              <button onClick={submit} disabled={loading} className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan MoM'}
              </button>
            </div>
          </div>
        )}

        {list.map((m: any) => {
          const discussions = (() => { try { return JSON.parse(m.discussions || '[]'); } catch { return []; } })();
          const actionItems = (() => { try { return JSON.parse(m.action_items || '[]'); } catch { return []; } })();
          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <button onClick={() => setExpanded(expanded === m.id ? null : m.id)} className="w-full p-4 text-left flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{m.meeting_title}</p>
                  <p className="text-xs text-gray-500">{m.meeting_date} · {m.location || 'Lokasi tidak dicatat'}</p>
                  <p className="text-xs text-gray-400">{actionItems.length} action items</p>
                </div>
                {expanded === m.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expanded === m.id && (discussions.length > 0 || actionItems.length > 0) && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                  {discussions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">Pembahasan:</p>
                      {discussions.map((d: string, i: number) => <p key={i} className="text-xs text-gray-500">• {d}</p>)}
                    </div>
                  )}
                  {actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-1">Action Items:</p>
                      {actionItems.map((a: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${a.status === 'done' ? 'bg-green-500' : 'bg-orange-400'}`} />
                          <p className="text-xs text-gray-500">{typeof a === 'string' ? a : a.task}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && !showForm && (
          <div className="text-center py-16">
            <FileText size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada MoM</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl">+ Buat MoM Pertama</button>
          </div>
        )}
      </div>
    </div>
  );
}
