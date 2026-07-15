import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'red' | 'orange' | 'green' | 'purple';
  delay?: number;
}

const colorMap = {
  blue: { bg: 'from-blue-500/15 to-blue-600/5', border: 'border-blue-500/25', icon: 'bg-blue-500/15 text-blue-400', glow: 'rgba(59,130,246,0.08)' },
  red: { bg: 'from-red-500/15 to-red-600/5', border: 'border-red-500/25', icon: 'bg-red-500/15 text-red-400', glow: 'rgba(239,68,68,0.08)' },
  orange: { bg: 'from-orange-500/15 to-orange-600/5', border: 'border-orange-500/25', icon: 'bg-orange-500/15 text-orange-400', glow: 'rgba(249,115,22,0.08)' },
  green: { bg: 'from-green-500/15 to-green-600/5', border: 'border-green-500/25', icon: 'bg-green-500/15 text-green-400', glow: 'rgba(34,197,94,0.08)' },
  purple: { bg: 'from-purple-500/15 to-purple-600/5', border: 'border-purple-500/25', icon: 'bg-purple-500/15 text-purple-400', glow: 'rgba(168,85,247,0.08)' },
};

export default function StatCard({ title, value, subtitle, icon, trend, color, delay = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={`relative bg-gradient-to-br ${c.bg} ${c.border} border rounded-2xl p-5 overflow-hidden card-lift animate-fade-in-up group`}
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${c.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1.5 mt-2`}>
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {trend.isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {Math.abs(trend.value)}%
              </div>
              <span className="text-[11px] text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${c.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
