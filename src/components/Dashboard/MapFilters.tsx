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

const selectClass = 'w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 shadow-sm';

export default function MapFilters({ filters, onChange, onApply }: MapFiltersProps) {
  const hasFilters = Boolean(filters.type || filters.severity || filters.city);
  const reset = () => onChange({ type: '', severity: '', city: '' });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 card-lift shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h3>
        </div>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors btn-press"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Crime Type
          </label>
          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => onChange({ ...filters, type: e.target.value })}
              className={selectClass}
            >
              <option value="" className="text-slate-500">All Crime Types</option>
              {CRIME_TYPES.map((t) => (
                <option key={t} value={t} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Severity Level
          </label>
          <div className="relative">
            <select
              value={filters.severity}
              onChange={(e) => onChange({ ...filters, severity: e.target.value })}
              className={selectClass}
            >
              <option value="" className="text-slate-500">All Severities</option>
              {SEVERITY_LEVELS.map((s) => (
                <option key={s} value={s} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            City / Region
          </label>
          <div className="relative">
            <select
              value={filters.city}
              onChange={(e) => onChange({ ...filters, city: e.target.value })}
              className={selectClass}
            >
              <option value="" className="text-slate-500">All Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 btn-press transition-all mt-1"
        >
          <Filter className="h-4 w-4 text-white" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
