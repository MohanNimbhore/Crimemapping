import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  title,
  value,
  trend,
  trendUp,
  icon,
  sparkColor,
  sparkData,
  subtitle,
  delay,
}: SparklineCardProps) {
  const width = 120;
  const height = 36;
  const padding = 2;

  const points = sparkData.length > 1
    ? sparkData.map((d, i) => {
        const x = padding + (i / (sparkData.length - 1)) * (width - padding * 2);
        const max = Math.max(...sparkData.map((s) => s.v));
        const min = Math.min(...sparkData.map((s) => s.v));
        const range = max - min || 1;
        const y = height - padding - ((d.v - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      }).join(' ')
    : '';

  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${sparkColor}1a` }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              trendUp ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        </div>

        {points && (
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              points={points}
              fill="none"
              stroke={sparkColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
