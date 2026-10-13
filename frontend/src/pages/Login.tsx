import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const user = await login(demoEmail, demoPass);
      if (user?.role === 'EMPLOYEE') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user?.role === 'EMPLOYEE') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img src={logoImg || "/logo.png"} alt="Improx Logo" className="h-10 w-auto max-w-[180px] object-contain mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Workplace Sign-In</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter your credentials or use 1-click demo access below
          </p>
        </div>

        {/* 1-Click Portfolio Demo Section */}
        <div className="mb-5 p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black tracking-wider uppercase text-sky-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Live Portfolio Sandbox
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-full border border-sky-200">
              Instant Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@demo.com', 'demo123')}
              disabled={loading}
              className="py-2.5 px-3 bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.rivers@demo.com', 'demo123')}
              disabled={loading}
              className="py-2.5 px-3 bg-white hover:bg-sky-50 text-slate-800 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Employee Portal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Roles Info */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Employees: Employee Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admins: Console View</span>
          </div>
        </div>
      </div>
    </div>
  );
};