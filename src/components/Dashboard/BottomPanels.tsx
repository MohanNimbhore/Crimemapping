import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, MapPin, BrainCircuit, ArrowRight } from 'lucide-react';
import type { CrimeTrend } from '../../types';

interface BottomPanelsProps {
  trends: CrimeTrend[];
  typeDistribution: { name: string; value: number }[];
  topHotspots: { area: string; count: number; risk: string }[];
  predictions: { area: string; score: number }[];
}

const PIE_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#eab308', '#8b5cf6', '#22c55e', '#06b6d4', '#ec4899'];

function riskBadgeClass(risk: string): string {
  switch (risk) {
    case 'high':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'low':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export default function BottomPanels({ trends, typeDistribution, topHotspots, predictions }: BottomPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {/* Panel 1: Crime Trend */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Crime Trend</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                stroke="#475569"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel 2: Crime by Category */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Crime by Category</h3>
        </div>
        <div className="h-48">
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={30}
                  paddingAngle={2}
                >
                  {typeDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
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
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No data
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {typeDistribution.slice(0, 5).map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {item.name}
            </div>
          ))}
        </div>
      </div>

      {/* Panel 3: Top Hotspots */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-white">Top Hotspots</h3>
          </div>
          <Link to="/hotspots" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {topHotspots.length > 0 ? (
            topHotspots.map((h, i) => (
              <div key={h.area} className="flex items-center gap-3 rounded-lg bg-slate-900/40 px-3 py-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-700 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{h.area}</p>
                  <p className="text-xs text-slate-400">{h.count} crimes</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${riskBadgeClass(h.risk)}`}>
                  {h.risk}
                </span>
              </div>
            ))
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-slate-500">
              No hotspots
            </div>
          )}
        </div>
      </div>

      {/* Panel 4: Predicted Risk */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Predicted Risk</h3>
          </div>
          <Link to="/predictions" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {predictions.length > 0 ? (
            predictions.slice(0, 5).map((p) => (
              <div key={p.area}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300 truncate">{p.area}</span>
                  <span className="text-xs font-medium text-slate-400">{p.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${Math.min(p.score, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-slate-500">
              No predictions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
