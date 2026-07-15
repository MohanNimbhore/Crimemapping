import React, { useState } from 'react';
import { Shield, Eye, EyeOff, UserPlus, LogIn, AlertCircle, Fingerprint, Mail, Lock, User, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'login' | 'signup';

export default function Login() {
  const [tab, setTab] = useState<Tab>('login');
  const [showForgot, setShowForgot] = useState(false);
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Floating orbs */}
      <div className="absolute top-[15%] left-[20%] w-72 h-72 bg-blue-500/8 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-indigo-500/6 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-slate-500/5 rounded-full blur-[80px] pointer-events-none animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pop-in">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg animate-pop-in" style={{ animationDelay: '200ms' }}>
              <Fingerprint className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>CrimeMapper</h1>
          <p className="text-slate-400 text-sm mt-1.5 animate-fade-in" style={{ animationDelay: '200ms' }}>Intelligence & Patrol Routing System</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-700/40 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden animate-scale-in" style={{ animationDelay: '150ms' }}>
          {/* Tab switcher */}
          <div className="flex border-b border-slate-700/50 p-1.5 gap-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl transition-all duration-300 btn-press ${
                tab === 'login'
                  ? 'text-white bg-blue-500/20 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl transition-all duration-300 btn-press ${
                tab === 'signup'
                  ? 'text-white bg-blue-500/20 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          <div className="p-8">
            {showForgot ? (
              <ForgotPasswordForm
                onReset={resetPassword}
                onBack={() => setShowForgot(false)}
              />
            ) : tab === 'login' ? (
              <LoginForm onLogin={login} onSuccess={() => navigate('/dashboard')} onForgot={() => setShowForgot(true)} />
            ) : (
              <SignupForm onSignup={signup} onSuccess={() => navigate('/dashboard')} />
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Crime Hotspot Mapping &amp; Predictive Patrol Routing
        </p>
      </div>
    </div>
  );
}

function LoginForm({
  onLogin,
  onSuccess,
  onForgot,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onSuccess: () => void;
  onForgot: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg.includes('Invalid login') || msg.includes('Invalid credentials')
        ? 'Invalid email or password. Please check your credentials.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div>
        <p className="text-white font-bold text-xl mb-0.5">Welcome back</p>
        <p className="text-slate-400 text-sm">Sign in to access the command center</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-500/30 rounded-xl text-red-400 text-sm animate-pop-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 btn-press"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onForgot}
          className="text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium inline-flex items-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Forgot password?
        </button>
      </div>

      <div className="mt-4 p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl">
        <p className="text-xs text-slate-400 text-center font-medium mb-1.5">No account yet?</p>
        <p className="text-xs text-slate-500 text-center">
          Click <span className="text-blue-400 font-medium">Sign Up</span> above to create an account.
        </p>
      </div>
    </form>
  );
}

function SignupForm({
  onSignup,
  onSuccess,
}: {
  onSignup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'officer' | 'admin'>('officer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await onSignup(name, email, password, role);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg.includes('already registered')
        ? 'This email is already registered. Please sign in instead.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div>
        <p className="text-white font-bold text-xl mb-0.5">Create account</p>
        <p className="text-slate-400 text-sm">Register to access the system</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-500/30 rounded-xl text-red-400 text-sm animate-pop-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
        <div className="relative group">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="John Smith"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
        <div className="grid grid-cols-2 gap-3">
          {(['officer', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-3 rounded-xl border text-sm font-medium capitalize transition-all duration-200 btn-press ${
                role === r
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-950/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              {r === 'admin' ? 'Admin' : 'Officer'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="At least 6 characters"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all"
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 btn-press"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

function ForgotPasswordForm({
  onReset,
  onBack,
}: {
  onReset: (email: string) => Promise<void>;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Check Your Email</h3>
        <p className="text-sm text-slate-400 mb-6">
          We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>.
          Click the link in the email to reset your password.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-all btn-press"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-blue-500/15">
          <KeyRound className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Reset Password</h2>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm animate-pop-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              placeholder="officer@police.gov.in"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all btn-press shadow-lg shadow-blue-500/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
