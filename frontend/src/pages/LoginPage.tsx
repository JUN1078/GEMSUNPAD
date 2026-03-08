import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, HardHat } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email dan password wajib diisi');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.user, data.token);
      toast.success(`Selamat datang, ${data.user.name}!`);
      navigate('/app');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-primary-600 flex flex-col relative overflow-hidden">
      <div className="blob w-72 h-72 bg-primary-400 opacity-25 -top-20 -right-20 absolute" />
      <div className="blob w-56 h-56 bg-primary-800 opacity-20 top-1/3 -left-16 absolute" />

      {/* Header */}
      <div className="relative z-10 pt-12 pb-8 px-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-white shadow-xl overflow-hidden mb-4">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-black text-white">GEMS Unpad</h1>
        <p className="text-primary-100 text-sm font-semibold">HSE Geologi Unpad</p>
        <p className="text-primary-200 text-xs mt-0.5">Badan Khusus FTG Unpad</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl relative z-10 px-6 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-6">
          <HardHat className="text-primary-600" size={22} />
          <h2 className="text-xl font-bold text-gray-800">Masuk</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-gray-50" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1.5">Password</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-gray-50 pr-12" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-green-200 mt-2">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary-600 font-bold hover:underline">Daftar sekarang</Link>
        </p>

        <div className="mt-5 p-3 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xs text-primary-700 font-medium text-center">
            🎓 GEMS Unpad · Geology HSE Management System – Universitas Padjadjaran
          </p>
        </div>
      </div>
    </div>
  );
}
