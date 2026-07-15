import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, Calendar } from 'lucide-react';
import { api } from '../lib/api';
import type { DashboardStats, CrimeTrend } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7', '#14b8a6'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<CrimeTrend[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        api.getDashboardStats(),
        api.getCrimeTrends(),
      ]);
      setStats(s);
      setTrends(t);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <PageLoader />;

  // Prepare chart data
  const typeData = stats
    ? Object.entries(stats.crimeDistribution.byType)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const severityData = stats
    ? Object.entries(stats.crimeDistribution.bySeverity)
        .map(([name, value]) => ({ name, value: value as number }))
    : [];

  const monthlyData = stats
    ? Object.entries(stats.crimeDistribution.byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => ({ name, value: value as number }))
    : [];

  const trendData = trends.map((t) => ({ date: t.date, total: t.total }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Crime statistics, trends, and distribution analysis</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Crimes</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalCrimes ?? 0}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hotspots</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalHotspots ?? 0}</p>
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-950/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Alerts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats?.activeAlerts ?? 0}</p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-950/30 p-2.5">
              <Activity className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">High Risk Areas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{stats?.highRiskAreas ?? 0}</p>
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Crimes by Type - Horizontal Bar */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Crimes by Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData} layout="horizontal" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Crimes by Severity - Pie */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Crimes by Severity</h3>
          </div>
          {severityData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {severityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Crime Trends Over Time - Area */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Crime Trends Over Time</h3>
          </div>
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                  name="Crimes"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Distribution - Bar */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Monthly Distribution</h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} name="Crimes" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
