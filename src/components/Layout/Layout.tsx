import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApi } from '../../lib/hooks';
import { api } from '../../lib/api';
import { useSidebar } from '../../contexts/SidebarContext';

export default function Layout() {
  const { data: alerts } = useApi(() => api.getAlerts({ unreadOnly: true }), []);
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const alertCount = alerts?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={`content-transition ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Header alertCount={alertCount} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
