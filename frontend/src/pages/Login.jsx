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
      setError(result.message || 'Login gagal.');
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background blobs for premium look */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-3.5 rounded-2xl text-white shadow-xl shadow-indigo-500/20 mb-3">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Rayyan POS System</h2>
          <p className="text-slate-400 text-sm mt-1.5">Masuk untuk mengelola transaksi & dashboard</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3.5 rounded-lg text-center font-medium animate-headShake">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="Masukkan username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-11 pr-11 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={localLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {localLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Memvalidasi...</span>
                </>
              ) : (
                <span>Masuk Sistem</span>
              )}
            </button>
          </form>

          {/* Quick Demo Login Fillers */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center mb-3.5">
              Akun Demo (Klik untuk Autofill)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => autofillUser('admin')}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800/60 rounded-lg py-2 px-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all text-center flex flex-col items-center"
              >
                <span>Admin POS</span>
                <span className="text-[10px] text-slate-500 mt-0.5">admin / adminpassword</span>
              </button>
              <button
                type="button"
                onClick={() => autofillUser('cashier')}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800/60 rounded-lg py-2 px-3 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all text-center flex flex-col items-center"
              >
                <span>Kasir POS</span>
                <span className="text-[10px] text-slate-500 mt-0.5">kasir / kasirpassword</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
