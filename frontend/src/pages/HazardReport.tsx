import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, ArrowLeft, Sparkles, CheckCircle, AlertTriangle, Upload, PenLine, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const RISK_BG: Record<string, string> = {
  Critical: 'bg-red-50 border-red-300 text-red-700',
  High: 'bg-orange-50 border-orange-300 text-orange-700',
  Medium: 'bg-yellow-50 border-yellow-300 text-yellow-700',
  Low: 'bg-green-50 border-green-300 text-green-700',
};

const HAZARD_CATEGORIES: Record<string, string[]> = {
  'Bahaya Lingkungan': [
    'Tanah Longsor', 'Pohon Tumbang', 'Genangan Air / Banjir',
    'Jalan Licin', 'Retakan Tanah', 'Batu Jatuh', 'Cuaca Ekstrem', 'Debu / Kualitas Udara Buruk',
  ],
  'Bahaya Infrastruktur': [
    'Jalan Rusak', 'Lubang di Jalan / Trotoar', 'Lampu Jalan Mati',
    'Bangunan Retak', 'Tangga Rusak', 'Drainase Tersumbat', 'Pagar Rusak', 'Area Parkir Tidak Aman',
  ],
  'Bahaya Laboratorium': [
    'Tumpahan Bahan Kimia', 'Gas Berbahaya', 'Alat Laboratorium Rusak',
    'Api / Risiko Kebakaran', 'Penyimpanan Bahan Kimia Tidak Aman', 'Ventilasi Buruk',
  ],
  'Bahaya Kegiatan Lapangan': [
    'Medan Terjal', 'Batu Longgar', 'Jalur Tidak Aman',
    'Risiko Jatuh', 'Area Tebing', 'Sungai Berarus Deras', 'Hewan Liar',
  ],
  'Perilaku Tidak Aman': [
    'Tidak Menggunakan APD', 'Merokok di Area Terlarang', 'Menggunakan Alat Tidak Sesuai',
    'Melanggar Prosedur Keselamatan', 'Bekerja Sendirian di Area Berbahaya',
  ],
  'Bahaya Kebakaran & Darurat': [
    'Potensi Kebakaran', 'Korsleting Listrik', 'APAR Tidak Tersedia',
    'Jalur Evakuasi Terhalang', 'Alarm Kebakaran Tidak Berfungsi',
  ],
  'Bahaya Biologi': [
    'Sarang Tawon', 'Ular', 'Anjing Liar', 'Serangga Berbahaya', 'Tanaman Beracun',
  ],
};

export default function HazardReport() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [mainCat, setMainCat] = useState('');
  const [subCat, setSubCat] = useState('');
  const [form, setForm] = useState({ description: '', location_name: '' });
  const [manualForm, setManualForm] = useState({
    category: '', risk_level: 'Medium', hazard_description: '',
    immediate_action: '', recommendation: '', regulation_ref: '', ppe_required: '',
  });
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'ai' | 'done'>('form');
  const [result, setResult] = useState<any>(null);

  const pickFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast.error('Ukuran file maksimal 10MB');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const getGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      p => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsLoading(false); toast.success('Lokasi berhasil didapat'); },
      () => { setGpsLoading(false); toast.error('Tidak bisa mendapatkan lokasi'); }
    );
  };

  const handleSubmit = async () => {
    if (!photo) return toast.error('Foto wajib diambil');
    if (!form.description) return toast.error('Deskripsi wajib diisi');
    if (!mainCat) return toast.error('Pilih kategori utama bahaya');
    if (!subCat) return toast.error('Pilih jenis bahaya');

    setLoading(true);
    if (mode === 'ai') setStep('ai');

    const combinedCat = `${mainCat}: ${subCat}`;

    try {
      const fd = new FormData();
      fd.append('photo', photo);
      fd.append('description', form.description);
      fd.append('activity_type', mainCat);
      fd.append('location_name', form.location_name);
      if (gps) { fd.append('lat', String(gps.lat)); fd.append('lng', String(gps.lng)); }

      if (mode === 'manual') {
        fd.append('manual', 'true');
        fd.append('category', combinedCat);
        fd.append('risk_level', manualForm.risk_level);
        fd.append('hazard_description', manualForm.hazard_description);
        fd.append('immediate_action', manualForm.immediate_action);
        fd.append('recommendation', manualForm.recommendation);
        fd.append('regulation_ref', manualForm.regulation_ref);
        const ppeArr = manualForm.ppe_required
          ? JSON.stringify(manualForm.ppe_required.split(',').map(s => s.trim()).filter(Boolean))
          : '[]';
        fd.append('ppe_required', ppeArr);
      }

      const { data } = await api.post('/hazards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      setStep('done');
      toast.success(`+${data.points_earned} poin! Laporan tersimpan`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal membuat laporan');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'ai') return (
    <div className="min-h-dvh bg-primary-600 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
        <Sparkles size={36} className="text-primary-600 animate-pulse" />
      </div>
      <h2 className="text-white font-black text-xl mb-2">AI Menganalisis...</h2>
      <p className="text-primary-100 text-sm">Gemini Vision sedang mengidentifikasi bahaya dan menilai risiko</p>
      <div className="flex gap-2 mt-6">
        {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
      </div>
    </div>
  );

  if (step === 'done' && result) return (
    <div className="min-h-dvh bg-primary-600 safe-bottom fade-in">
      <div className="pt-12 px-5 pb-6 relative z-10 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl bounce-in">
          <CheckCircle size={32} className="text-primary-600" />
        </div>
        <h2 className="text-white font-black text-xl">Laporan Tersimpan!</h2>
        <p className="text-primary-100 text-sm mt-1">+{result.points_earned} poin diperoleh</p>
        {result.manual && <span className="inline-block mt-1 bg-orange-400/30 text-orange-100 text-xs px-2 py-0.5 rounded-full">Submit Manual</span>}
      </div>

      <div className="bg-white rounded-t-3xl px-5 pt-6 pb-safe min-h-[70vh] overflow-y-auto">
        {preview && <img src={preview} className="w-full h-44 object-cover rounded-2xl mb-4" alt="hazard" />}

        <div className={`rounded-2xl p-4 border mb-4 ${RISK_BG[result.report?.ai_risk_level] || 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} />
            <span className="font-black text-base">{result.report?.ai_risk_level} Risk</span>
          </div>
          <p className="font-bold text-sm mb-1">{result.report?.ai_category}</p>
          <p className="text-sm opacity-80">{result.report?.ai_hazard_description}</p>
        </div>

        <div className="space-y-3">
          {result.report?.ai_immediate_action && (
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <p className="text-xs font-bold text-orange-700 mb-1">⚡ Tindakan Segera</p>
              <p className="text-xs text-orange-600">{result.report.ai_immediate_action}</p>
            </div>
          )}
          {result.report?.ai_recommendation && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-bold text-blue-700 mb-1">🛡️ Rekomendasi</p>
              <p className="text-xs text-blue-600">{result.report.ai_recommendation}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => { setStep('form'); setPhoto(null); setPreview(''); setResult(null); }}
            className="flex-1 py-3 border-2 border-primary-600 text-primary-600 font-bold rounded-xl text-sm">
            + Lapor Lagi
          </button>
          <button onClick={() => navigate('/app')} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl text-sm shadow-lg">
            Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-primary-600 safe-bottom">
      <div className="blob w-48 h-48 bg-primary-400 opacity-25 -top-12 -right-12 absolute" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-6">
        <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-white font-black text-lg">Lapor Bahaya</h1>
          <p className="text-primary-100 text-xs">
            {mode === 'ai' ? 'AI akan analisis & nilai risiko' : 'Isi detail bahaya secara manual'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl px-5 pt-5 pb-6 relative z-10 min-h-[80vh] overflow-y-auto">
        {/* Mode Toggle */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-2xl p-1">
          <button onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${mode === 'ai' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500'}`}>
            <Sparkles size={15} /> Analisis AI
          </button>
          <button onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${mode === 'manual' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500'}`}>
            <PenLine size={15} /> Submit Manual
          </button>
        </div>

        {/* Photo */}
        <div className="mb-5">
          <p className="text-sm font-bold text-gray-700 mb-2">Foto Bahaya <span className="text-red-500">*</span></p>
          {preview ? (
            <div className="relative">
              <img src={preview} className="w-full h-48 object-cover rounded-2xl" alt="preview" />
              <button onClick={() => { setPhoto(null); setPreview(''); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 text-xs">✕</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center gap-2 py-6 bg-primary-50 border-2 border-dashed border-primary-300 rounded-2xl text-primary-600">
                <Camera size={28} />
                <span className="text-xs font-bold">Buka Kamera</span>
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-2 py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
                <Upload size={28} />
                <span className="text-xs font-bold">Pilih Foto</span>
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
        </div>

        {/* GPS */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-700 mb-2">Lokasi</p>
          <button onClick={getGPS} disabled={gpsLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold w-full justify-center
              ${gps ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
            <MapPin size={16} />
            {gpsLoading ? 'Mendapatkan GPS...' : gps ? `GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'Gunakan GPS Otomatis'}
          </button>
          <input value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
            placeholder="Nama lokasi (opsional, cth: Lab Petrologi)"
            className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none" />
        </div>

        {/* Category */}
        <div className="mb-4 space-y-2">
          <p className="text-sm font-bold text-gray-700">Kategori Bahaya <span className="text-red-500">*</span></p>
          <div className="relative">
            <select value={mainCat} onChange={e => { setMainCat(e.target.value); setSubCat(''); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none appearance-none">
              <option value="">Pilih kategori utama...</option>
              {Object.keys(HAZARD_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {mainCat && (
            <div className="relative">
              <select value={subCat} onChange={e => setSubCat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-primary-200 text-sm bg-primary-50 outline-none appearance-none">
                <option value="">Pilih jenis bahaya...</option>
                {HAZARD_CATEGORIES[mainCat].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-700 mb-2">Deskripsi Bahaya <span className="text-red-500">*</span></p>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Deskripsikan bahaya yang kamu temukan..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none resize-none" />
        </div>

        {/* Manual-only fields */}
        {mode === 'manual' && (
          <div className="space-y-4 bg-orange-50 rounded-2xl p-4 border border-orange-100 mb-5">
            <p className="text-sm font-black text-orange-700 flex items-center gap-1.5">
              <PenLine size={15} /> Detail Bahaya
            </p>

            {subCat && (
              <div className="bg-white rounded-xl px-3 py-2 border border-orange-200">
                <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">Kategori terpilih</p>
                <p className="text-xs font-bold text-gray-700 mt-0.5">{mainCat}: {subCat}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Tingkat Risiko <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map(r => {
                  const colors: Record<string, string> = {
                    Low: 'bg-green-500', Medium: 'bg-yellow-500', High: 'bg-orange-500', Critical: 'bg-red-500',
                  };
                  return (
                    <button key={r} onClick={() => setManualForm(f => ({ ...f, risk_level: r }))}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border-2
                        ${manualForm.risk_level === r ? `${colors[r]} text-white border-transparent shadow` : 'bg-white text-gray-500 border-gray-200'}`}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Deskripsi Bahaya</p>
              <textarea value={manualForm.hazard_description} onChange={e => setManualForm(f => ({ ...f, hazard_description: e.target.value }))}
                placeholder="Jelaskan jenis bahaya yang teridentifikasi..."
                rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none resize-none" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Tindakan Segera</p>
              <textarea value={manualForm.immediate_action} onChange={e => setManualForm(f => ({ ...f, immediate_action: e.target.value }))}
                placeholder="Tindakan yang harus dilakukan segera..."
                rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none resize-none" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Rekomendasi Pengendalian</p>
              <textarea value={manualForm.recommendation} onChange={e => setManualForm(f => ({ ...f, recommendation: e.target.value }))}
                placeholder="Rekomendasi pengendalian bahaya..."
                rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none resize-none" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">Referensi Regulasi</p>
                <input value={manualForm.regulation_ref} onChange={e => setManualForm(f => ({ ...f, regulation_ref: e.target.value }))}
                  placeholder="cth: UU No.1/1970, Permenaker No.8/2010"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">APD (pisahkan koma)</p>
                <input value={manualForm.ppe_required} onChange={e => setManualForm(f => ({ ...f, ppe_required: e.target.value }))}
                  placeholder="cth: Helm, Safety Shoes, Sarung Tangan"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit}
          disabled={loading || !photo || !form.description || !mainCat || !subCat}
          className={`w-full py-4 text-white font-black rounded-2xl text-base active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg
            ${mode === 'ai' ? 'bg-primary-600 shadow-green-200' : 'bg-orange-500 shadow-orange-200'}`}>
          {mode === 'ai' ? <Sparkles size={20} /> : <PenLine size={20} />}
          {loading ? 'Menyimpan...' : mode === 'ai' ? 'Analisis dengan AI' : 'Submit Manual'}
        </button>
      </div>
    </div>
  );
}
