import { useEffect, useState } from 'react';
import { X, MapPin, AlertTriangle, ShieldCheck, FileText, User, Calendar, Trash2, Save, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useStore } from '../store/useStore';

const RISK_TEXT: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
};

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
};

const parseRecommendation = (text: string) => {
  const items: { no: string; hierarki: string; tindakan: string }[] = [];
  const pattern = /(\d+)\.\s+([^:]+?):\s*([\s\S]+?)(?=\s*\d+\.\s+[^:]+:|$)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    items.push({ no: match[1], hierarki: match[2].trim(), tindakan: match[3].trim() });
  }
  return items;
};

interface Props {
  hazard: any | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: (updated: any) => void;
}

export default function HazardDetailSheet({ hazard, onClose, onDelete, onUpdate }: Props) {
  const { user } = useStore();
  const isAdmin = user?.role === 'admin';

  const [status, setStatus] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [correctiveDeadline, setCorrectiveDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (hazard) {
      setStatus(hazard.status || 'open');
      setAdminResponse(hazard.admin_response || '');
      setCorrectiveAction(hazard.corrective_action || '');
      setCorrectiveDeadline(hazard.corrective_action_deadline || '');
      setConfirmDelete(false);
    }
  }, [hazard]);

  if (!hazard) return null;

  const ppe: string[] = (() => {
    try { return JSON.parse(hazard.ai_ppe_required || '[]'); }
    catch { return []; }
  })();

  const date = new Date(hazard.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/hazards/${hazard.id}/respond`, {
        status,
        admin_response: adminResponse || undefined,
        corrective_action: correctiveAction || undefined,
        corrective_action_deadline: correctiveDeadline || undefined,
      });
      toast.success('Respons berhasil disimpan');
      onUpdate?.(data.report);
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/hazards/${hazard.id}`);
      toast.success('Laporan berhasil dihapus');
      onDelete?.(hazard.id);
      onClose();
    } catch {
      toast.error('Gagal menghapus laporan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-t-3xl max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-white z-10 border-b border-gray-50">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${RISK_TEXT[hazard.ai_risk_level] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            ⚠ {hazard.ai_risk_level || 'Unknown'}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[hazard.status] || 'bg-gray-100 text-gray-500'}`}>
              {hazard.status}
            </span>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-xl">
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Photo left + Title right */}
        <div className="flex gap-3 mx-5 mb-4">
          {hazard.photo_url && (
            <div className="w-32 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
              <img
                src={`http://localhost:3001${hazard.photo_url}`}
                className="w-full h-full object-cover"
                alt="hazard"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 py-1 flex flex-col gap-1.5">
            <h2 className="text-lg font-black text-gray-800 leading-tight">{hazard.ai_category || 'Bahaya K3'}</h2>
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500 leading-snug">{hazard.location_name || 'Lokasi tidak diketahui'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">{hazard.user_name || 'Reporter'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400">{date}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {/* No-photo fallback header */}
          {!hazard.photo_url && (
            <div>
              <h2 className="text-xl font-black text-gray-800">{hazard.ai_category || 'Bahaya K3'}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-gray-400" />
                <p className="text-sm text-gray-500">{hazard.location_name || 'Lokasi tidak diketahui'}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Deskripsi Laporan</p>
            <p className="text-sm text-gray-700 leading-relaxed">{hazard.description}</p>
          </div>

          {/* AI Analysis */}
          {hazard.ai_hazard_description && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-sm font-bold text-red-700">Analisis Bahaya (AI)</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{hazard.ai_hazard_description}</p>
            </div>
          )}

          {/* Immediate Action */}
          {hazard.ai_immediate_action && (
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1.5">⚡ Tindakan Segera</p>
              <p className="text-sm text-gray-700 leading-relaxed">{hazard.ai_immediate_action}</p>
            </div>
          )}

          {/* Recommendation */}
          {hazard.ai_recommendation && (() => {
            const items = parseRecommendation(hazard.ai_recommendation);
            return (
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <p className="text-sm font-bold text-blue-700">Rekomendasi Pengendalian</p>
                </div>
                {items.length > 0 ? (
                  <div className="rounded-xl overflow-hidden border border-blue-200">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="text-center p-2 font-bold text-blue-700 w-7">No</th>
                          <th className="text-left p-2 font-bold text-blue-700 w-28">Hierarki</th>
                          <th className="text-left p-2 font-bold text-blue-700">Tindakan Pengendalian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className={`border-t border-blue-100 ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}`}>
                            <td className="p-2 font-black text-blue-600 text-center align-top">{item.no}</td>
                            <td className="p-2 font-semibold text-blue-700 align-top leading-snug">{item.hierarki}</td>
                            <td className="p-2 text-gray-700 leading-relaxed">{item.tindakan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{hazard.ai_recommendation}</p>
                )}
              </div>
            );
          })()}

          {/* PPE */}
          {ppe.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🦺 APD yang Diperlukan</p>
              <div className="flex flex-wrap gap-2">
                {ppe.map((p, i) => (
                  <span key={i} className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-full font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regulation */}
          {hazard.ai_regulation_ref && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={15} className="text-gray-400" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Referensi Regulasi</p>
              </div>
              <p className="text-sm text-gray-700">{hazard.ai_regulation_ref}</p>
            </div>
          )}

          {/* Corrective Action (display — visible to all if set) */}
          {hazard.corrective_action && !isAdmin && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={16} className="text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700">Tindakan Korektif</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{hazard.corrective_action}</p>
              {hazard.corrective_action_deadline && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  🗓 Deadline: {new Date(hazard.corrective_action_deadline).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                </p>
              )}
            </div>
          )}

          {/* Admin Response (display — visible to all if set) */}
          {hazard.admin_response && !isAdmin && (
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-1.5">💬 Respons Admin</p>
              <p className="text-sm text-gray-700">{hazard.admin_response}</p>
              {hazard.admin_response_by && (
                <p className="text-xs text-purple-400 mt-1">— {hazard.admin_response_by}</p>
              )}
            </div>
          )}

          {/* ── Admin Panel ── */}
          {isAdmin && (
            <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
              <p className="text-xs font-black text-white uppercase tracking-widest">Panel Admin HSE</p>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Status Laporan</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Corrective Action */}
              <div>
                <label className="text-xs font-bold text-emerald-400 block mb-1.5">
                  <CheckSquare size={12} className="inline mr-1" />Tindakan Korektif
                </label>
                <textarea value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)}
                  rows={3} placeholder="Deskripsikan tindakan korektif yang harus dilakukan..."
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none resize-none placeholder-gray-500" />
                <input type="date" value={correctiveDeadline} onChange={e => setCorrectiveDeadline(e.target.value)}
                  className="w-full mt-2 bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none" />
              </div>

              {/* Admin Response */}
              <div>
                <label className="text-xs font-bold text-purple-400 block mb-1.5">Respons Admin</label>
                <textarea value={adminResponse} onChange={e => setAdminResponse(e.target.value)}
                  rows={2} placeholder="Catatan atau respons untuk pelapor..."
                  className="w-full bg-gray-800 text-white text-sm rounded-xl px-3 py-2.5 border border-gray-700 outline-none resize-none placeholder-gray-500" />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl disabled:opacity-60">
                  <Save size={15} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${
                    confirmDelete ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-600'
                  }`}>
                  <Trash2 size={15} />
                  {deleting ? '...' : confirmDelete ? 'Konfirmasi Hapus' : 'Hapus'}
                </button>
              </div>
              {confirmDelete && (
                <p className="text-xs text-red-400 text-center">Ketuk "Konfirmasi Hapus" lagi untuk menghapus permanen</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
