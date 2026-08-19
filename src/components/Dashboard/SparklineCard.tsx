import { useRef, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useScrollReveal, useCountUp } from '../../lib/hooks';

interface SparklineCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: ReactNode;
  sparkColor: string;
  sparkData: { v: number }[];
  subtitle: string;
  delay: number;
}

export default function SparklineCard({
  title, value, trend, trendUp, icon, sparkColor, sparkData, subtitle, delay,
}: SparklineCardProps) {
  const cardRef = useScrollReveal<HTMLDivElement>();
  const [visible, setVisible] = useState(false);
  const svgRef = useRef<SVGPolylineElement>(null);

  // trigger count-up + spark draw once card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const numericValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
  const displayValue = useCountUp(numericValue, 1000, visible);

  const W = 128, H = 40, P = 3;
  const max = Math.max(...sparkData.map((d) => d.v));
  const min = Math.min(...sparkData.map((d) => d.v));
  const range = max - min || 1;

  const pts = sparkData.length > 1
    ? sparkData.map((d, i) => {
        const x = P + (i / (sparkData.length - 1)) * (W - P * 2);
        const y = H - P - ((d.v - min) / range) * (H - P * 2);
        return `${x},${y}`;
      }).join(' ')
    : '';

  // area fill path (close at bottom)
  const areaPath = sparkData.length > 1
    ? `M ${sparkData.map((d, i) => {
        const x = P + (i / (sparkData.length - 1)) * (W - P * 2);
        const y = H - P - ((d.v - min) / range) * (H - P * 2);
        return `${x},${y}`;
      }).join(' L ')} L ${W - P},${H - P} L ${P},${H - P} Z`
    : '';

  const gradientId = `spark-grad-${title.replace(/\s/g, '')}`;

  return (
    <div
      ref={cardRef}
      className="reveal reveal-scale stat-card rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/70 p-4 card-lift overflow-hidden relative"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* subtle top glow strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${sparkColor}, transparent)` }}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="stat-icon flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
            style={{ backgroundColor: `${sparkColor}22`, boxShadow: `0 4px 14px ${sparkColor}22` }}
          >
            <span style={{ color: sparkColor }}>{icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {typeof value === 'number' ? displayValue.toLocaleString() : value}
          </p>
          <div className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            <span>{trend}</span>
            <span className="text-slate-500 font-normal ml-0.5">vs last month</span>
          </div>
        </div>

        {pts && (
          <svg width={W} height={H} className="overflow-visible shrink-0">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={sparkColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* area fill */}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            {/* line */}
            <polyline
              ref={svgRef}
              className="spark-line"
              points={pts}
              fill="none"
              stroke={sparkColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={visible ? { strokeDashoffset: 0, strokeDasharray: 1000 } : { strokeDasharray: 1000, strokeDashoffset: 1000 }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
