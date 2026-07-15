import { Filter, SlidersHorizontal, Search } from 'lucide-react';
import { CRIME_TYPES, CITIES } from '../../types';

interface Filters {
  type: string;
  severity: string;
  city: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
}

export default function MapFilters({ filters, onChange, onApply }: Props) {
  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden card-lift animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
      <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center gap-2">
        <div className="p-1 rounded-lg bg-blue-500/15">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Map Filters</h3>
      </div>

      <div className="p-4 space-y-3.5">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Crime Type</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <select
              value={filters.type}
              onChange={(e) => onChange({ ...filters, type: e.target.value })}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 appearance-none transition-all"
            >
              <option value="">All Crime Types</option>
              {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Severity</label>
          <select
            value={filters.severity}
            onChange={(e) => onChange({ ...filters, severity: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">City</label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            <option value="">All Districts</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button
          onClick={onApply}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 btn-press"
        >
          <Filter className="w-3.5 h-3.5" />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
