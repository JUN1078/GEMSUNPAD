import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Loader2, Mountain, Microscope, Bone, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

type TabType = 'rock' | 'petrographic' | 'fossil';

const TABS: { id: TabType; label: string; icon: typeof Camera; endpoint: string; desc: string }[] = [
  { id: 'rock',        label: 'Rock ID',   icon: Mountain,    endpoint: '/geonova/rock-id',     desc: 'Upload foto batuan untuk identifikasi AI' },
  { id: 'petrographic',label: 'Petrografi',icon: Microscope,  endpoint: '/geonova/petrographic', desc: 'Upload foto sayatan tipis di bawah mikroskop' },
  { id: 'fossil',      label: 'Fosil',     icon: Bone,        endpoint: '/geonova/fossil-id',   desc: 'Upload foto spesimen fosil untuk identifikasi' },
];


function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-9 text-right">{value}%</span>
    </div>
  );
}

function RockResultCard({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black text-gray-800">{result.rock_type}</h3>
          <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-bold">{result.rock_class}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Kepercayaan AI</p>
        <ConfidenceBar value={result.confidence ?? 0} />
      </div>
      {result.color && <InfoRow label="Warna" value={result.color} />}
      {result.texture && <InfoRow label="Tekstur" value={result.texture} />}
      {result.grain_size && <InfoRow label="Ukuran Butir" value={result.grain_size} />}
      {result.structure && <InfoRow label="Struktur" value={result.structure} />}
      {result.mineral_composition?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Komposisi Mineral</p>
          <div className="flex flex-wrap gap-1.5">
            {result.mineral_composition.map((m: string, i: number) => (
              <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-100">{m}</span>
            ))}
          </div>
        </div>
      )}
      {result.formation_process && <InfoRow label="Proses Pembentukan" value={result.formation_process} multiline />}
      {result.geological_setting && <InfoRow label="Lingkungan Geologi" value={result.geological_setting} multiline />}
      {result.field_notes && <InfoRow label="Catatan Lapangan" value={result.field_notes} multiline />}
      {result.economic_significance && <InfoRow label="Signifikansi Ekonomi" value={result.economic_significance} multiline />}
    </div>
  );
}

function PetroResultCard({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black text-gray-800">{result.rock_type}</h3>
          <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">{result.rock_class}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Kepercayaan AI</p>
        <ConfidenceBar value={result.confidence ?? 0} />
      </div>
      {result.classification && <InfoRow label="Klasifikasi" value={result.classification} />}
      {result.texture && <InfoRow label="Tekstur" value={result.texture} />}
      {result.fabric && <InfoRow label="Fabric" value={result.fabric} />}
      {result.alteration && <InfoRow label="Derajat Alterasi" value={result.alteration} />}
      {result.minerals?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mineral (Sayatan Tipis)</p>
          <div className="space-y-1.5">
            {result.minerals.map((m: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold text-purple-700 w-24 flex-shrink-0">{m.name} ({m.percentage}%)</span>
                <span className="text-gray-600">{m.optical_properties}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.petrogenesis && <InfoRow label="Petrogenesis" value={result.petrogenesis} multiline />}
    </div>
  );
}

function FossilResultCard({ result }: { result: any }) {
  return (
    <div className="space-y-3">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-black text-gray-800">{result.fossil_type}</h3>
          <span className="text-xs px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full font-bold">{result.kingdom}</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Kepercayaan AI</p>
        <ConfidenceBar value={result.confidence ?? 0} />
      </div>
      {result.phylum && <InfoRow label="Filum" value={`${result.phylum} › ${result.class ?? ''} › ${result.order_family ?? ''}`} />}
      {result.estimated_age && <InfoRow label="Perkiraan Umur" value={result.estimated_age} />}
      {result.stratigraphic_range && <InfoRow label="Rentang Stratigrafi" value={result.stratigraphic_range} />}
      {result.preservation && <InfoRow label="Preservasi" value={`${result.preservation} · ${result.preservation_type ?? ''}`} />}
      {result.paleoenvironment && <InfoRow label="Paleoenvironment" value={result.paleoenvironment} />}
      {result.biostratigraphic_value && <InfoRow label="Nilai Biostratigrafi" value={result.biostratigraphic_value} />}
      {result.key_features?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ciri Utama</p>
          <ul className="space-y-1">
            {result.key_features.map((f: string, i: number) => (
              <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-orange-500">•</span>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {result.paleoecology && <InfoRow label="Paleoekologi" value={result.paleoecology} multiline />}
    </div>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className={`text-sm text-gray-700 ${multiline ? 'leading-relaxed' : ''}`}>{value}</p>
    </div>
  );
}

export default function GeonovaRockIdPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialTab = (searchParams.get('tab') as TabType) || 'rock';
const [tab, setTab] = useState<TabType>(initialTab);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFile = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return toast.error('Pilih gambar terlebih dahulu');
    setLoading(true);
    setResult(null);
    try {
      const tabInfo = TABS.find(t => t.id === tab)!;
      const form = new FormData();
      form.append('image', imageFile);
      if (context) form.append('context', context);
      const { data } = await api.post(tabInfo.endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      toast.success('Analisis selesai!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Analisis gagal');
    } finally {
      setLoading(false);
    }
  };

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-500 px-5 pt-6 pb-4 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-orange-400 opacity-25 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app/geonova')} className="p-2.5 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">AI Geo Analysis</h1>
            <p className="text-orange-100 text-xs">Powered by Gemini 2.5 Flash Vision</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 relative z-10">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                tab === t.id ? 'bg-white text-orange-600' : 'bg-white/20 text-white'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-3">{activeTab.desc}</p>

          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} className="w-full max-h-64 object-contain rounded-xl bg-gray-50" alt="preview" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setResult(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-orange-200 rounded-xl p-8 flex flex-col items-center gap-2 bg-orange-50 active:bg-orange-100 transition-colors"
            >
              <Upload size={32} className="text-orange-400" />
              <p className="text-sm font-bold text-orange-600">Pilih atau ambil foto</p>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 10 MB</p>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Konteks tambahan (lokasi, observasi, dll.) — opsional"
            rows={2}
            className="w-full mt-3 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none placeholder-gray-400"
          />

          <button
            onClick={handleAnalyze}
            disabled={!imageFile || loading}
            className="w-full mt-3 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" />Menganalisis...</> : <><Camera size={18} />Analisis dengan AI</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Hasil Analisis AI</p>
            {tab === 'rock' && <RockResultCard result={result.result} />}
            {tab === 'petrographic' && <PetroResultCard result={result.result} />}
            {tab === 'fossil' && <FossilResultCard result={result.result} />}
          </div>
        )}

      </div>
    </div>
  );
}
