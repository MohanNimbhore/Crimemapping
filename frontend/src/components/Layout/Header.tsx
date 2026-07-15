import React from 'react';
import { Bell, Search, Menu, Sun, Moon, Activity, Calendar, PanelLeftOpen, PanelLeftClose, Command } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  alertCount?: number;
}

export default function Header({ alertCount = 0 }: HeaderProps) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { collapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchFocused, setSearchFocused] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/crimes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-700/40 animate-fade-in">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <MobileMenuButton />

          {/* Sidebar toggle (desktop) */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all btn-press"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <form onSubmit={handleSearch} className="relative group">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                searchFocused ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <input
              type="text"
              placeholder="Search crimes, areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-56 lg:w-80 pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                searchFocused
                  ? 'bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-500/60 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
              } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/40">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse-subtle">
            <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">System Active</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all btn-press overflow-hidden"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-[18px] h-[18px]">
              <Sun
                className={`absolute inset-0 w-[18px] h-[18px] transition-all duration-300 ${
                  isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
                }`}
              />
              <Moon
                className={`absolute inset-0 w-[18px] h-[18px] transition-all duration-300 ${
                  isDark ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`}
              />
            </div>
          </button>

          {/* Alerts */}
          <button
            onClick={() => navigate('/alerts')}
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all btn-press"
          >
            <Bell className="w-[18px] h-[18px]" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-pop-in">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 pl-2 lg:pl-3 border-l border-slate-200 dark:border-slate-700/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pop-in ring-2 ring-white dark:ring-slate-800">
              <span className="text-xs font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden xl:block animate-fade-in">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 capitalize">{user?.role || 'officer'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenuButton() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all btn-press"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
