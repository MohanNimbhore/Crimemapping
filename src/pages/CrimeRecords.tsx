import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, X, Filter, FileText, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime } from '../types';
import { CRIME_TYPES, SEVERITY_LEVELS, CITIES, AREA_NAMES } from '../types';
import { formatDate, formatTime, getSeverityColor, getStatusColor } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

const INPUT_CLS = 'w-full rounded-xl glass-deep border border-slate-700/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600 appearance-none';
const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-slate-400';

export default function CrimeRecords() {
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    crime_type: 'Theft', severity: 'medium' as 'low'|'medium'|'high'|'critical',
    crime_date: new Date().toISOString().split('T')[0], crime_time: '12:00',
    city: 'Ahmedabad', area_name: 'Maninagar', description: '',
    latitude: '23.0225', longitude: '72.5714',
  });

  const fetchCrimes = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.getCrimes({ limit: 500 }); setCrimes(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCrimes(); }, [fetchCrimes]);

  const filtered = crimes.filter((c) => {
    if (filterType !== 'all' && c.crime_type !== filterType) return false;
    if (filterCity !== 'all' && c.city !== filterCity) return false;
    if (search) { const q = search.toLowerCase(); return c.crime_type.toLowerCase().includes(q) || c.area_name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q); }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.createCrime({ crime_type: form.crime_type, severity: form.severity, crime_date: form.crime_date, crime_time: form.crime_time, city: form.city, area_name: form.area_name, description: form.description || null, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) });
      setShowModal(false); await fetchCrimes();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleting(true);
    try { await api.deleteCrime(deleteId); setCrimes((p) => p.filter((c) => c.id !== deleteId)); setDeleteId(null); }
    catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/15 glow-red border border-red-500/20">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Crime Records</h1>
            <p className="text-sm text-slate-400">Manage and track all recorded crime incidents</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 btn-press glow-blue transition-all"
        >
          <Plus className="h-4 w-4" /> Add Crime
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by type, area, city, or description..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl glass-deep border border-slate-700/50 pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          {[
            { val: filterType, set: setFilterType, opts: ['all', ...CRIME_TYPES], labels: { all: 'All Types' } },
            { val: filterCity, set: setFilterCity, opts: ['all', ...CITIES], labels: { all: 'All Cities' } },
          ].map(({ val, set, opts, labels }, i) => (
            <select key={i} value={val} onChange={(e) => set(e.target.value)}
              className="rounded-xl glass-deep border border-slate-700/50 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer">
              {opts.map((o) => <option key={o} value={o}>{(labels as Record<string,string>)[o] || o}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-deep rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-slate-800/60 mb-4"><FileText className="h-10 w-10 text-slate-600" /></div>
          <h3 className="text-lg font-semibold text-slate-300">No crime records found</h3>
          <p className="text-sm text-slate-500 mt-1">{crimes.length === 0 ? 'Add your first crime record.' : 'Try adjusting your filters.'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 glass-deep">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-800/60 text-left">
                  {['Type','Area','City','Date','Severity','Status',''].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((crime, i) => (
                  <tr key={crime.id} className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 20, 600)}ms` }}>
                    <td className="px-4 py-3 font-semibold text-white">{crime.crime_type}</td>
                    <td className="px-4 py-3 text-slate-300">{crime.area_name}</td>
                    <td className="px-4 py-3 text-slate-300">{crime.city}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{formatDate(crime.crime_date)}</div>
                      <div className="text-xs text-slate-500">{formatTime(crime.crime_time)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getSeverityColor(crime.severity)}`}>{crime.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getStatusColor(crime.status)}`}>{crime.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(crime.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700/50 p-1.5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all btn-press">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg glass-deep rounded-2xl border border-blue-500/20 p-6 animate-pop-in max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20"><Plus className="h-4 w-4 text-blue-400" /></div>
                <h2 className="text-lg font-bold text-white">Add Crime Record</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Crime Type', el: <select value={form.crime_type} onChange={(e) => setForm({ ...form, crime_type: e.target.value })} className={INPUT_CLS} required>{CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select> },
                  { label: 'Severity', el: <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as typeof form.severity })} className={INPUT_CLS} required>{SEVERITY_LEVELS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select> },
                  { label: 'Date', el: <input type="date" value={form.crime_date} onChange={(e) => setForm({ ...form, crime_date: e.target.value })} className={INPUT_CLS} required /> },
                  { label: 'Time', el: <input type="time" value={form.crime_time} onChange={(e) => setForm({ ...form, crime_time: e.target.value })} className={INPUT_CLS} required /> },
                  { label: 'City', el: <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={INPUT_CLS} required>{CITIES.map((c) => <option key={c} value={c}>{c}</option>)}</select> },
                  { label: 'Area', el: <select value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} className={INPUT_CLS} required>{AREA_NAMES.map((a) => <option key={a} value={a}>{a}</option>)}</select> },
                  { label: 'Latitude', el: <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={INPUT_CLS} required /> },
                  { label: 'Longitude', el: <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={INPUT_CLS} required /> },
                ].map(({ label, el }) => (
                  <div key={label}><label className={LABEL_CLS}>{label}</label>{el}</div>
                ))}
              </div>
              <div>
                <label className={LABEL_CLS}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className={INPUT_CLS + ' resize-none'} placeholder="Optional description..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl glass-deep border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all btn-press">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 btn-press">
                  {submitting ? <ButtonLoader /> : <Plus className="h-4 w-4" />} Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm glass-deep rounded-2xl border border-red-500/20 p-6 animate-pop-in shadow-2xl shadow-red-500/10 neon-pulse-red" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/15 border border-red-500/25 p-2.5"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <h3 className="text-lg font-bold text-white">Delete Crime Record?</h3>
            </div>
            <p className="text-sm text-slate-400 mb-5">This action cannot be undone. The record will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl glass-deep border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white btn-press">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 border border-red-500/30 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 btn-press">
                {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
