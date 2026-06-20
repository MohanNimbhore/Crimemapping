import { useEffect, useState } from 'react';
import { Bell, CheckCircle, Trash2, AlertTriangle, Shield, SlidersHorizontal, RefreshCw, Inbox, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Alert } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { getSeverityColor } from '../lib/utils';

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(filter === 'unread' ? { unreadOnly: true } : undefined);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markAlertAsRead(id);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setProcessing(true);
    try {
      await api.markAllAlertsAsRead();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setProcessing(false);
    }
  };

  const deleteAlert = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert?')) {
      await api.deleteAlert(id);
      fetchAlerts();
    }
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to clear all alerts?')) {
      setProcessing(true);
      try {
        await api.clearAlerts();
        fetchAlerts();
      } catch (error) {
        console.error('Failed to clear alerts:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert Center</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Emergency alerts and high-risk area notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as typeof filter); fetchAlerts(); }}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread Only</option>
          </select>
          <button
            onClick={markAllAsRead}
            disabled={processing || unreadCount === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/25 disabled:opacity-40 transition-all btn-press text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            disabled={processing || alerts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/25 disabled:opacity-40 transition-all btn-press text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<Bell className="w-5 h-5" />} label="Total Alerts" value={alerts.length} color="blue" delay={0} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Unread" value={unreadCount} color="orange" delay={80} />
        <StatCard icon={<Shield className="w-5 h-5" />} label="Critical" value={criticalCount} color="red" delay={160} />
        <StatCard icon={<RefreshCw className="w-5 h-5" />} label="Today" value={new Date().toLocaleDateString()} color="green" delay={240} />
      </div>

      {/* Alerts List */}
      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        {alerts.length === 0 ? (
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-12 text-center card-lift">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-semibold text-lg">No active alerts</p>
            <p className="text-sm text-slate-400 mt-1">All alerts have been acknowledged or resolved.</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={alert.id}
              className={`bg-slate-800/70 border rounded-2xl overflow-hidden transition-all duration-300 card-lift group ${
                alert.is_read ? 'border-slate-700/50 opacity-70' : 'border-blue-500/30 ring-1 ring-blue-500/10'
              } animate-fade-in`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start gap-4 p-4">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  alert.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
                  alert.severity === 'high' ? 'bg-orange-500/15 text-orange-400' :
                  alert.severity === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className={`font-medium text-sm ${alert.is_read ? 'text-slate-300' : 'text-white'}`}>
                      {alert.alert_type}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    {!alert.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" />
                      {alert.area_name}
                    </span>
                    {alert.risk_score && <span className="font-medium text-slate-400">Risk: {alert.risk_score}%</span>}
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="p-2.5 rounded-xl hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-400 transition-all btn-press"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2.5 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all btn-press"
                    title="Delete alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
    orange: { bg: 'from-orange-500/15 to-orange-600/5', icon: 'text-orange-400 bg-orange-500/15' },
    red: { bg: 'from-red-500/15 to-red-600/5', icon: 'text-red-400 bg-red-500/15' },
    green: { bg: 'from-emerald-500/15 to-emerald-600/5', icon: 'text-emerald-400 bg-emerald-500/15' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-gradient-to-br ${c.bg} border border-slate-700/50 rounded-2xl p-4 card-lift animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.icon}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
