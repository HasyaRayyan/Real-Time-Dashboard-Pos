import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, Loader2, Store } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const { login, token, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/cashier');
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password harus diisi.');
      return;
    }

    setError('');
    setLocalLoading(true);

    const result = await login(username, password);
    setLocalLoading(false);

    if (!result.success) {
      setError(result.message || 'Login gagal. Periksa kembali akun Anda.');
    }
  };

  const autofillUser = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('adminpassword');
    } else {
      setUsername('kasir');
      setPassword('kasirpassword');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background blobs for premium light mode */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-100/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-3.5 rounded-2xl text-white shadow-xl shadow-emerald-600/25 mb-4">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Rayyan POS</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Sistem Penjualan & Dasbor Real-Time</p>
        </div>

        {/* Clean Light Mode Card */}
        <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl text-center font-semibold animate-headShake">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm font-medium"
                  placeholder="Masukkan username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm font-medium"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={localLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-550 active:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-75"
            >
              {localLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Mengautentikasi...</span>
                </>
              ) : (
                <span>Masuk Sistem</span>
              )}
            </button>
          </form>

          {/* Quick Demo Login Fillers */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
              Akun Uji Coba (Demo)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => autofillUser('admin')}
                className="bg-slate-55 hover:bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-all text-center flex flex-col items-center"
              >
                <span>Role: Admin</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">admin / adminpassword</span>
              </button>
              <button
                type="button"
                onClick={() => autofillUser('cashier')}
                className="bg-slate-55 hover:bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-teal-700 hover:text-teal-800 transition-all text-center flex flex-col items-center"
              >
                <span>Role: Kasir</span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">kasir / kasirpassword</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
