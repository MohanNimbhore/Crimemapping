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

function sevBorder(s: string) {
  switch (s) {
    case 'critical': return 'border-red-500/40 bg-red-500/5';
    case 'high':     return 'border-orange-500/40 bg-orange-500/5';
    case 'medium':   return 'border-yellow-500/40 bg-yellow-500/5';
    default:         return 'border-slate-700/50 bg-slate-800/30';
  }
}

export default function Alerts() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try { setAlerts(await api.getAlerts({})); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkAsRead = async (id: string) => {
    setMarkingId(id);
    try {
      const updated = await api.markAlertAsRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } finally { setMarkingId(null); }
  };

  const totalAlerts = alerts.length;
  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const readCount = totalAlerts - unreadCount;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-red-500/15 glow-red border border-red-500/20">
          <BellRing className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alerts</h1>
          <p className="text-sm text-slate-400">Monitor and acknowledge crime alerts across zones</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Alerts', value: totalAlerts, icon: <Bell className="h-5 w-5" />, color: '#3b82f6', glow: 'glow-blue', border: 'border-blue-500/20' },
          { label: 'Unread',       value: unreadCount, icon: <BellRing className="h-5 w-5" />, color: '#ef4444', glow: 'glow-red', border: 'border-red-500/20' },
          { label: 'Read',         value: readCount,   icon: <BellOff className="h-5 w-5" />, color: '#22c55e', glow: 'glow-green', border: 'border-green-500/20' },
        ].map(({ label, value, icon, color, glow, border }, i) => (
          <div key={label} className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse-subtle" style={{ background: color }} />
            </div>
            <p className="text-3xl font-bold tabular-nums stat-3d" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="glass-deep rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-slate-800/60 mb-4">
            <Bell className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">No alerts found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">Alerts will appear here when high-risk crime patterns are detected.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const Icon = getAlertIcon(alert.alert_type);
            const unread = !alert.is_read;
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-all animate-fade-in-up ${
                  unread ? sevBorder(alert.severity) : 'border-slate-700/40 bg-slate-800/30 opacity-70 hover:opacity-90'
                }`}
                style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
              >
                {/* Icon */}
                <div className={`rounded-xl p-2.5 flex-shrink-0 ${unread ? 'bg-red-500/15 border border-red-500/20' : 'bg-slate-800/50 border border-slate-700/40'}`}>
                  <Icon className={`h-5 w-5 ${unread ? 'text-red-400' : 'text-slate-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{alert.alert_type}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-sm text-slate-300">{alert.area_name}</span>
                    {unread && (
                      <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 animate-pulse-subtle">NEW</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5 truncate">{alert.message}</p>
                  <p className="text-xs text-slate-600 mt-1">{formatDate(alert.created_at)}</p>
                </div>

                {/* Severity + action */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  {unread ? (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      disabled={markingId === alert.id}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-green-500/40 hover:text-green-400 transition-all btn-press disabled:opacity-50"
                    >
                      {markingId === alert.id ? <ButtonLoader /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark Read
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
