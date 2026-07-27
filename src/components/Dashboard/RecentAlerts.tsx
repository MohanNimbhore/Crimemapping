import { useRef, useEffect } from 'react';
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
  if (t.includes('emergency')) return <Siren className="h-4 w-4 text-red-400" />;
  if (t.includes('assault') || t.includes('high crime')) return <AlertTriangle className="h-4 w-4 text-orange-400" />;
  if (t.includes('theft') || t.includes('vehicle')) return <ShieldAlert className="h-4 w-4 text-yellow-400" />;
  return <Eye className="h-4 w-4 text-blue-400" />;
}

function severityColor(severity: string) {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/25',    dot: 'bg-red-500' };
    case 'high':     return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25', dot: 'bg-orange-500' };
    case 'medium':   return { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/25', dot: 'bg-yellow-400' };
    case 'low':      return { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/25',  dot: 'bg-green-500' };
    default:         return { bg: 'bg-slate-500/15',  text: 'text-slate-400',  border: 'border-slate-500/25',  dot: 'bg-slate-500' };
  }
}

export default function RecentAlerts({ alerts }: { alerts: Alert[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="reveal rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/15 animate-pulse-subtle">
            <Bell className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
          {alerts.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pop-in">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </div>
        <Link to="/alerts" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <div className="w-12 h-12 rounded-full bg-slate-700/40 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 opacity-40" />
          </div>
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        <div className="stagger-children space-y-2">
          {alerts.slice(0, 7).map((alert) => {
            const sc = severityColor(alert.severity);
            return (
              <div
                key={alert.id}
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:border-slate-600/60 hover:bg-slate-700/30 transition-all cursor-default ${sc.border} bg-slate-900/40`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sc.bg}`}>
                  {alertIcon(alert.alert_type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white capitalize truncate leading-snug">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{alert.area_name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${sc.bg} ${sc.text} ${sc.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">{timeAgo(alert.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
