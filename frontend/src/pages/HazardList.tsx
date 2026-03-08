import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, Download } from 'lucide-react';
import api from '../lib/api';
import { useStore } from '../store/useStore';
import HazardDetailSheet from '../components/HazardDetailSheet';

const RISK_BG: Record<string, string> = {
  Critical: 'border-l-red-500', High: 'border-l-orange-500', Medium: 'border-l-yellow-500', Low: 'border-l-green-500',
};
const RISK_BADGE: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700', High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700',
};

export default function HazardList() {
  const navigate = useNavigate();
  const { user, token } = useStore();
  const isAdmin = user?.role === 'admin';
  const canExport = user?.role === 'admin' || user?.role === 'member';

  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { api.get('/hazards?limit=100').then(r => setReports(r.data.reports || [])).catch(() => {}); }, []);

  const filtered = reports.filter(r => {
    if (filter === 'open' || filter === 'closed' || filter === 'in_progress') {
      if (r.status !== filter) return false;
    } else if (filter !== 'all' && r.ai_risk_level !== filter) {
      return false;
    }
    if (search && !r.ai_category?.toLowerCase().includes(search.toLowerCase()) && !r.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExport = async (fmt: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const ext = fmt === 'csv' ? 'csv' : 'xlsx';
      const mime = fmt === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const res = await api.get(`/reports/export/${fmt}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_bahaya_${new Date().toISOString().split('T')[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-primary-600 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-36 h-36 bg-primary-400 opacity-25 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">Laporan Bahaya</h1>
            <p className="text-primary-100 text-xs">{reports.length} laporan tersimpan</p>
          </div>
          {canExport && (
            <div className="flex gap-1.5">
              <button onClick={() => handleExport('csv')} disabled={exporting}
                className="px-2.5 py-2 bg-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-1">
                <Download size={14} /> CSV
              </button>
              <button onClick={() => handleExport('excel')} disabled={exporting}
                className="px-2.5 py-2 bg-white rounded-xl text-primary-600 text-xs font-bold flex items-center gap-1">
                <Download size={14} /> Excel
              </button>
            </div>
          )}
          {isAdmin && (
            <button onClick={() => navigate('/app/hazards/new')} className="p-2.5 bg-white rounded-xl text-primary-600 shadow-sm"><Plus size={20} /></button>
          )}
        </div>
      </div>

      <div className="bg-white border-b border-green-100 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari laporan..." className="flex-1 text-sm bg-transparent outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {['all', 'Critical', 'High', 'Medium', 'Low', 'open', 'in_progress', 'closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0
                ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {f === 'all' ? 'Semua' : f === 'in_progress' ? 'In Progress' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Filter size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada laporan ditemukan</p>
          </div>
        ) : filtered.map(r => (
          <button key={r.id} onClick={() => setSelected(r)}
            className={`w-full bg-white rounded-2xl shadow-sm border-l-4 ${RISK_BG[r.ai_risk_level] || 'border-l-gray-200'} overflow-hidden text-left active:scale-98 transition-transform`}>
            <div className="flex items-center gap-3 p-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {r.photo_url && <img src={`http://localhost:3001${r.photo_url}`} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${RISK_BADGE[r.ai_risk_level] || 'bg-gray-100 text-gray-600'}`}>{r.ai_risk_level}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'open' ? 'bg-blue-100 text-blue-600' : r.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-600'}`}>{r.status}</span>
                </div>
                <p className="text-sm font-bold text-gray-800 truncate">{r.ai_category || 'Bahaya'}</p>
                <p className="text-xs text-gray-500 truncate">{r.location_name || r.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.user_name} · {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <HazardDetailSheet
        hazard={selected}
        onClose={() => setSelected(null)}
        onDelete={id => setReports(prev => prev.filter(r => r.id !== id))}
        onUpdate={updated => setReports(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))}
      />
    </div>
  );
}
