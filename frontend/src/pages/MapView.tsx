import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Layers } from 'lucide-react';
import api from '../lib/api';

const RISK_COLOR: Record<string, string> = { Critical: '#dc2626', High: '#f97316', Medium: '#eab308', Low: '#16a34a' };

declare global { interface Window { google: any; } }

export default function MapView() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [mapReady, setMapReady] = useState(false);
  const mapInstance = useRef<any>(null);
  const markerObjects = useRef<any[]>([]);

  useEffect(() => {
    api.get('/hazards/map').then(r => setMarkers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mapReady || !mapRef.current) return;
    const init = () => {
      if (!window.google?.maps || !mapRef.current) return;
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: -6.9218, lng: 107.6074 },
        zoom: 15, mapTypeId: 'roadmap',
        disableDefaultUI: false, zoomControl: true,
      });
      setMapReady(true);
    };
    if (window.google?.maps) { init(); return; }
    if (document.querySelector('script[src*="maps.googleapis"]')) return;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDM6Qc8f8glWTOEh245cUR-dHBmoIrsPKw&libraries=visualization,places`;
    s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [mapRef.current]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    markerObjects.current.forEach(m => m.setMap(null));
    markerObjects.current = [];
    const filtered = filter === 'all' ? markers : markers.filter(m => m.ai_risk_level === filter);
    filtered.forEach(m => {
      const mk = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng }, map: mapInstance.current,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: RISK_COLOR[m.ai_risk_level] || '#6b7280', fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
      });
      mk.addListener('click', () => {
        new window.google.maps.InfoWindow({
          content: `<div style="font-family:Inter,sans-serif;max-width:200px"><b style="color:${RISK_COLOR[m.ai_risk_level]}">${m.ai_risk_level}</b><br/><b>${m.ai_category}</b><br/><small>${m.location_name || m.description?.slice(0, 50)}</small></div>`
        }).open(mapInstance.current, mk);
      });
      markerObjects.current.push(mk);
    });
  }, [mapReady, markers, filter]);

  return (
    <div className="min-h-dvh flex flex-col fade-in">
      <div className="bg-primary-600 px-5 pt-6 pb-4 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-primary-400 opacity-20 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Peta Bahaya</h1>
            <p className="text-primary-100 text-xs">{markers.length} titik terpetakan</p>
          </div>
          <button onClick={() => navigate('/app/geodashboard')} className="p-2.5 bg-white/20 rounded-xl text-white"><Layers size={20} /></button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="bg-white border-b border-green-100 px-4 py-2 flex gap-2 overflow-x-auto">
        {['all', 'Critical', 'High', 'Medium', 'Low'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all
              ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 bg-gray-200" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <Filter size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Memuat peta...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-green-100 px-5 py-3 flex justify-around">
        {Object.entries(RISK_COLOR).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: v }} />
            <span className="text-xs text-gray-600 font-medium">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
