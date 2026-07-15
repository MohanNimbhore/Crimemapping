import { SlidersHorizontal, Filter } from 'lucide-react';
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

export default function MapFilters({ filters, onChange, onApply }: MapFiltersProps) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4 card-lift">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-white">Filters</h3>
      </div>

      <div className="space-y-3">
        {/* Crime Type */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Crime Type</label>
          <select
            value={filters.type}
            onChange={(e) => onChange({ ...filters, type: e.target.value })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {CRIME_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Severity</label>
          <select
            value={filters.severity}
            onChange={(e) => onChange({ ...filters, severity: e.target.value })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="all">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
