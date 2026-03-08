import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import logo from '../assets/logo.png';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { token } = useStore();

  useEffect(() => {
    const t = setTimeout(() => navigate(token ? '/app' : '/login'), 2500);
    return () => clearTimeout(t);
  }, [token, navigate]);

  return (
    <div className="min-h-dvh bg-primary-600 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Blobs */}
      <div className="blob w-64 h-64 bg-primary-400 opacity-30 -top-16 -right-16 absolute" />
      <div className="blob w-48 h-48 bg-primary-800 opacity-20 -bottom-12 -left-12 absolute" />
      <div className="blob w-32 h-32 bg-yellow-300 opacity-20 top-1/4 -left-8 absolute" />
      <div className="blob w-40 h-40 bg-primary-300 opacity-15 bottom-1/4 -right-8 absolute" />

      <div className="relative z-10 flex flex-col items-center gap-6 bounce-in">
        {/* Logo */}
        <div className="w-28 h-28 rounded-3xl bg-white shadow-2xl flex items-center justify-center overflow-hidden">
          <img src={logo} alt="HSE Geologi Unpad" className="w-full h-full object-cover" />
        </div>

        <div className="text-center text-white">
          <h1 className="text-3xl font-black tracking-tight">GEMS Unpad</h1>
          <p className="text-primary-100 font-semibold text-base mt-1">HSE Geologi Unpad</p>
          <p className="text-primary-200 text-sm mt-0.5">Badan Khusus FTG Unpad</p>
          <p className="text-primary-200/70 text-xs mt-2 px-6 text-center leading-relaxed italic">"Safety is not everything, but without safety everything is nothing"</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-white rounded-full opacity-80"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 text-primary-200 text-xs font-medium z-10 text-center">
        <p>Geology HSE Management System</p>
        <p className="text-primary-300 text-[10px] mt-0.5">Universitas Padjadjaran</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
