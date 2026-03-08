import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function JSAPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', location: '', work_date: '', responsible_person: '', tools_equipment: '', description: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { api.get('/jsa').then(r => setList(r.data)).catch(() => {}); }, [showForm]);

  const submit = async () => {
    if (!form.title || !form.description) return toast.error('Judul dan deskripsi wajib diisi');
    setLoading(true);
    try {
      await api.post('/jsa', form);
      toast.success('JSA berhasil dibuat! +50 poin 🎉');
      setShowForm(false);
      setForm({ title: '', location: '', work_date: '', responsible_person: '', tools_equipment: '', description: '' });
    } catch (err: any) { toast.error(err.response?.data?.error || 'Gagal'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-orange-500 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-orange-300 opacity-30 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Job Safety Analysis</h1>
            <p className="text-orange-100 text-xs">AI-powered JSA Generator</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-2.5 bg-white/20 rounded-xl text-white">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 pb-6 space-y-4">
        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 slide-up">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-orange-500" /> Buat JSA Baru</h3>
            <div className="space-y-3">
              {[
                { label: 'Judul Pekerjaan *', k: 'title', placeholder: 'cth: Pengambilan Sampel Batuan di Lembah' },
                { label: 'Lokasi', k: 'location', placeholder: 'cth: Lembah Cisangkuy, Bandung Selatan' },
                { label: 'Tanggal', k: 'work_date', placeholder: '2026-03-15', type: 'date' },
                { label: 'Penanggung Jawab', k: 'responsible_person', placeholder: 'Nama PIC' },
                { label: 'Alat/Peralatan', k: 'tools_equipment', placeholder: 'Palu geologi, loupe, GPS, ...' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={(form as any)[f.k]} onChange={set(f.k)} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Deskripsi Pekerjaan *</label>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Jelaskan pekerjaan yang akan dilakukan secara detail..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-orange-400 outline-none resize-none" />
              </div>
              <button onClick={submit} disabled={loading}
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                <Sparkles size={18} />
                {loading ? 'AI sedang generate JSA...' : 'Generate JSA dengan AI'}
              </button>
            </div>
          </div>
        )}

        {list.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <FileText size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada JSA</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl">+ Buat JSA Pertama</button>
          </div>
        ) : list.map((j: any) => {
          const steps = (() => { try { return JSON.parse(j.ai_steps)?.steps || []; } catch { return []; } })();
          return (
            <div key={j.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <button onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                className="w-full p-4 text-left flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{j.title}</p>
                  <p className="text-xs text-gray-500">{j.location || 'Lokasi belum ditentukan'} · {steps.length} langkah</p>
                </div>
                {expanded === j.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {expanded === j.id && steps.length > 0 && (
                <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
                  {steps.map((s: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                        <p className="text-xs font-bold text-gray-700">{s.step_description}</p>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0
                          ${s.risk_level === 'Critical' ? 'bg-red-100 text-red-700' : s.risk_level === 'High' ? 'bg-orange-100 text-orange-700' : s.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {s.risk_level}
                        </span>
                      </div>
                      {s.hazards?.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {s.hazards.join(', ')}</p>
                      )}
                      {s.controls?.administrative && (
                        <p className="text-xs text-blue-600 mt-0.5">🛡️ {s.controls.administrative}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
