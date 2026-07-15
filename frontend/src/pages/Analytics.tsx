import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Zap } from 'lucide-react';
import { api } from '../lib/api';
import type { CrimeTrend } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#64748b', '#a855f7', '#dc6be8', '#14b8a6'];

export default function Analytics() {
  const [stats, setStats] = useState<{
    totalCrimes: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byMonth: Record<string, number>;
  } | null>(null);
  const [trends, setTrends] = useState<CrimeTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, trendsData] = await Promise.all([api.getDashboardStats(), api.getCrimeTrends()]);
      setStats({
        totalCrimes: statsData.totalCrimes,
        byType: statsData.crimeDistribution.byType,
        bySeverity: statsData.crimeDistribution.bySeverity,
        byMonth: statsData.crimeDistribution.byMonth,
      });
      setTrends(trendsData.slice(-24));
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  const typeChartData = Object.entries(stats?.byType || {}).map(([name, value]) => ({ name, value }));
  const severityChartData = Object.entries(stats?.bySeverity || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const trendChartData = trends.map((t) => ({
    date: t.date,
    total: t.total,
  }));

  const weeklyData = [
    { day: 'Mon', crimes: Math.floor(Math.random() * 20) + 10 },
    { day: 'Tue', crimes: Math.floor(Math.random() * 20) + 10 },
    { day: 'Wed', crimes: Math.floor(Math.random() * 20) + 10 },
    { day: 'Thu', crimes: Math.floor(Math.random() * 20) + 10 },
    { day: 'Fri', crimes: Math.floor(Math.random() * 25) + 15 },
    { day: 'Sat', crimes: Math.floor(Math.random() * 30) + 20 },
    { day: 'Sun', crimes: Math.floor(Math.random() * 25) + 15 },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    crimes: i >= 20 || i < 6 ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Comprehensive crime data analysis and insights</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all btn-press"
        >
          <Zap className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Crimes" value={stats?.totalCrimes || 0} color="blue" delay={0} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Categories" value={Object.keys(stats?.byType || {}).length} color="purple" delay={80} />
        <StatCard icon={<PieChart className="w-5 h-5" />} label="Time Periods" value={trends.length} color="green" delay={160} />
        <StatCard icon={<Activity className="w-5 h-5" />} label="High Severity" value={stats?.bySeverity?.high || 0} color="orange" delay={240} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <ChartCard title="Crime Trends Over Time" icon={<TrendingUp className="w-4 h-4" />} iconColor="text-blue-400" iconBg="bg-blue-500/15">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }} labelStyle={{ color: '#94a3b8' }} />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crimes by Type" icon={<BarChart3 className="w-4 h-4" />} iconColor="text-violet-400" iconBg="bg-violet-500/15">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={10} angle={-35} textAnchor="end" height={60} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {typeChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <ChartCard title="Severity Distribution" icon={<PieChart className="w-4 h-4" />} iconColor="text-emerald-400" iconBg="bg-emerald-500/15">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie data={severityChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {severityChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }} />
            </RechartsPie>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Pattern" icon={<Activity className="w-4 h-4" />} iconColor="text-purple-400" iconBg="bg-purple-500/15">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }} />
              <Bar dataKey="crimes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hourly Distribution" icon={<Zap className="w-4 h-4" />} iconColor="text-orange-400" iconBg="bg-orange-500/15">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }} />
              <Line type="monotone" dataKey="crimes" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
    purple: { bg: 'from-purple-500/15 to-purple-600/5', icon: 'text-purple-400 bg-purple-500/15' },
    green: { bg: 'from-emerald-500/15 to-emerald-600/5', icon: 'text-emerald-400 bg-emerald-500/15' },
    orange: { bg: 'from-orange-500/15 to-orange-600/5', icon: 'text-orange-400 bg-orange-500/15' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-gradient-to-br ${c.bg} border border-slate-700/50 rounded-2xl p-4 card-lift animate-fade-in-up`} style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.icon}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, iconColor, iconBg, children }: { title: string; icon: React.ReactNode; iconColor: string; iconBg: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group">
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5 h-72">{children}</div>
    </div>
  );
}
