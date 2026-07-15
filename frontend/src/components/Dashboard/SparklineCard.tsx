import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SparklineCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  sparkColor: string;
  sparkData: { v: number }[];
  subtitle?: string;
  delay?: number;
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
  delay = 0,
}: SparklineCardProps) {
  const gradientId = `spark-${title.replace(/\s/g, '')}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <div
      className="relative bg-slate-800/70 border rounded-2xl overflow-hidden card-lift animate-fade-in-up group"
      style={{
        borderColor: `${sparkColor}25`,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      {/* Animated top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <div
          className="h-full w-full origin-left"
          style={{
            background: `linear-gradient(90deg, ${sparkColor}00, ${sparkColor}, ${sparkColor}00)`,
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${sparkColor}08, transparent 70%)`,
        }}
      />

      <div className="relative px-5 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-bold text-white mt-2 tabular-nums tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <div
            className="p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundColor: `${sparkColor}15` }}
          >
            <div style={{ color: sparkColor }}>{icon}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              trendUp
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {trendUp ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend}
          </div>
          <span className="text-[11px] text-slate-500">vs last month</span>
        </div>
      </div>

      <div className="h-14 -mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                <stop offset="60%" stopColor={sparkColor} stopOpacity={0.1} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
