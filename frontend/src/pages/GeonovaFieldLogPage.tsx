import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Trash2, Loader2, Sparkles, ChevronDown, ClipboardList, Camera, X, Image } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface FieldLog {
  id: string;
  station_name: string;
  lat: number | null;
  lng: number | null;
  elevation: number | null;
  strike: number | null;
  dip: number | null;
  rock_type: string;
  description: string;
  ai_enhanced_description: string;
  weather: string;
  notes: string;
  photos: string;
  created_at: string;
}

const ROCK_TYPES = ['Basalt', 'Granite', 'Marble', 'Quartzite', 'Coal', 'Limestone', 'Sandstone', 'Andesite', 'Diorite', 'Schist', 'Phyllite', 'Gneiss', 'Shale', 'Mudstone', 'Siltstone', 'Other'];
const WEATHER_OPTIONS = ['Cerah', 'Berawan', 'Hujan Ringan', 'Hujan Lebat', 'Berkabut', 'Berangin'];

const EMPTY_FORM = {
  station_name: '', lat: '', lng: '', elevation: '', strike: '', dip: '',
  rock_type: 'Basalt', description: '', weather: 'Cerah', notes: '',
};

export default function GeonovaFieldLogPage() {
  const navigate = useNavigate();
  const photoRef = useRef<HTMLInputElement>(null);

  const [logs, setLogs] = useState<FieldLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState('');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    api.get('/geonova/field-logs').then(r => setLogs(r.data)).catch(() => {});
  }, []);

  const handleGPS = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          elevation: pos.coords.altitude ? pos.coords.altitude.toFixed(1) : f.elevation,
        }));
        setLocating(false);
        toast.success('Koordinat GPS diperoleh');
      },
      () => { setLocating(false); toast.error('Gagal mendapatkan GPS'); }
    );
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('photos', f));
      const { data } = await api.post('/geonova/field-log-photos', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrls(prev => [...prev, ...(data.urls || [])]);
      toast.success(`${files.length} foto diunggah`);
    } catch {
      toast.error('Gagal mengunggah foto');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleEnhance = async () => {
    if (!form.description.trim()) return toast.error('Isi deskripsi terlebih dahulu');
    setEnhancing(true);
    try {
      const { data } = await api.post('/geonova/enhance-description', {
        description: form.description,
        rock_type: form.rock_type,
      });
      setEnhanced(data.enhanced_description || '');
      toast.success('Deskripsi dienhance oleh AI');
    } catch {
      toast.error('Gagal enhance deskripsi');
    } finally {
      setEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!form.station_name.trim()) return toast.error('Nama stasiun wajib diisi');
    setSaving(true);
    try {
      const payload = {
        station_name: form.station_name,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        elevation: form.elevation ? parseFloat(form.elevation) : null,
        strike: form.strike ? parseInt(form.strike) : null,
        dip: form.dip ? parseInt(form.dip) : null,
        rock_type: form.rock_type,
        description: form.description,
        ai_enhanced_description: enhanced,
        weather: form.weather,
        notes: form.notes,
        photos: photoUrls,
      };
      const { data } = await api.post('/geonova/field-logs', payload);
      setLogs(prev => [data, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEnhanced('');
      setPhotoUrls([]);
      toast.success('Stasiun lapangan tersimpan!');
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/geonova/field-logs/${id}`);
      setLogs(prev => prev.filter(l => l.id !== id));
      toast.success('Dihapus');
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const parsePhotos = (raw: string): string[] => {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 to-emerald-500 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-green-500 opacity-25 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app/geonova')} className="p-2.5 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Field Log</h1>
            <p className="text-green-100 text-xs">{logs.length} stasiun tersimpan</p>
          </div>
          <button onClick={() => setShowForm(true)} className="p-2.5 bg-white rounded-xl text-green-700 shadow-sm">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-8">
        {/* Empty state */}
        {logs.length === 0 && !showForm && (
          <div className="text-center py-16">
            <ClipboardList size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada catatan lapangan</p>
            <button onClick={() => setShowForm(true)} className="mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm">
              + Tambah Stasiun
            </button>
          </div>
        )}

        {/* Log List */}
        {logs.map(log => {
          const logPhotos = parsePhotos(log.photos);
          return (
            <div key={log.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                {/* First photo as thumbnail or icon */}
                {logPhotos.length > 0 ? (
                  <img
                    src={`http://localhost:3001${logPhotos[0]}`}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    alt=""
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800 text-sm">{log.station_name}</p>
                  <p className="text-xs text-gray-500">
                    {log.rock_type} · {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {logPhotos.length > 0 && <span className="ml-1.5 text-green-600">📷 {logPhotos.length}</span>}
                  </p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${expandedId === log.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedId === log.id && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {/* Photos grid */}
                  {logPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Foto Lapangan</p>
                      <div className="grid grid-cols-3 gap-2">
                        {logPhotos.map((url, i) => (
                          <img
                            key={i}
                            src={`http://localhost:3001${url}`}
                            className="w-full aspect-square object-cover rounded-xl"
                            alt={`foto-${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(log.lat || log.lng) && (
                    <div className="flex gap-2 text-xs text-gray-600">
                      <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span>{log.lat?.toFixed(5)}, {log.lng?.toFixed(5)}{log.elevation ? ` · ${log.elevation} m dpl` : ''}</span>
                    </div>
                  )}
                  {(log.strike != null || log.dip != null) && (
                    <div className="flex gap-3 flex-wrap text-xs">
                      {log.strike != null && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">Strike: {log.strike}°</span>}
                      {log.dip != null && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">Dip: {log.dip}°</span>}
                      {log.weather && <span className="bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">{log.weather}</span>}
                    </div>
                  )}
                  {log.description && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Deskripsi Lapangan</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{log.description}</p>
                    </div>
                  )}
                  {log.ai_enhanced_description && (
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                      <p className="text-xs font-bold text-orange-600 uppercase mb-1">✨ AI Enhanced</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{log.ai_enhanced_description}</p>
                    </div>
                  )}
                  {log.notes && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Catatan</p>
                      <p className="text-sm text-gray-600">{log.notes}</p>
                    </div>
                  )}
                  <button onClick={() => handleDelete(log.id)} className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                    <Trash2 size={13} /> Hapus Stasiun
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-3xl max-h-[92dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10 border-b border-gray-50">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-5 py-3 pb-8 space-y-4">
              <h2 className="text-lg font-black text-gray-800">Tambah Stasiun Lapangan</h2>

              {/* Station name */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Nama Stasiun *</label>
                <input
                  value={form.station_name}
                  onChange={e => setForm(f => ({ ...f, station_name: e.target.value }))}
                  placeholder="mis. STA-01, LP-Bukit Tunggul"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              {/* GPS */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-500">Koordinat GPS</label>
                  <button onClick={handleGPS} disabled={locating}
                    className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                    {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} Auto GPS
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="Lat" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                  <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="Lng" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                  <input value={form.elevation} onChange={e => setForm(f => ({ ...f, elevation: e.target.value }))}
                    placeholder="Elev (m)" className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
              </div>

              {/* Strike & Dip */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Strike / Dip</label>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.strike} onChange={e => setForm(f => ({ ...f, strike: e.target.value }))}
                    placeholder="Strike (°)" type="number"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                  <input value={form.dip} onChange={e => setForm(f => ({ ...f, dip: e.target.value }))}
                    placeholder="Dip (°)" type="number"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
              </div>

              {/* Rock type + Weather */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Jenis Batuan</label>
                  <select value={form.rock_type} onChange={e => setForm(f => ({ ...f, rock_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                    {ROCK_TYPES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Cuaca</label>
                  <select value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                    {WEATHER_OPTIONS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-500">Foto Lapangan</label>
                  <button
                    onClick={() => photoRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg"
                  >
                    {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                    {uploadingPhoto ? 'Mengunggah...' : 'Tambah Foto'}
                  </button>
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                {photoUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={`http://localhost:3001${url}`}
                          className="w-full aspect-square object-cover rounded-xl"
                          alt={`foto-${i + 1}`}
                        />
                        <button
                          onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {/* Add more */}
                    <button
                      onClick={() => photoRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center bg-green-50"
                    >
                      <Image size={20} className="text-green-400" />
                      <span className="text-xs text-green-500 mt-1">Tambah</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => photoRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 bg-gray-50"
                  >
                    <Camera size={24} className="text-gray-300" />
                    <p className="text-xs text-gray-400">Ambil atau pilih foto lapangan</p>
                  </button>
                )}
              </div>

              {/* Description + AI Enhance */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-500">Deskripsi Batuan / Singkapan</label>
                  <button onClick={handleEnhance} disabled={enhancing}
                    className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                    {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Enhance
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Deskripsikan batuan: warna, tekstur, butiran, struktur, derajat pelapukan..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                />
                {enhanced && (
                  <div className="mt-2 bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 mb-1">✨ Deskripsi AI Enhanced</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{enhanced}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Catatan Tambahan</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Struktur geologi, kekar, sesar, foto nomor..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-black rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {saving ? 'Menyimpan...' : 'Simpan Stasiun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
