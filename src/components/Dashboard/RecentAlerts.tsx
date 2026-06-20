import React from 'react';
import { AlertTriangle, Car, Eye, Zap, Package, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Alert } from '../../types';

const alertIcons: Record<string, React.ReactNode> = {
  'High Crime Alert': <AlertTriangle className="w-4 h-4" />,
  'Theft Alert': <Package className="w-4 h-4" />,
  'Assault Alert': <Zap className="w-4 h-4" />,
  'Emergency Alert': <AlertTriangle className="w-4 h-4" />,
  'Vehicle Theft Alert': <Car className="w-4 h-4" />,
  'Drug Activity Alert': <Eye className="w-4 h-4" />,
};

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

interface Props {
  alerts: Alert[];
}

export default function RecentAlerts({ alerts }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden h-full card-lift animate-fade-in-up" style={{ animationDelay: '250ms', opacity: 0 }}>
      <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-red-500/15">
            <Bell className="w-3.5 h-3.5 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
        </div>
        <button onClick={() => navigate('/alerts')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors group/btn">
          View All
          <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs font-medium">No active alerts</p>
            <p className="text-[11px] text-slate-600 mt-0.5">All clear for now</p>
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const style = severityStyles[alert.severity] || severityStyles.medium;
            const icon = alertIcons[alert.alert_type] || <AlertTriangle className="w-4 h-4" />;

            return (
              <div
                key={alert.id}
                className="px-4 py-3 hover:bg-slate-700/20 transition-all duration-200 cursor-pointer group/item animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${style.bg} ${style.text} mt-0.5 transition-transform duration-200 group-hover/item:scale-110`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{alert.alert_type}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border} flex-shrink-0 uppercase tracking-wide`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{alert.area_name}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{timeAgo(alert.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
