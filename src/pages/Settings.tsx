import { useState } from 'react';
import { User, Shield, Bell, Palette, Database, Save, Loader2, Moon, Sun, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushAlerts: true,
    weeklyReport: false,
    criticalOnly: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-60 flex-shrink-0">
          <nav className="space-y-1 bg-slate-800/70 border border-slate-700/50 rounded-2xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all duration-200 btn-press ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:bg-slate-700/30 hover:text-white'
                }`}
              >
                <tab.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 card-lift animate-fade-in">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/15">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Profile Settings</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
                <div>
                  <button className="px-4 py-2.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/25 transition-all btn-press">
                    Change Photo
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/15">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Security Settings</h2>
              </div>
              <div className="space-y-4">
                {['Current Password', 'New Password', 'Confirm New Password'].map((label) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <h3 className="font-medium text-white mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-slate-400 mb-4">Add an extra layer of security to your account.</p>
                <button className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-all btn-press">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500/15">
                  <Bell className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Notification Preferences</h2>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'emailAlerts', label: 'Email Alerts', desc: 'Receive crime alerts via email' },
                  { id: 'pushAlerts', label: 'Push Notifications', desc: 'Browser push notifications for urgent alerts' },
                  { id: 'weeklyReport', label: 'Weekly Report', desc: 'Receive weekly crime analysis report' },
                  { id: 'criticalOnly', label: 'Critical Only', desc: 'Only notify for critical severity alerts' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 transition-all hover:border-slate-600/60">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.id as keyof typeof notifications]}
                        onChange={(e) => setNotifications({ ...notifications, [item.id]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-violet-500/15">
                  <Palette className="w-4 h-4 text-violet-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Appearance Settings</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', icon: Moon, active: theme === 'dark' },
                    { id: 'light', label: 'Light', icon: Sun, active: theme === 'light' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if ((t.id === 'dark' && theme !== 'dark') || (t.id === 'light' && theme !== 'light')) {
                          toggleTheme();
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all btn-press ${
                        t.active
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/10'
                          : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Accent Color</label>
                <div className="flex items-center gap-3">
                  {[
                    { color: 'bg-blue-500', ring: 'ring-blue-400' },
                    { color: 'bg-purple-500', ring: 'ring-purple-400' },
                    { color: 'bg-emerald-500', ring: 'ring-emerald-400' },
                    { color: 'bg-orange-500', ring: 'ring-orange-400' },
                    { color: 'bg-red-500', ring: 'ring-red-400' },
                  ].map((c, i) => (
                    <button
                      key={c.color}
                      className={`w-9 h-9 rounded-full ${c.color} ${i === 0 ? `ring-2 ${c.ring} ring-offset-2 ring-offset-slate-800` : ''} transition-transform hover:scale-110 btn-press`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-500/15">
                  <Database className="w-4 h-4 text-slate-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Data & Privacy</h2>
              </div>
              <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 flex-shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">Export Your Data</h3>
                    <p className="text-sm text-slate-400 mb-4">Download a copy of all your data in JSON format.</p>
                    <button className="px-4 py-2.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/25 transition-all btn-press">
                      Export Data
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-red-500/8 border border-red-500/25">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-red-500/15 text-red-400 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-400 mb-1">Delete Account</h3>
                    <p className="text-sm text-slate-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button className="px-4 py-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/25 transition-all btn-press">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 mt-6 border-t border-slate-700/50">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all btn-press shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
