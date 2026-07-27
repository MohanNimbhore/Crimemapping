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
  }
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Panel({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal reveal-scale rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function BottomPanels({ trends, typeDistribution, topHotspots, predictions }: BottomPanelsProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll<HTMLElement>('.progress-bar').forEach((bar) => bar.classList.add('animate'));
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [predictions]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">

      {/* Panel 1: Crime Trend */}
      <Panel delay={0}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-violet-500/15">
            <TrendingUp className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Crime Trend</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} stroke="transparent" tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="transparent" tickLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#trendGrad)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Panel 2: Crime by Category */}
      <Panel delay={80}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <PieIcon className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Crime by Category</h3>
        </div>
        <div className="h-36">
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} innerRadius={32} paddingAngle={3} strokeWidth={0}>
                  {typeDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No data</div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5">
          {typeDistribution.slice(0, 6).map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Panel 3: Top Hotspots */}
      <Panel delay={160}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15">
              <MapPin className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Top Hotspots</h3>
          </div>
          <Link to="/hotspots" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {topHotspots.length > 0 ? (
          <div className="space-y-2">
            {topHotspots.map((h, i) => (
              <div
                key={h.area}
                className="flex items-center gap-3 rounded-xl bg-slate-900/50 px-3 py-2 hover:bg-slate-700/40 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${i < 1 ? '#ef4444' : i < 3 ? '#f97316' : '#3b82f6'}, ${i < 1 ? '#dc2626' : i < 3 ? '#ea580c' : '#2563eb'})` }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{h.area}</p>
                  <p className="text-xs text-slate-500">{h.count} crimes</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskBadgeClass(h.risk)}`}>
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
      <div
        ref={progressRef}
        className="reveal reveal-scale rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift"
        style={{ transitionDelay: '240ms' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/15">
              <BrainCircuit className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Predicted Risk</h3>
          </div>
          <Link to="/predictions" className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {predictions.length > 0 ? (
          <div className="space-y-3.5">
            {predictions.slice(0, 5).map((p) => {
              const color = p.score >= 80 ? '#ef4444' : p.score >= 60 ? '#f97316' : '#8b5cf6';
              return (
                <div key={p.area}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-300 truncate max-w-[70%]">{p.area}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>{p.score}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/60">
                    <div
                      className="progress-bar h-full rounded-full"
                      style={{
                        '--target-width': `${Math.min(p.score, 100)}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-slate-500">No predictions</div>
        )}
      </div>

    </div>
  );
}
