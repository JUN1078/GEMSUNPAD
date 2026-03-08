import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, MapPin, ChevronRight, X, Layers } from 'lucide-react';
import api from '../lib/api';

const RISK_COLOR: Record<string, string> = { Critical: '#dc2626', High: '#f97316', Medium: '#eab308', Low: '#16a34a' };
const RISK_BG: Record<string, string> = {
  Critical: 'bg-red-50 border-red-200 text-red-700',
  High: 'bg-orange-50 border-orange-200 text-orange-700',
  Medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  Low: 'bg-green-50 border-green-200 text-green-700',
};

// 9 standard K3 hazard categories
const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; desc: string }> = {
  'Bahaya Fisik':            { icon: '🔊', color: 'text-blue-700',   bg: 'bg-blue-100',   desc: 'Kebisingan, radiasi, suhu ekstrem, pencahayaan, getaran' },
  'Bahaya Kimia':            { icon: '☣️', color: 'text-yellow-700', bg: 'bg-yellow-100', desc: 'Bahan berbahaya, beracun, mudah terbakar, reaktif, korosif' },
  'Bahaya Biologi':          { icon: '🦠', color: 'text-teal-700',   bg: 'bg-teal-100',   desc: 'Virus, bakteri, jamur, parasit, binatang/tanaman berbahaya' },
  'Bahaya Ergonomi':         { icon: '🦴', color: 'text-purple-700', bg: 'bg-purple-100', desc: 'Posisi kerja salah, gerakan berulang, pengangkutan manual, postur janggal' },
  'Bahaya Psikososial':      { icon: '🧠', color: 'text-pink-700',   bg: 'bg-pink-100',   desc: 'Stres kerja, beban berlebih, pelecehan, intimidasi, hubungan kerja buruk' },
  'Bahaya Mekanik':          { icon: '⚙️', color: 'text-orange-700', bg: 'bg-orange-100', desc: 'Mesin/alat kerja: terpotong, tersayat, terjepit, tertindih' },
  'Bahaya Elektrik':         { icon: '⚡', color: 'text-amber-700',  bg: 'bg-amber-100',  desc: 'Arus listrik, kabel terkelupas, peralatan listrik tidak aman' },
  'Kondisi Tidak Aman':      { icon: '⚠️', color: 'text-red-700',    bg: 'bg-red-100',    desc: 'Kondisi lingkungan/fasilitas yang berpotensi menyebabkan kecelakaan' },
  'Tindakan Tidak Aman':     { icon: '🚷', color: 'text-rose-700',   bg: 'bg-rose-100',   desc: 'Perilaku/tindakan pekerja yang melanggar prosedur keselamatan' },
};

declare global { interface Window { google: any; } }

export default function GeoDashboard() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/reports/geodashboard');
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!data || mapLoaded) return;
    const apiKey = 'AIzaSyDM6Qc8f8glWTOEh245cUR-dHBmoIrsPKw';

    const initMap = () => {
      try {
        if (!mapRef.current || !window.google) return;
        const center = data.all_markers?.length > 0
          ? { lat: data.all_markers[0].lat, lng: data.all_markers[0].lng }
          : { lat: -6.9218, lng: 107.6074 };

        const map = new window.google.maps.Map(mapRef.current, {
          center, zoom: 15, mapTypeId: 'hybrid',
          disableDefaultUI: true, zoomControl: true,
        });

        (data.all_markers || []).forEach((m: any) => {
          const marker = new window.google.maps.Marker({
            position: { lat: m.lat, lng: m.lng }, map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: m.ai_risk_level === 'Critical' ? 14 : m.ai_risk_level === 'High' ? 11 : 9,
              fillColor: RISK_COLOR[m.ai_risk_level] || '#6b7280',
              fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2,
            },
            title: m.ai_category,
          });
          const info = new window.google.maps.InfoWindow({
            content: `<div style="font-family:Inter,sans-serif;max-width:220px;padding:4px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:${RISK_COLOR[m.ai_risk_level]}">${m.ai_risk_level} - ${m.ai_category}</div>
              <p style="font-size:12px;color:#374151;margin:0 0 4px">${m.location_name || m.description?.slice(0, 60) || ''}</p>
              <p style="font-size:11px;color:#6b7280">${new Date(m.created_at).toLocaleDateString('id-ID')}</p>
            </div>`,
          });
          marker.addListener('click', () => info.open(map, marker));
        });

        if (data.all_markers?.length > 2 && window.google.maps.visualization) {
          const heatmapData = data.all_markers.map((m: any) => ({
            location: new window.google.maps.LatLng(m.lat, m.lng),
            weight: m.ai_risk_level === 'Critical' ? 4 : m.ai_risk_level === 'High' ? 3 : 2,
          }));
          new window.google.maps.visualization.HeatmapLayer({ data: heatmapData, map, radius: 40, opacity: 0.5 });
        }
        setMapLoaded(true);
      } catch (e) {
        console.warn('Google Maps init failed:', e);
      }
    };

    if (window.google?.maps) { initMap(); return; }
    const existing = document.querySelector('script[data-maps]');
    if (existing) { existing.addEventListener('load', initMap); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,places`;
    script.async = true;
    script.setAttribute('data-maps', '1');
    script.onload = initMap;
    script.onerror = () => console.warn('Google Maps script failed to load');
    document.head.appendChild(script);
  }, [data]);

  // Build sub-category counts for a selected main category
  const getSubCats = (mainCat: string) => {
    if (!data?.category_distribution) return [];
    return data.category_distribution
      .filter((c: any) => {
        const cat: string = c.category || '';
        const main = cat.includes(': ') ? cat.split(': ')[0] : cat;
        return main === mainCat;
      })
      .map((c: any) => ({
        sub: c.category.includes(': ') ? c.category.split(': ')[1] : c.category,
        count: c.count,
      }));
  };

  // Merge backend main_cat data with the 7 known categories (show 0 for missing)
  const allMainCats = Object.keys(CATEGORY_META).map(name => {
    const found = data?.main_category_distribution?.find((m: any) => m.main_cat === name);
    return { name, count: found?.count ?? 0 };
  });

  const selectedSubCats = selectedCategory ? getSubCats(selectedCategory) : [];
  const selectedMeta = selectedCategory ? (CATEGORY_META[selectedCategory] ?? { icon: '📋', color: 'text-gray-700', bg: 'bg-gray-100' }) : null;

  return (
    <div className="min-h-dvh bg-gray-900 flex flex-col safe-bottom">
      {/* Header */}
      <div className="bg-unpad-blue px-5 pt-6 pb-4 relative overflow-hidden">
        <div className="blob w-40 h-40 bg-blue-400 opacity-20 -top-10 -right-10 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2 bg-white/20 rounded-xl text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">GeoDashboard</h1>
            <p className="text-blue-200 text-xs">Kondisi Bahaya Real-Time</p>
          </div>
          <button onClick={loadData} className="p-2 bg-white/20 rounded-xl text-white">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {data?.critical_open > 0 && (
        <div className="bg-red-600 px-5 py-2.5 flex items-center gap-2">
          <AlertTriangle size={16} className="text-white flex-shrink-0 animate-pulse" />
          <p className="text-white text-xs font-bold">
            {data.critical_open} bahaya CRITICAL belum ditangani!
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Total Laporan', value: data?.total_reports ?? 0, color: 'bg-gray-800 text-white' },
          { label: 'Hari Ini', value: data?.today_reports ?? 0, color: 'bg-primary-600 text-white' },
          { label: 'Belum Ditangani', value: data?.open_reports ?? 0, color: 'bg-orange-600 text-white' },
          { label: 'Critical Aktif', value: data?.critical_open ?? 0, color: 'bg-red-600 text-white' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4`}>
            <p className="text-3xl font-black">{loading ? '—' : s.value}</p>
            <p className="text-xs font-medium opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Google Map */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden border-2 border-gray-700 h-64 relative">
        <div ref={mapRef} className="w-full h-full bg-gray-800" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center">
              <MapPin size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{loading ? 'Memuat peta...' : 'Peta'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Risk Distribution */}
      {data?.risk_distribution && (
        <div className="mx-4 mt-4 bg-gray-800 rounded-2xl p-4">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp size={16} /> Distribusi Risiko
          </h3>
          <div className="space-y-2">
            {['Critical', 'High', 'Medium', 'Low'].map(level => {
              const d = data.risk_distribution.find((r: any) => r.level === level);
              const count = d?.count || 0;
              const pct = data.total_reports > 0 ? (count / data.total_reports) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: RISK_COLOR[level] }} />
                  <span className="text-gray-300 text-xs w-16 font-medium">{level}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: RISK_COLOR[level] }} />
                  </div>
                  <span className="text-white text-xs font-bold w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Jenis Bahaya ── */}
      <div className="mx-4 mt-4 bg-gray-800 rounded-2xl p-4">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <Layers size={16} /> Jenis Bahaya
        </h3>
        <div className="space-y-2">
          {allMainCats.map(({ name, count }) => {
            const meta = CATEGORY_META[name] ?? { icon: '📋', color: 'text-gray-400', bg: 'bg-gray-700' };
            return (
              <button key={name} onClick={() => setSelectedCategory(name)}
                className="w-full flex items-center gap-3 bg-gray-700/60 rounded-xl px-3 py-2.5 hover:bg-gray-700 transition-colors text-left">
                <span className="text-base w-6 text-center flex-shrink-0">{meta.icon}</span>
                <span className="flex-1 text-gray-200 text-xs font-medium">{name}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${count > 0 ? meta.bg + ' ' + meta.color : 'bg-gray-600 text-gray-400'}`}>
                  {count}
                </span>
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Critical */}
      {data?.recent_critical?.length > 0 && (
        <div className="mx-4 mt-4 mb-6">
          <h3 className="text-white font-bold text-sm mb-3">Bahaya High/Critical Terkini</h3>
          <div className="space-y-2">
            {data.recent_critical.map((r: any) => (
              <div key={r.id} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3 border border-gray-700">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0">
                  {r.photo_url && <img src={`http://localhost:3001${r.photo_url}`} className="w-full h-full object-cover" alt="" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${RISK_BG[r.ai_risk_level]}`}>
                      {r.ai_risk_level}
                    </span>
                    <span className="text-gray-400 text-xs">{r.user_name}</span>
                  </div>
                  <p className="text-white text-xs font-semibold truncate mt-0.5">{r.ai_category}</p>
                  <p className="text-gray-400 text-xs truncate">{r.location_name || r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Sub-Dashboard Sheet ── */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setSelectedCategory(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-gray-900 rounded-t-3xl max-h-[75dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <span className="text-xl flex-shrink-0">{selectedMeta?.icon}</span>
                <div className="min-w-0">
                  <p className="text-white font-black text-sm">{selectedCategory}</p>
                  <p className="text-gray-400 text-xs leading-snug mt-0.5">{selectedMeta?.desc}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {allMainCats.find(c => c.name === selectedCategory)?.count ?? 0} laporan total
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="p-2 bg-gray-800 rounded-xl">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-2 pb-8">
              {selectedSubCats.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">Belum ada laporan untuk kategori ini</p>
                </div>
              ) : selectedSubCats.map(({ sub, count }: { sub: string; count: number }) => {
                const total = allMainCats.find(c => c.name === selectedCategory)?.count || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={sub} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-gray-200 text-xs font-semibold">{sub}</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${selectedMeta?.bg} ${selectedMeta?.color}`}>{count}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
