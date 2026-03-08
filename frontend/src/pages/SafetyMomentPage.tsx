import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Lightbulb, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function SafetyMomentPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggest, setSuggest] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', presenter: '', topic: '', content: '', location: '', moment_date: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api.get('/safety-moments').then(r => setList(r.data)).catch(() => {});
    api.get('/safety-moments/suggest').then(r => setSuggest(r.data)).catch(() => {});
  }, [showForm]);

  const addPhoto = (file: File) => { setPhotos(p => [...p, file]); setPreviews(p => [...p, URL.createObjectURL(file)]); };

  const submit = async () => {
    if (!form.title || !form.topic) return toast.error('Judul dan topik wajib diisi');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach(p => fd.append('photos', p));
      await api.post('/safety-moments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Safety Moment tersimpan! +75 poin 🎉');
      setShowForm(false); setPhotos([]); setPreviews([]);
      setForm({ title: '', presenter: '', topic: '', content: '', location: '', moment_date: '' });
    } catch (err: any) { toast.error(err.response?.data?.error || 'Gagal'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-purple-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-purple-400 opacity-25 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Safety Moment</h1>
            <p className="text-purple-100 text-xs">Dokumentasi safety moment harian</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-2.5 bg-white/20 rounded-xl text-white"><Plus size={20} /></button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-4">
        {/* AI Suggest */}
        {suggest?.suggested_topics?.length > 0 && !showForm && (
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-purple-600" />
              <p className="text-xs font-bold text-purple-700">AI Saran Topik</p>
            </div>
            {suggest.suggested_topics.slice(0, 2).map((t: any, i: number) => (
              <button key={i} onClick={() => { setForm(f => ({ ...f, topic: t.title, content: t.key_points.join('\n') })); setShowForm(true); }}
                className="w-full text-left bg-white rounded-xl p-3 mb-2 border border-purple-100">
                <p className="text-xs font-bold text-purple-700">{t.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.reason}</p>
              </button>
            ))}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100 slide-up">
            <h3 className="font-bold text-gray-800 mb-4">Buat Safety Moment</h3>
            <div className="space-y-3">
              {[
                { label: 'Judul *', k: 'title', placeholder: 'Judul safety moment' },
                { label: 'Pembawa Materi', k: 'presenter', placeholder: 'Nama presenter' },
                { label: 'Topik *', k: 'topic', placeholder: 'Topik keselamatan' },
                { label: 'Lokasi', k: 'location', placeholder: 'Lokasi pelaksanaan' },
                { label: 'Tanggal', k: 'moment_date', placeholder: '', type: 'date' },
              ].map(f => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={(form as any)[f.k]} onChange={set(f.k)} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-purple-400 outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Isi Materi</label>
                <textarea value={form.content} onChange={set('content')} rows={4} placeholder="Tulis isi materi safety moment..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:border-purple-400 outline-none resize-none" />
              </div>
              {/* Photos */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Foto Dokumentasi (maks 5)</label>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((p, i) => <img key={i} src={p} className="w-16 h-16 object-cover rounded-xl" alt="" />)}
                  {previews.length < 5 && (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                      <Camera size={20} />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && addPhoto(e.target.files[0])} />
              </div>
              <button onClick={submit} disabled={loading} className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan Safety Moment'}
              </button>
            </div>
          </div>
        )}

        {list.map((sm: any) => (
          <div key={sm.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{sm.title}</p>
                <p className="text-xs text-gray-500">{sm.topic}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sm.presenter || 'Anonim'} · {new Date(sm.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && !showForm && (
          <div className="text-center py-16">
            <Lightbulb size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada Safety Moment</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl">+ Buat Pertama</button>
          </div>
        )}
      </div>
    </div>
  );
}
