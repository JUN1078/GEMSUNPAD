import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const periods = [
  { key: 'daily', label: 'Harian', desc: 'Laporan hari ini', icon: '📅' },
  { key: 'weekly', label: 'Mingguan', desc: '7 hari terakhir', icon: '📆' },
  { key: 'monthly', label: 'Bulanan', desc: 'Bulan ini', icon: '🗓️' },
  { key: 'quarterly', label: 'Kuartalan', desc: 'Kuartal ini', icon: '📊' },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const fetchReport = async (period: string, fmt: string = 'json') => {
    setLoading(period);
    try {
      const { data } = await api.get(`/reports/download?period=${period}&format=${fmt}`);
      setPreview(data);
      toast.success(`Laporan ${period} berhasil dimuat!`);
    } catch { toast.error('Gagal memuat laporan'); }
    finally { setLoading(null); }
  };

  const fetchCustom = async () => {
    if (!from || !to) return toast.error('Pilih rentang tanggal');
    setLoading('custom');
    try {
      const { data } = await api.get(`/reports/download?from=${from}&to=${to}&format=json`);
      setPreview(data);
      toast.success('Laporan kustom berhasil dimuat!');
    } catch { toast.error('Gagal memuat laporan'); }
    finally { setLoading(null); }
  };

  return (
    <div className="min-h-dvh safe-bottom fade-in">
      <div className="bg-gray-800 px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="blob w-32 h-32 bg-gray-600 opacity-30 -top-8 -right-8 absolute" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => navigate('/app')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-black text-white">Laporan & Export</h1>
            <p className="text-gray-400 text-xs">Download laporan periodik</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-6 space-y-4">
        {/* Period buttons */}
        <div className="grid grid-cols-2 gap-3">
          {periods.map(p => (
            <button key={p.key} onClick={() => fetchReport(p.key)}
              disabled={loading === p.key}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-all hover:border-primary-200">
              <div className="text-2xl mb-2">{p.icon}</div>
              <p className="font-bold text-gray-800 text-sm">{p.label}</p>
              <p className="text-gray-400 text-xs">{p.desc}</p>
              {loading === p.key && <div className="mt-2 text-xs text-primary-600 font-semibold">Memuat...</div>}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-primary-600" />
            <p className="font-bold text-gray-800 text-sm">Kustom</p>
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Dari</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Sampai</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 outline-none focus:border-primary-400" />
            </div>
          </div>
          <button onClick={fetchCustom} disabled={loading === 'custom'}
            className="w-full py-2.5 bg-primary-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
            <Download size={16} /> {loading === 'custom' ? 'Memuat...' : 'Download Laporan'}
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-primary-600" />
              <h3 className="font-bold text-gray-800">Ringkasan Laporan</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-primary-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary-700">{preview.summary?.total || 0}</p>
                <p className="text-xs text-gray-500">Total Laporan</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-red-600">{preview.summary?.by_risk?.Critical || 0}</p>
                <p className="text-xs text-gray-500">Critical</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-orange-600">{preview.summary?.by_risk?.High || 0}</p>
                <p className="text-xs text-gray-500">High</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{preview.summary?.by_status?.open || 0}</p>
                <p className="text-xs text-gray-500">Terbuka</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">Periode: {preview.summary?.from} s/d {preview.summary?.to}</p>
          </div>
        )}
      </div>
    </div>
  );
}
