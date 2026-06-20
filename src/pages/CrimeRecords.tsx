import { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, FileText, SlidersHorizontal, X } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';
import { api } from '../lib/api';
import { formatDate, formatTime, getSeverityColor, getStatusColor } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';
import type { Crime } from '../types';
import { CRIME_TYPES, SEVERITY_LEVELS, CITIES, AREA_NAMES } from '../types';

export default function CrimeRecords() {
  const [searchParams] = useSearchParams();
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    city: '',
    startDate: '',
    endDate: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCrime, setSelectedCrime] = useState<Crime | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    crime_type: 'Theft',
    crime_date: new Date().toISOString().split('T')[0],
    crime_time: '12:00',
    latitude: 40.7128,
    longitude: -74.006,
    area_name: AREA_NAMES[0],
    city: CITIES[0],
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => {
    fetchCrimes();
  }, [page, filters, searchQuery]);

  const fetchCrimes = async () => {
    setLoading(true);
    try {
      const result = await api.getCrimes({
        ...filters,
        limit,
        offset: (page - 1) * limit,
      });
      setCrimes(result.data);
      setTotal(result.count);
    } catch (error) {
      console.error('Failed to fetch crimes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      api.searchCrimes(searchQuery).then(setCrimes).catch(console.error);
    } else {
      fetchCrimes();
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCrime(null);
    setFormData({
      crime_type: 'Theft',
      crime_date: new Date().toISOString().split('T')[0],
      crime_time: '12:00',
      latitude: 40.7128,
      longitude: -74.006,
      area_name: AREA_NAMES[0],
      city: CITIES[0],
      description: '',
      severity: 'medium',
    });
    setShowModal(true);
  };

  const openEditModal = (crime: Crime) => {
    setModalMode('edit');
    setSelectedCrime(crime);
    setFormData({
      crime_type: crime.crime_type,
      crime_date: crime.crime_date,
      crime_time: crime.crime_time,
      latitude: crime.latitude,
      longitude: crime.longitude,
      area_name: crime.area_name,
      city: crime.city,
      description: crime.description || '',
      severity: crime.severity,
    });
    setShowModal(true);
  };

  const openViewModal = (crime: Crime) => {
    setModalMode('view');
    setSelectedCrime(crime);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await api.createCrime(formData);
      } else if (modalMode === 'edit' && selectedCrime) {
        await api.updateCrime(selectedCrime.id, formData);
      }
      setShowModal(false);
      fetchCrimes();
    } catch (error) {
      console.error('Failed to save crime:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this crime record?')) {
      try {
        await api.deleteCrime(id);
        fetchCrimes();
      } catch (error) {
        console.error('Failed to delete crime:', error);
      }
    }
  };

  const clearFilters = () => {
    setFilters({ type: '', severity: '', city: '', startDate: '', endDate: '' });
    setSearchQuery('');
    setPage(1);
  };

  const activeFilterCount = [filters.type, filters.severity, filters.city, filters.startDate, filters.endDate].filter(Boolean).length;

  const totalPages = Math.ceil(total / limit);

  if (loading && crimes.length === 0) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Crime Records</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Manage and view all crime records</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 btn-press"
        >
          <Plus className="w-4 h-4" />
          Add Crime
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search crimes, areas, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all btn-press ${
              showFilters
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-sm shadow-blue-500/10'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl transition-all btn-press"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-700/40 animate-fade-in">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              <option value="">All Types</option>
              {CRIME_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              <option value="">All Severities</option>
              {SEVERITY_LEVELS.map((sev) => (
                <option key={sev} value={sev}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</option>
              ))}
            </select>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              <option value="">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden animate-fade-in-up card-lift" style={{ animationDelay: '160ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/40">
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Area</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">City</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {crimes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-slate-400 text-sm">No crime records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                crimes.map((crime, idx) => (
                  <tr
                    key={crime.id}
                    className="hover:bg-slate-700/15 transition-colors group/row animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">{crime.id.substring(0, 8)}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{crime.crime_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(crime.crime_date)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{crime.area_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{crime.city}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getSeverityColor(crime.severity)}`}>
                        {crime.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(crime.status)}`}>
                        {crime.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                        <button onClick={() => openViewModal(crime)} className="p-2 rounded-lg hover:bg-slate-600/40 text-slate-400 hover:text-white transition-all btn-press" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEditModal(crime)} className="p-2 rounded-lg hover:bg-blue-500/15 text-slate-400 hover:text-blue-400 transition-all btn-press" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(crime.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all btn-press" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-700/50">
            <div className="text-sm text-slate-400">
              Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to <span className="text-white font-medium">{Math.min(page * limit, total)}</span> of <span className="text-white font-medium">{total}</span> records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-press"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-white font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-press"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'create' ? 'Add New Crime' : modalMode === 'edit' ? 'Edit Crime' : 'Crime Details'} size="lg">
        {modalMode === 'view' && selectedCrime ? (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Crime Type', value: selectedCrime.crime_type },
                { label: 'Date & Time', value: `${formatDate(selectedCrime.crime_date)} at ${formatTime(selectedCrime.crime_time)}` },
                { label: 'Location', value: `${selectedCrime.area_name}, ${selectedCrime.city}` },
                { label: 'Coordinates', value: `${selectedCrime.latitude}, ${selectedCrime.longitude}` },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{item.label}</label>
                  <p className="text-white font-medium mt-1">{item.value}</p>
                </div>
              ))}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Severity</label>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-1 ${getSeverityColor(selectedCrime.severity)}`}>
                  {selectedCrime.severity}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Status</label>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-1 ${getStatusColor(selectedCrime.status)}`}>
                  {selectedCrime.status}
                </span>
              </div>
            </div>
            {selectedCrime.description && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Description</label>
                <p className="text-white mt-1.5 leading-relaxed">{selectedCrime.description}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Crime Type', type: 'select', value: formData.crime_type, options: CRIME_TYPES, onChange: (v: string) => setFormData({ ...formData, crime_type: v }) },
                { label: 'Severity', type: 'select', value: formData.severity, options: SEVERITY_LEVELS, onChange: (v: string) => setFormData({ ...formData, severity: v as typeof formData.severity }) },
                { label: 'Date', type: 'date', value: formData.crime_date, onChange: (v: string) => setFormData({ ...formData, crime_date: v }) },
                { label: 'Time', type: 'time', value: formData.crime_time, onChange: (v: string) => setFormData({ ...formData, crime_time: v }) },
                { label: 'City', type: 'select', value: formData.city, options: CITIES, onChange: (v: string) => setFormData({ ...formData, city: v }) },
                { label: 'Area', type: 'select', value: formData.area_name, options: AREA_NAMES, onChange: (v: string) => setFormData({ ...formData, area_name: v }) },
                { label: 'Latitude', type: 'number', value: String(formData.latitude), step: '0.0001', onChange: (v: string) => setFormData({ ...formData, latitude: parseFloat(v) }) },
                { label: 'Longitude', type: 'number', value: String(formData.longitude), step: '0.0001', onChange: (v: string) => setFormData({ ...formData, longitude: parseFloat(v) }) },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    >
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      step={field.step}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="Enter crime details..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all btn-press">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 transition-all flex items-center gap-2 btn-press shadow-lg shadow-blue-500/20">
                {saving && <ButtonLoader />}
                {modalMode === 'create' ? 'Add Crime' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
