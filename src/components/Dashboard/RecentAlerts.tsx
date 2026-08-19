import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, ShieldAlert, Siren, Eye, ArrowRight } from 'lucide-react';
import type { Alert } from '../../types';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function alertIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('emergency')) return <Siren className="h-4 w-4 text-red-500 dark:text-red-400" />;
  if (t.includes('assault') || t.includes('high crime')) return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
  if (t.includes('theft') || t.includes('vehicle')) return <ShieldAlert className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
  return <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
}

function severityStyle(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-300 dark:border-red-500/30',
        dot: 'bg-red-500',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-500/30',
        dot: 'bg-orange-500',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-300 dark:border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'low':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-300 dark:border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-500/30',
        dot: 'bg-slate-500',
      };
  }
}

export default function RecentAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 card-lift shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/15">
            <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Alerts</h3>
          {alerts.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </div>
        <Link
          to="/alerts"
          className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400 flex-1">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
          {alerts.slice(0, 8).map((alert) => {
            const sc = severityStyle(alert.severity);
            return (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-default"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${sc.bg} border ${sc.border}`}>
                  {alertIcon(alert.alert_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate leading-snug">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {alert.area_name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text} ${sc.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {timeAgo(alert.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
