import { useEffect, useState, useCallback } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Shield, Car, Siren, Globe, BellRing } from 'lucide-react';
import { api } from '../lib/api';
import type { Alert } from '../types';
import { formatDate, getSeverityColor } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

const ALERT_ICONS: Record<string, typeof Bell> = {
  'High Crime Alert': AlertTriangle,
  'Theft Alert': Shield,
  'Assault Alert': Siren,
  'Emergency Alert': BellRing,
  'Vehicle Theft Alert': Car,
  'Drug Activity Alert': Globe,
};

function getAlertIcon(type: string): typeof Bell {
  return ALERT_ICONS[type] || Bell;
}

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts({});
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      const updated = await api.markAlertAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const totalAlerts = alerts.length;
  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const readCount = totalAlerts - unreadCount;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alerts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and acknowledge crime alerts across zones</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Alerts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalAlerts}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Unread</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-950/30 p-2.5">
              <BellRing className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Read</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{readCount}</p>
            </div>
            <div className="rounded-lg bg-green-100 dark:bg-green-950/30 p-2.5">
              <BellOff className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No alerts found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Alerts will appear here when high-risk crime patterns are detected.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const Icon = getAlertIcon(alert.alert_type);
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-4 rounded-xl border p-4 animate-fade-in-up ${
                  alert.is_read
                    ? 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'
                    : 'border-orange-300 dark:border-orange-700/50 bg-orange-50 dark:bg-orange-950/20'
                }`}
                style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
              >
                {/* Icon */}
                <div className={`rounded-lg p-2.5 flex-shrink-0 ${
                  alert.is_read
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'bg-orange-100 dark:bg-orange-950/40'
                }`}>
                  <Icon className={`h-5 w-5 ${alert.is_read ? 'text-slate-400' : 'text-orange-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{alert.alert_type}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">·</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{alert.area_name}</span>
                    {!alert.is_read && (
                      <span className="rounded-full bg-orange-500 text-white text-xs px-1.5 py-0.5">NEW</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{alert.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(alert.created_at)}</p>
                </div>

                {/* Severity + Action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  {!alert.is_read ? (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      disabled={markingId === alert.id}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                      {markingId === alert.id ? <ButtonLoader /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark as Read
                    </button>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
