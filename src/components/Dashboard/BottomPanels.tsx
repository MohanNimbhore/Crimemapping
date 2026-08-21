import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, MapPin, BrainCircuit, ArrowRight } from 'lucide-react';
import type { CrimeTrend } from '../../types';

interface BottomPanelsProps {
  trends: CrimeTrend[];
  typeDistribution: { name: string; value: number }[];
  topHotspots: { area: string; count: number; risk: string }[];
  predictions: { area: string; score: number }[];
}

const PIE_COLORS = ['#3b82f6','#f97316','#ef4444','#eab308','#8b5cf6','#22c55e','#06b6d4','#ec4899'];

function riskBadgeClass(risk: string) {
  switch (risk) {
    case 'high':   return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'low':    return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:       return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'high':   return 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30';
    case 'medium': return 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30';
    case 'low':    return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    default:       return 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30';
  }
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
};

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 card-lift shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function BottomPanels({ trends, typeDistribution, topHotspots, predictions }: BottomPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">

      {/* Panel 1: Crime Trend */}
      <Panel>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-violet-500/15">
            <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Crime Trend</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="crimeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#94a3b833' }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#94a3b833' }} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#crimeTrendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Panel 2: Distribution by Type */}
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <PieIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Distribution</h3>
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeDistribution.slice(0, 6)}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
              >
                {typeDistribution.slice(0, 6).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {typeDistribution.slice(0, 4).map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index] }} />
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Panel 3: Top Hotspots */}
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15">
              <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Hotspots</h3>
          </div>
          <Link to="/hotspots" className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {topHotspots.length > 0 ? (
          <div className="space-y-2">
            {topHotspots.map((h, i) => (
              <div
                key={h.area}
                className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${i < 1 ? '#ef4444' : i < 3 ? '#f97316' : '#3b82f6'}, ${i < 1 ? '#dc2626' : i < 3 ? '#ea580c' : '#2563eb'})` }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{h.area}</p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{h.count} crimes</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${riskBadgeClass(h.risk)}`}>
                  {h.risk}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-slate-500">No hotspots</div>
        )}
      </Panel>

      {/* Panel 4: Predicted Risk */}
      <Panel>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15">
              <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Predicted Risk</h3>
          </div>
          <Link to="/predictions" className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {predictions.length > 0 ? (
          <div className="space-y-3">
            {predictions.slice(0, 5).map((p) => {
              const color = p.score >= 80 ? '#ef4444' : p.score >= 60 ? '#f97316' : '#8b5cf6';
              return (
                <div key={p.area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[70%]">{p.area}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>{p.score}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(p.score, 100)}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-slate-500">No predictions</div>
        )}
      </Panel>

    </div>
  );
}
