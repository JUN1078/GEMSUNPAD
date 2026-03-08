import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Image as ImageIcon, Download, Instagram, Linkedin, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useStore } from '../store/useStore';

const CATEGORIES = ['Umum', 'Ergonomi', 'APD', 'Bahaya Fisik', 'Bahaya Kimia', 'Kesehatan Kerja', 'Regulasi', 'Keselamatan Lapangan'];

export default function SafetyCampaignPage() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [view, setView] = useState<'list' | 'create' | 'preview'>('list');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [exportModal, setExportModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [category, setCategory] = useState('Umum');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/campaigns');
      setCampaigns(data);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!title || !content) return toast.error('Judul dan konten wajib diisi');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      fd.append('author_name', authorName);
      fd.append('category', category);
      if (imageFile) fd.append('image', imageFile);
      await api.post('/campaigns', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Campaign berhasil dibuat!');
      setTitle(''); setContent(''); setImageFile(null); setImagePreview('');
      setView('list');
      load();
    } catch { toast.error('Gagal membuat campaign'); }
    finally { setLoading(false); }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign dihapus');
      load();
    } catch { toast.error('Gagal menghapus'); }
  };

  const exportAsImage = (format: 'instagram' | 'linkedin') => {
    const el = exportRef.current;
    if (!el) return;
    const w = format === 'instagram' ? 1080 : 1200;
    const h = format === 'instagram' ? 1080 : 627;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#16a34a');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles
    ctx.beginPath();
    ctx.arc(w - 80, 80, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(80, h - 80, 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();

    // Category badge
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(60, 60, 200, 50, 25);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(`🛡️ ${selected?.category || 'Safety Campaign'}`, 85, 92);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${format === 'instagram' ? 64 : 56}px Inter, sans-serif`;
    const words = (selected?.title || title).split(' ');
    let line = ''; let y = h * 0.35;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > w - 120 && line) {
        ctx.fillText(line, 60, y); line = word + ' '; y += 80;
      } else { line = test; }
    }
    ctx.fillText(line, 60, y); y += 100;

    // Content excerpt
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${format === 'instagram' ? 32 : 28}px Inter, sans-serif`;
    const excerpt = (selected?.content || content).slice(0, 120) + '...';
    const cwords = excerpt.split(' ');
    let cline = ''; let cy = y;
    for (const word of cwords) {
      const test = cline + word + ' ';
      if (ctx.measureText(test).width > w - 120 && cline) {
        ctx.fillText(cline, 60, cy); cline = word + ' '; cy += 46;
        if (cy > h - 180) break;
      } else { cline = test; }
    }
    ctx.fillText(cline, 60, cy);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, h - 100, w, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText(`✍️ ${selected?.author_name || authorName}`, 60, h - 60);
    ctx.font = '22px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('HSE Digital · Geologi Unpad', w - 60, h - 60);
    ctx.textAlign = 'left';

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${format}-${Date.now()}.png`;
    a.click();
    toast.success(`Berhasil diexport untuk ${format === 'instagram' ? 'Instagram' : 'LinkedIn'}!`);
    setExportModal(false);
  };

  if (view === 'create') return (
    <div className="min-h-dvh safe-bottom fade-in flex flex-col">
      <div className="bg-primary-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-primary-400 opacity-20 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => setView('list')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <h1 className="text-white font-black text-base">Buat Safety Campaign</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Image */}
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Foto / Banner</label>
          <div onClick={() => fileRef.current?.click()}
            className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-primary-400 transition-colors">
            {imagePreview
              ? <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
              : <div className="text-center text-gray-400"><ImageIcon size={32} className="mx-auto mb-2" /><p className="text-sm">Ketuk untuk upload foto</p></div>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-1.5">Judul Artikel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: 5 APD Wajib di Lapangan Geologi"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50" />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-1.5">Kategori</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 outline-none text-sm bg-gray-50">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-1.5">Konten Artikel *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={7}
            placeholder="Tulis isi artikel safety campaign di sini..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 resize-none" />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-1.5">Nama Penulis</label>
          <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Nama penulis"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 outline-none text-sm bg-gray-50" />
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-green-200 disabled:opacity-50">
          {loading ? 'Menyimpan...' : '🚀 Publikasikan Campaign'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh safe-bottom fade-in flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-primary-400 opacity-20 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-white font-black text-base">Safety Campaign</h1>
            <p className="text-primary-200 text-xs">Artikel & edukasi K3</p>
          </div>
          <button onClick={() => setView('create')} className="flex items-center gap-1.5 px-3 py-2 bg-white text-primary-700 rounded-xl font-bold text-xs">
            <Plus size={15} /> Buat
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={36} className="text-primary-600" />
            </div>
            <p className="text-gray-600 font-bold">Belum ada campaign</p>
            <p className="text-gray-400 text-sm mt-1">Buat artikel safety campaign pertama Anda!</p>
            <button onClick={() => setView('create')} className="mt-4 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm">
              Buat Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {c.image_url && (
                  <img src={`http://localhost:3001${c.image_url}`} alt={c.title}
                    className="w-full h-44 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-primary-700 font-semibold rounded-full">{c.category}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Eye size={11} /> {c.views}</span>
                  </div>
                  <h3 className="font-black text-gray-800 leading-tight mb-1">{c.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-2">✍️ {c.author_name} · {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setSelected(c); setExportModal(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-primary-700 rounded-xl text-xs font-bold border border-green-200">
                      <Download size={14} /> Export
                    </button>
                    {c.user_id === user?.id && (
                      <button onClick={() => deleteCampaign(c.id)}
                        className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl border border-red-100">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {exportModal && selected && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ maxWidth: '430px', margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setExportModal(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl">
            <h3 className="font-black text-gray-800 text-lg mb-2">Export Campaign</h3>
            <p className="text-gray-500 text-sm mb-6">Pilih format untuk didownload sebagai gambar</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => exportAsImage('instagram')}
                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white">
                <Instagram size={28} />
                <span className="font-black text-sm">Instagram</span>
                <span className="text-xs opacity-80">1080 × 1080</span>
              </button>
              <button onClick={() => exportAsImage('linkedin')}
                className="flex flex-col items-center gap-2 p-4 bg-[#0077B5] rounded-2xl text-white">
                <Linkedin size={28} />
                <span className="font-black text-sm">LinkedIn</span>
                <span className="text-xs opacity-80">1200 × 627</span>
              </button>
            </div>
            <button onClick={() => setExportModal(false)}
              className="w-full mt-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold text-sm">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
