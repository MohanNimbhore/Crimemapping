import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, ShieldAlert, Siren, Eye } from 'lucide-react';
import type { Alert } from '../../types';

interface RecentAlertsProps {
  alerts: Alert[];
}

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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function alertIcon(type: string) {
  switch (type) {
    case 'high_crime_area':
      return <AlertTriangle className="h-4 w-4 text-red-400" />;
    case 'hotspot_warning':
      return <ShieldAlert className="h-4 w-4 text-orange-400" />;
    case 'emergency':
      return <Siren className="h-4 w-4 text-red-500" />;
    default:
      return <Eye className="h-4 w-4 text-blue-400" />;
  }
}

function severityBadgeClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
        </div>
        <Link
          to="/alerts"
          className="text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          View All
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Bell className="h-8 w-8 mb-2" />
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 6).map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-3 rounded-lg bg-slate-900/40 border border-slate-700/40 px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                {alertIcon(alert.alert_type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white capitalize truncate">
                  {alert.alert_type.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-slate-400 truncate">{alert.area_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${severityBadgeClass(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span className="text-xs text-slate-500">
                  {timeAgo(alert.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
