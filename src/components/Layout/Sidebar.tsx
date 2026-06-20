import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Map,
  Target,
  Brain,
  Route,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  Shield,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crimes', icon: FileText, label: 'Crimes' },
  { to: '/map', icon: Map, label: 'Crime Map' },
  { to: '/hotspots', icon: Target, label: 'Hotspots' },
  { to: '/predictions', icon: Brain, label: 'AI Predictions' },
  { to: '/routes', icon: Route, label: 'Patrol Routes' },
  { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const quickActions = [
  { label: 'New Crime', icon: Plus, path: '/crimes?action=new' },
  { label: 'Hotspot AI', icon: Target, path: '/hotspots' },
  { label: 'Predictions', icon: Brain, path: '/predictions' },
  { label: 'Optimize Route', icon: Route, path: '/routes' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 flex flex-col lg:hidden sidebar-transition ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <SidebarContent
          collapsed={false}
          location={location}
          navigate={navigate}
          user={user}
          logout={logout}
          isAdmin={isAdmin}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 flex-col sidebar-transition overflow-hidden ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          location={location}
          navigate={navigate}
          user={user}
          logout={logout}
          isAdmin={isAdmin}
          toggleSidebar={toggleSidebar}
          onNavClick={() => {}}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
  user: { name?: string; role?: string } | null;
  logout: () => Promise<void>;
  isAdmin: boolean;
  toggleSidebar?: () => void;
  onNavClick: () => void;
}

function SidebarContent({
  collapsed,
  location,
  navigate,
  user,
  logout,
  isAdmin,
  toggleSidebar,
  onNavClick,
}: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div
        className={`flex items-center gap-3 py-4 border-b border-slate-200 dark:border-slate-700/50 ${
          collapsed ? 'px-2 justify-center' : 'px-4'
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex-shrink-0 animate-pop-in">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
              CrimeMapper
            </h1>
            <p className="text-[11px] text-slate-500 whitespace-nowrap">Intelligence System</p>
          </div>
        )}
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className={`ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all btn-press ${
              collapsed ? 'hidden' : 'block'
            }`}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toggle button for collapsed state */}
      {collapsed && toggleSidebar && (
        <div className="flex justify-center py-2">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all btn-press tooltip"
            data-tooltip="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <ul className="space-y-0.5">
          {navItems.map((item, idx) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <li key={item.to} style={{ animationDelay: `${idx * 40}ms` }} className="animate-fade-in-up">
                <NavLink
                  to={item.to}
                  onClick={onNavClick}
                  className={`group flex items-center rounded-xl transition-all duration-200 btn-press ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium shadow-sm shadow-blue-500/10'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`w-[20px] h-[20px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : ''
                    }`}
                  />
                  {!collapsed && (
                    <span className="text-sm whitespace-nowrap animate-fade-in">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-400 animate-slide-in-right" />
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity duration-150">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/40 animate-fade-in">
            <h3 className="px-3.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Quick Actions
            </h3>
            <div className="space-y-0.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    navigate(action.path);
                    onNavClick();
                  }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-all duration-200 text-sm btn-press"
                >
                  <action.icon className="w-[18px] h-[18px] transition-transform duration-200 hover:scale-110" />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        {!collapsed && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/40 animate-fade-in">
            <h3 className="px-3.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              System Status
            </h3>
            <div className="space-y-1.5 px-3.5">
              {[
                { label: 'Database', status: 'Online', pulse: true },
                { label: 'AI Engine', status: 'Ready', pulse: true },
                { label: 'Maps API', status: 'Connected', pulse: false },
              ].map(({ label, status, pulse }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {pulse && (
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
                    )}
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{label}</span>
                  <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div
        className={`py-3 border-t border-slate-200 dark:border-slate-700/50 ${
          collapsed ? 'px-2 flex flex-col items-center gap-2' : 'px-3'
        }`}
      >
        <div
          className={`flex items-center gap-3 rounded-xl transition-all duration-200 ${
            collapsed ? 'px-1 py-2 flex-col' : 'px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0 animate-pop-in">
            <span className="text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 capitalize">{user?.role || 'officer'}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          className={`flex items-center gap-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 text-sm btn-press ${
            collapsed ? 'justify-center px-2 py-2.5 w-full' : 'px-3.5 py-2.5 w-full'
          }`}
          title="Logout"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}
