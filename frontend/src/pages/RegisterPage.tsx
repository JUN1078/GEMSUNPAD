import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, Globe, BookOpen, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';

// Generate Roman numerals I through L (50 angkatan — covers ~2050+)
function toRoman(n: number): string {
  const vals = [50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const syms = ['L', 'XL', 'XXX', 'XX', 'X', 'IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'];
  let result = '';
  let num = n;
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

const ANGKATAN = Array.from({ length: 50 }, (_, i) => toRoman(i + 1)); // I … L

function getDeptNum(angkatan: string): number {
  const idx = ANGKATAN.indexOf(angkatan);
  return idx >= 0 ? idx + 1 + 6 : 7; // index is 0-based, angkatan I = index 0 → num 1+6=7
}

function getHsePreview(angkatan: string, memberNum: string): string {
  const dept = getDeptNum(angkatan);
  const n = parseInt(memberNum) || 0;
  return `HSE.${angkatan}-${dept}.${String(n).padStart(3, '0')}`;
}

type RegType = 'umum' | 'candidate' | 'member';

const REG_TYPES: { type: RegType; icon: React.ElementType; label: string; sublabel: string; color: string; ring: string }[] = [
  {
    type: 'umum', icon: Globe, label: 'Umum',
    sublabel: 'Lapor & lihat bahaya',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    ring: 'ring-blue-400 bg-blue-50 border-blue-400',
  },
  {
    type: 'candidate', icon: BookOpen, label: 'Calon Anggota',
    sublabel: 'APELTRI & materi K3',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    ring: 'ring-orange-400 bg-orange-50 border-orange-400',
  },
  {
    type: 'member', icon: Shield, label: 'Anggota HSE',
    sublabel: 'Akses penuh + Nomor HSE',
    color: 'bg-green-50 border-green-200 text-green-700',
    ring: 'ring-primary-500 bg-primary-50 border-primary-400',
  },
];

export default function RegisterPage() {
  const [regType, setRegType] = useState<RegType>('candidate');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    angkatan: 'I', memberNumber: '',
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Nama, email, dan password wajib diisi');
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter');
    if (regType === 'member') {
      if (!form.angkatan) return toast.error('Pilih angkatan HSE');
      if (!form.memberNumber || isNaN(parseInt(form.memberNumber))) return toast.error('Masukkan nomor anggota yang valid');
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        name: form.name, email: form.email, password: form.password, reg_type: regType,
      };
      if (regType === 'member') {
        payload.angkatan = form.angkatan;
        payload.member_number = String(parseInt(form.memberNumber));
      }
      const { data } = await api.post('/auth/register', payload);
      setAuth(data.user, data.token);
      toast.success('Registrasi berhasil! Selamat datang 🎉');
      navigate('/app');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const activeReg = REG_TYPES.find(r => r.type === regType)!;

  return (
    <div className="min-h-dvh bg-primary-600 flex flex-col relative overflow-hidden">
      <div className="blob w-64 h-64 bg-primary-400 opacity-25 -top-16 -right-16 absolute" />
      <div className="blob w-48 h-48 bg-unpad-gold opacity-15 top-1/4 -left-12 absolute" />

      {/* Header */}
      <div className="relative z-10 pt-10 pb-6 px-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white shadow-lg overflow-hidden">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white">GEMS Unpad</h1>
          <p className="text-primary-200 text-xs">Badan Khusus Teknik Geologi Unpad</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl relative z-10 px-5 pt-6 pb-8 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Daftar Akun</h2>
        <p className="text-xs text-gray-400 mb-5">Pilih tipe akun sesuai statusmu</p>

        {/* Account type selector */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {REG_TYPES.map(rt => {
            const Icon = rt.icon;
            const active = regType === rt.type;
            return (
              <button
                key={rt.type}
                type="button"
                onClick={() => setRegType(rt.type)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center
                  ${active ? `${rt.ring} ring-2` : 'border-gray-200 bg-gray-50 text-gray-500'}`}
              >
                <Icon size={20} className={active ? 'text-current' : 'text-gray-400'} />
                <span className="text-xs font-bold leading-tight">{rt.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{rt.sublabel}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Nama */}
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1.5">Nama Lengkap</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Nama lengkap kamu"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 transition-all" />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 transition-all" />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1.5">Password</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={form.password} onChange={set('password')}
                placeholder="Min. 6 karakter"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-gray-50 pr-12" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Anggota HSE extra fields */}
          {regType === 'member' && (
            <div className="space-y-3 bg-primary-50 rounded-2xl p-4 border border-primary-100">
              <p className="text-xs font-bold text-primary-700 uppercase tracking-wide">Nomor Anggota HSE</p>

              {/* Angkatan */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Angkatan HSE</label>
                <select value={form.angkatan} onChange={set('angkatan')}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 outline-none text-sm bg-white">
                  {ANGKATAN.map(a => (
                    <option key={a} value={a}>Angkatan {a}</option>
                  ))}
                </select>
              </div>

              {/* Member number */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nomor Anggota</label>
                <input
                  type="number"
                  value={form.memberNumber}
                  onChange={set('memberNumber')}
                  placeholder="Contoh: 99"
                  min="1" max="999"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white transition-all"
                />
              </div>

              {/* HSE Number Preview */}
              {form.memberNumber && (
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-primary-200">
                  <Info size={15} className="text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-primary-600 font-semibold">Nomor HSE kamu:</p>
                    <p className="text-sm font-black text-primary-700 tracking-wide">
                      {getHsePreview(form.angkatan, form.memberNumber)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info for umum/candidate */}
          {regType !== 'member' && (
            <div className={`flex items-start gap-2 rounded-xl px-4 py-3 border ${activeReg.color}`}>
              <Info size={15} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                {regType === 'umum'
                  ? 'Akun Umum dapat melaporkan bahaya dan melihat peta hazard. Fitur lanjutan tersedia untuk Anggota HSE.'
                  : 'Akun Calon Anggota mendapatkan akses APELTRI (misi & badge), materi K3, dan pelaporan bahaya. Upgrade ke Anggota HSE dilakukan oleh Admin.'}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-green-200 mt-2">
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
