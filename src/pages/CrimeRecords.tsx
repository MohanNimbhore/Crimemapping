import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, X, Filter, FileText } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime } from '../types';
import { CRIME_TYPES, SEVERITY_LEVELS, CITIES, AREA_NAMES } from '../types';
import { formatDate, formatTime, getSeverityColor, getStatusColor } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

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
    crime_type: 'Theft',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    crime_date: new Date().toISOString().split('T')[0],
    crime_time: '12:00',
    city: 'Ahmedabad',
    area_name: 'Maninagar',
    description: '',
    latitude: '23.0225',
    longitude: '72.5714',
  });

  const fetchCrimes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getCrimes({ limit: 500 });
      setCrimes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrimes();
  }, [fetchCrimes]);

  const filteredCrimes = crimes.filter((c) => {
    if (filterType !== 'all' && c.crime_type !== filterType) return false;
    if (filterCity !== 'all' && c.city !== filterCity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.crime_type.toLowerCase().includes(q) ||
        c.area_name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCrime({
        crime_type: form.crime_type,
        severity: form.severity,
        crime_date: form.crime_date,
        crime_time: form.crime_time,
        city: form.city,
        area_name: form.area_name,
        description: form.description || null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setShowModal(false);
      await fetchCrimes();
    } catch (err) {
      console.error('Failed to create crime:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteCrime(deleteId);
      setCrimes((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete crime:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crime Records</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and track all recorded crime incidents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 btn-press"
        >
          <Plus className="h-4 w-4" />
          Add Crime
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by type, area, city, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            {CRIME_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredCrimes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No crime records found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {crimes.length === 0 ? 'Add your first crime record to get started.' : 'Try adjusting your filters or search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Area</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">City</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Severity</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {filteredCrimes.map((crime, i) => (
                  <tr
                    key={crime.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{crime.crime_type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{crime.area_name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{crime.city}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{formatDate(crime.crime_date)}</div>
                      <div className="text-xs text-slate-400">{formatTime(crime.crime_time)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(crime.severity)}`}>
                        {crime.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(crime.status)}`}>
                        {crime.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(crime.id)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                        title="Delete"
                      >
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

      {/* Add Crime Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 animate-pop-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Crime Record</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Crime Type</label>
                  <select
                    value={form.crime_type}
                    onChange={(e) => setForm({ ...form, crime_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {CRIME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {SEVERITY_LEVELS.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    value={form.crime_date}
                    onChange={(e) => setForm({ ...form, crime_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Time</label>
                  <input
                    type="time"
                    value={form.crime_time}
                    onChange={(e) => setForm({ ...form, crime_time: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">City</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Area</label>
                  <select
                    value={form.area_name}
                    onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  >
                    {AREA_NAMES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Optional description of the incident..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? <ButtonLoader /> : <Plus className="h-4 w-4" />}
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteId(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-2.5">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Crime Record?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This action cannot be undone. The crime record will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
