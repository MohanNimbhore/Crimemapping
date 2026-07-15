import { Sun, Moon, Palette, User as UserIcon, Mail, ShieldCheck, Info, MapPin } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your preferences and account information</p>
      </div>

      {/* Theme Toggle */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Currently using {isDark ? 'dark' : 'light'} mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 btn-press"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-4 w-4 text-green-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">User Profile</h3>
        </div>
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-3 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                    user.role === 'admin'
                      ? 'border-purple-500/50 bg-purple-950/50 text-purple-400'
                      : 'border-green-500/50 bg-green-950/50 text-green-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No user information available.</p>
        )}
      </div>

      {/* About */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">About</h3>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Crime Hotspot Mapping System</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              A comprehensive crime mapping and predictive analytics platform for law enforcement agencies.
              Features include interactive crime mapping, K-Means hotspot detection, AI-powered risk predictions,
              patrol route optimization, real-time alerts, and detailed analytics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Version</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Region</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Gujarat, India
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tech Stack</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">React + TypeScript + Supabase</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Maps</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">Leaflet + OpenStreetMap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
