import { useRef, useEffect } from 'react';
import { SlidersHorizontal, Filter, X } from 'lucide-react';
import { CRIME_TYPES, SEVERITY_LEVELS, CITIES } from '../../types';

interface Filters {
  type: string;
  severity: string;
  city: string;
}

interface MapFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
}

const selectClass = 'w-full rounded-xl bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all appearance-none cursor-pointer hover:border-slate-600';

export default function MapFilters({ filters, onChange, onApply }: MapFiltersProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hasFilters = filters.type || filters.severity || filters.city;

  const reset = () => onChange({ type: '', severity: '', city: '' });

  return (
    <div
      ref={ref}
      className="reveal reveal-right rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/70 p-4 card-lift"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <SlidersHorizontal className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Filters</h3>
        </div>
        {hasFilters && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors btn-press">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="stagger-children space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Crime Type</label>
          <select value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })} className={selectClass}>
            <option value="">All Types</option>
            {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Severity</label>
          <select value={filters.severity} onChange={(e) => onChange({ ...filters, severity: e.target.value })} className={selectClass}>
            <option value="">All Severities</option>
            {SEVERITY_LEVELS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">City</label>
          <select value={filters.city} onChange={(e) => onChange({ ...filters, city: e.target.value })} className={selectClass}>
            <option value="">All Cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 btn-press hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400 transition-all"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
