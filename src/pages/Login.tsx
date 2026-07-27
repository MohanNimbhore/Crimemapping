import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle, Info, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'login' | 'signup' | 'forgot';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup, resetPassword } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else if (tab === 'signup') {
        await signup(name, email, password);
        navigate('/dashboard');
      } else {
        await resetPassword(email);
        setInfo('Password reset link sent! Check your email.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    setInfo('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/8 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-slate-800/20 blur-3xl" />
        {/* grid */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div
        className={`relative w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">

          {/* Logo */}
          <div className="mb-7 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30 animate-pop-in">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 animate-pop-in" style={{ animationDelay: '200ms' }}>
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">CrimeMapper</h1>
            <p className="mt-1 text-sm text-slate-400">Crime Intelligence System</p>
          </div>

          {/* Tabs (only for login/signup) */}
          {tab !== 'forgot' && (
            <div className="mb-6 flex rounded-xl bg-slate-800/60 p-1">
              {(['login', 'signup'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all btn-press ${
                    tab === t
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-in-down">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 animate-fade-in-down">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <Field label="Full Name" icon={<User className="h-4 w-4" />}>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email Address" icon={<Mail className="h-4 w-4" />}>
              <input
                required
                type="email"
                placeholder="officer@police.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </Field>

            {tab !== 'forgot' && (
              <Field label="Password" icon={<Lock className="h-4 w-4" />}>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            )}

            {tab === 'login' && (
              <div className="text-right -mt-1">
                <button type="button" onClick={() => switchTab('forgot')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all btn-press hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/35 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {tab === 'forgot' ? 'Sending...' : tab === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                tab === 'forgot' ? 'Send Reset Link' : tab === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {tab === 'forgot' && (
            <button
              onClick={() => switchTab('login')}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </button>
          )}

          {/* Demo hint */}
          {tab === 'login' && (
            <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-800/40 p-3">
              <p className="text-center text-xs font-semibold text-slate-400 mb-1.5">Demo Credentials</p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> admin@crimemapper.com
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> admin123
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 pl-9 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all hover:border-slate-600';

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        {children}
      </div>
    </div>
  );
}
