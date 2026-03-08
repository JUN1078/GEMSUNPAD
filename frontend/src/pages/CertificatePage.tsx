import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Share2, CheckCircle, Award } from 'lucide-react';
import api from '../lib/api';
import logo from '../assets/logo.png';

export default function CertificatePage({ verify }: { verify?: boolean }) {
  const navigate = useNavigate();
  const { hash } = useParams<{ hash?: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (verify && hash) {
      api.get(`/learning/certificate/verify/${hash}`).then(r => { setCert(r.data.certificate); setLoading(false); }).catch(() => { setError('Sertifikat tidak valid'); setLoading(false); });
    } else {
      api.get('/learning/certificate').then(r => { setCert(r.data); setLoading(false); }).catch(err => {
        setError(err.response?.data?.error || 'Belum ada sertifikat');
        setLoading(false);
      });
    }
  }, [verify, hash]);

  const printCert = () => window.print();

  if (loading) return <div className="min-h-dvh flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (error || !cert) return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 safe-bottom">
      <Award size={64} className="text-gray-200 mb-4" />
      <p className="text-gray-600 font-bold text-lg">{error || 'Sertifikat tidak ditemukan'}</p>
      <p className="text-gray-400 text-sm mt-2 text-center">Selesaikan semua modul dan lulus ujian final untuk mendapatkan sertifikat</p>
      <button onClick={() => navigate('/app/learning')} className="mt-6 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl">Mulai Belajar</button>
    </div>
  );

  const user = cert.user || cert;
  const issuedDate = new Date(cert.issued_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-dvh bg-gray-100 safe-bottom fade-in">
      {!verify && (
        <div className="bg-primary-600 px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => navigate('/app/learning')} className="p-2.5 bg-white/20 rounded-xl text-white"><ArrowLeft size={20} /></button>
          <h1 className="text-white font-black text-lg flex-1">Sertifikat Digital</h1>
        </div>
      )}

      <div className="p-5">
        {/* Certificate card */}
        <div id="certificate" className="bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-primary-100">
          {/* Header */}
          <div className="bg-gradient-to-br from-unpad-blue via-primary-700 to-primary-600 p-6 text-center relative overflow-hidden">
            <div className="blob w-32 h-32 bg-yellow-300 opacity-15 -top-8 -right-8 absolute" />
            <div className="blob w-24 h-24 bg-blue-300 opacity-20 -bottom-6 -left-6 absolute" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg overflow-hidden mx-auto mb-3">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-yellow-200 text-xs font-semibold uppercase tracking-widest">Departemen Teknik Geologi</p>
              <p className="text-yellow-100 text-xs">Universitas Padjadjaran</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-4">
              <Award size={16} className="text-yellow-600" />
              <span className="text-yellow-700 text-xs font-bold uppercase tracking-wide">Sertifikat Kompetensi K3</span>
            </div>

            <p className="text-gray-500 text-sm mb-2">Diberikan kepada:</p>
            <div className="border-b-2 border-primary-600 pb-2 mb-4">
              <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
            </div>

            <p className="text-gray-500 text-xs mb-1">Nomor HSE: <span className="font-bold text-gray-700">{user.hse_number}</span></p>
            <p className="text-gray-500 text-xs mb-4">No. Sertifikat: <span className="font-bold text-primary-600">{cert.certificate_number}</span></p>

            <div className="bg-primary-50 rounded-2xl p-4 mb-4 border border-primary-100">
              <p className="text-gray-600 text-xs leading-relaxed">
                Telah menyelesaikan Program Pembelajaran K3 dan dinyatakan <strong className="text-primary-700">KOMPETEN</strong> dalam bidang Kesehatan, Keselamatan, dan Lingkungan Kerja
              </p>
              <p className="text-primary-700 font-black text-lg mt-2">Nilai: {cert.final_score}/100</p>
            </div>

            <p className="text-gray-400 text-xs">Diterbitkan pada {issuedDate}</p>

            {/* QR + Signature row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div className="text-left">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-gray-400 text-center leading-tight">QR<br/>Verify</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">Scan untuk verifikasi</p>
              </div>
              <div className="text-right">
                <div className="border-b border-gray-400 w-32 mb-1" />
                <p className="text-xs font-bold text-gray-600">Koordinator HSE</p>
                <p className="text-xs text-gray-400">Geologi Unpad</p>
              </div>
            </div>

            {verify && (
              <div className="mt-4 bg-green-50 rounded-xl p-3 border border-green-200 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-green-700 text-sm font-bold">Sertifikat Valid & Terverifikasi</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!verify && (
          <div className="flex gap-3 mt-5">
            <button onClick={printCert} className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <Download size={18} /> Download PDF
            </button>
            <button className="py-3 px-4 border border-gray-200 text-gray-600 font-semibold rounded-xl flex items-center gap-2">
              <Share2 size={18} /> Bagikan
            </button>
          </div>
        )}
      </div>

      <style>{`@media print { .no-print { display: none; } #certificate { box-shadow: none; border: 2px solid #16a34a; } }`}</style>
    </div>
  );
}
