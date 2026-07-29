import { Sun, Moon, Palette, User as UserIcon, Mail, ShieldCheck, Info, MapPin, Cpu, GitBranch } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-700/60 border border-slate-600/40" style={{ boxShadow: '0 0 16px rgba(148,163,184,0.1)' }}>
          <Palette className="h-5 w-5 text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-sm text-slate-400">Manage your preferences and account information</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-deep rounded-2xl border border-slate-700/50 card-3d p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
            <Palette className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Theme</p>
            <p className="text-xs text-slate-400 mt-0.5">Currently using <span className={isDark ? 'text-blue-400' : 'text-amber-400'}>{isDark ? 'dark' : 'light'}</span> mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl glass-deep border border-slate-700/50 px-4 py-2 text-sm font-semibold text-white hover:border-blue-500/40 hover:text-blue-300 btn-press transition-all"
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4 text-amber-400" />
              : <Moon className="h-4 w-4 text-blue-400" />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="glass-deep rounded-2xl border border-slate-700/50 card-3d p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-green-500/15 border border-green-500/20">
            <UserIcon className="h-4 w-4 text-green-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">User Profile</h3>
        </div>
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-500/30" style={{ boxShadow: '0 0 24px rgba(59,130,246,0.3)' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse-subtle" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
                <span className={`inline-flex items-center gap-1.5 mt-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${user.role === 'admin' ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' : 'border-green-500/40 bg-green-500/10 text-green-400'}`}>
                  {user.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                  {user.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4 border-t border-slate-700/50">
              {[
                { icon: <Mail className="h-4 w-4 text-blue-400" />,  label: 'Email',  value: user.email },
                { icon: <ShieldCheck className="h-4 w-4 text-purple-400" />, label: 'Role',  value: user.role },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-slate-700/40 px-3 py-2.5">
                  {icon}
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-white capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No user information available.</p>
        )}
      </div>

      {/* About */}
      <div className="glass-deep rounded-2xl border border-slate-700/50 card-3d p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
            <Info className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">About</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-base font-bold text-white">Crime Hotspot Mapping System</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              A comprehensive crime mapping and predictive analytics platform for law enforcement agencies.
              Features interactive crime mapping, K-Means hotspot detection, AI-powered risk predictions,
              patrol route optimization, real-time alerts, and detailed analytics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50">
            {[
              { icon: <GitBranch className="h-4 w-4 text-blue-400" />,  label: 'Version',   value: '1.0.0' },
              { icon: <MapPin className="h-4 w-4 text-green-400" />,    label: 'Region',    value: 'Gujarat, India' },
              { icon: <Cpu className="h-4 w-4 text-purple-400" />,      label: 'Tech Stack', value: 'React · TypeScript · Supabase' },
              { icon: <MapPin className="h-4 w-4 text-orange-400" />,   label: 'Maps',      value: 'Leaflet · OpenStreetMap' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 px-3 py-2.5">
                <span className="mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
