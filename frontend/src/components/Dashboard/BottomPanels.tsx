import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Target, Brain, ArrowRight } from 'lucide-react';
import type { CrimeTrend } from '../../types';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f97316', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4'];

interface HotspotEntry {
  area: string;
  count: number;
  risk: string;
}

interface PredictionEntry {
  area: string;
  score: number;
}

interface Props {
  trends: CrimeTrend[];
  typeDistribution: { name: string; value: number }[];
  topHotspots: HotspotEntry[];
  predictions: PredictionEntry[];
}

const riskBadge = (risk: string) => {
  if (risk === 'high') return 'bg-red-500/15 text-red-400 border-red-500/25';
  if (risk === 'medium') return 'bg-orange-500/15 text-orange-400 border-orange-500/25';
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
};

const riskBar = (score: number) => {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f97316';
  return '#22c55e';
};

export default function BottomPanels({ trends, typeDistribution, topHotspots, predictions }: Props) {
  const navigate = useNavigate();

  const trendData = trends.slice(-8).map((t) => ({
    date: t.date.substring(0, 7),
    total: t.total,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '300ms', opacity: 0 }}>
      {/* Crime Trend */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group">
        <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-violet-500/15">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Crime Trend</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-700/30 px-2 py-0.5 rounded-full">Last 8 months</span>
        </div>
        <div className="p-4 h-52">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-500 text-xs">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Crime by Category */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group">
        <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/15">
            <PieIcon className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Crime by Category</h3>
        </div>
        <div className="p-4">
          {typeDistribution.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeDistribution.slice(0, 7)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {typeDistribution.slice(0, 7).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {typeDistribution.slice(0, 6).map((item, i) => {
                  const total = typeDistribution.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2 group/item hover:bg-slate-700/20 rounded-lg px-1.5 py-0.5 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-400 flex-1 truncate">{item.name}</span>
                      <span className="text-xs font-semibold text-white">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center">
              <p className="text-slate-500 text-xs">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Hotspots */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group">
        <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-orange-500/15">
              <Target className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Top Hotspots</h3>
          </div>
          <button onClick={() => navigate('/hotspots')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors group/btn">
            View All
            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {topHotspots.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Run Hotspot Detection to see results</p>
          ) : (
            topHotspots.slice(0, 5).map((h, i) => (
              <div key={h.area} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-700/20 transition-colors cursor-pointer group/item">
                <span className="text-xs font-bold text-slate-500 w-5 h-5 flex items-center justify-center rounded-full bg-slate-700/30 group-hover/item:bg-slate-600/40 transition-colors">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">{h.area}</p>
                  <p className="text-xs text-slate-500">{h.count} crimes</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${riskBadge(h.risk)}`}>
                  {h.risk}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Predicted Risk */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group">
        <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-purple-500/15">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Predicted Risk</h3>
          </div>
          <button onClick={() => navigate('/predictions')} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors group/btn">
            View All
            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {predictions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Run AI Predictions to see results</p>
          ) : (
            predictions.slice(0, 5).map((p) => (
              <div key={p.area} className="group/item">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-300 truncate flex-1 font-medium">{p.area}</span>
                  <span className="text-xs font-bold ml-2 tabular-nums" style={{ color: riskBar(p.score) }}>{p.score}%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out group-hover/item:brightness-110"
                    style={{ width: `${p.score}%`, backgroundColor: riskBar(p.score) }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
