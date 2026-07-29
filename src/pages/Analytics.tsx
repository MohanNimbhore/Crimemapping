import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, Calendar, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import type { DashboardStats, CrimeTrend } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6'];

const TOOLTIP_STYLE = {
  backgroundColor: '#020617',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<CrimeTrend[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([api.getDashboardStats(), api.getCrimeTrends()]);
      setStats(s);
      setTrends(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader />;

  const typeData = stats
    ? Object.entries(stats.crimeDistribution.byType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];
  const severityData = stats
    ? Object.entries(stats.crimeDistribution.bySeverity).map(([name, value]) => ({ name, value: value as number }))
    : [];
  const monthlyData = stats
    ? Object.entries(stats.crimeDistribution.byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value: value as number }))
    : [];
  const trendData = trends.map((t) => ({ date: t.date, total: t.total }));

  const statCards = [
    { label: 'Total Crimes',    value: stats?.totalCrimes ?? 0,    icon: <Activity className="h-5 w-5" />,   color: '#3b82f6', glow: 'glow-blue',   border: 'border-blue-500/20' },
    { label: 'Total Hotspots',  value: stats?.totalHotspots ?? 0,  icon: <TrendingUp className="h-5 w-5" />, color: '#f97316', glow: 'glow-orange', border: 'border-orange-500/20' },
    { label: 'Active Alerts',   value: stats?.activeAlerts ?? 0,   icon: <Activity className="h-5 w-5" />,   color: '#ef4444', glow: 'glow-red',    border: 'border-red-500/20' },
    { label: 'High Risk Areas', value: stats?.highRiskAreas ?? 0,  icon: <TrendingUp className="h-5 w-5" />, color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/15 glow-blue border border-blue-500/20">
          <BarChart3 className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-400">Crime statistics, trends, and distribution analysis</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon, color, glow, border }, i) => (
          <div
            key={label}
            className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-5 animate-fade-in-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }} className="opacity-80">{icon}</span>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse-subtle" style={{ background: color }} />
            </div>
            <p className="text-3xl font-bold tabular-nums stat-3d" style={{ color }}>{value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bar – by type */}
        <div className="glass-deep rounded-2xl border border-slate-700/50 p-5 card-3d animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Crimes by Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={typeData} margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie – by severity */}
        <div className="glass-deep rounded-2xl border border-slate-700/50 p-5 card-3d animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/20">
              <PieIcon className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Crimes by Severity</h3>
          </div>
          {severityData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-500">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#475569' }}>
                  {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Area – trends */}
        <div className="glass-deep rounded-2xl border border-slate-700/50 p-5 card-3d animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg bg-green-500/15 border border-green-500/20">
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Crime Trends Over Time</h3>
          </div>
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-500">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5}
                  fill="url(#trendG)" name="Crimes" dot={false}
                  style={{ filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar – monthly */}
        <div className="glass-deep rounded-2xl border border-slate-700/50 p-5 card-3d animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Monthly Distribution</h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-500">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} name="Crimes"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.4))' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
