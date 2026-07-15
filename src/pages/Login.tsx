import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
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
        setInfo('Password reset email sent. Check your inbox.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30 mb-4">
            <Shield className="h-9 w-9 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">CrimeWatch</h1>
          <p className="text-sm text-slate-400 mt-1">Crime Mapping & Analytics Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="flex gap-1 p-1 mb-6 rounded-xl bg-slate-800/80">
              <button
                onClick={() => { setTab('login'); setError(''); setInfo(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => { setTab('signup'); setError(''); setInfo(''); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <h2 className="text-xl font-semibold text-white mb-1">
            {tab === 'login' && 'Welcome back'}
            {tab === 'signup' && 'Create your account'}
            {tab === 'forgot' && 'Reset password'}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {tab === 'login' && 'Sign in to access your dashboard'}
            {tab === 'signup' && 'Join the crime mapping platform'}
            {tab === 'forgot' && 'Enter your email to receive reset instructions'}
          </p>

          {error && (
            <div className="flex items-start gap-2 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2 mb-4 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2.5 text-sm text-green-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg bg-slate-800/80 border border-slate-700 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg bg-slate-800/80 border border-slate-700 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {tab !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-slate-800/80 border border-slate-700 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(''); setInfo(''); }}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </button>
          </form>

          {tab === 'forgot' && (
            <button
              onClick={() => { setTab('login'); setError(''); setInfo(''); }}
              className="mt-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          )}

          {tab === 'login' && (
            <div className="mt-6 rounded-lg bg-slate-800/50 border border-slate-700/50 px-3 py-2.5 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Demo:</span> use any email and password (min 6 chars) to sign in, or sign up to create an account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
