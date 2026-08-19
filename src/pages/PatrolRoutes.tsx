import { useEffect, useState, useCallback } from 'react';
import { Route, Plus, Trash2, MapPin, Clock, Navigation, Flag, Activity, AlertTriangle, Crosshair } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot, PatrolRoute } from '../types';
import { formatDate, formatDistance, formatDuration, getRiskLevelColor, getStatusColor } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

const STATIONS = [
  { name: 'Ahmedabad Central PS', lat: 23.0225, lng: 72.5714 },
  { name: 'Maninagar PS', lat: 22.9876, lng: 72.5805 },
  { name: 'Satellite PS', lat: 23.0297, lng: 72.5108 },
  { name: 'Surat City PS', lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara City PS', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot City PS', lat: 22.3039, lng: 70.8022 },
  { name: 'Gandhinagar PS', lat: 23.2156, lng: 72.6369 },
  { name: 'Mumbai Central PS', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi CP PS', lat: 28.7041, lng: 77.1025 },
  { name: 'Bangalore City PS', lat: 12.9716, lng: 77.5946 },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestNeighborRoute(station: { lat: number; lng: number }, hotspots: Hotspot[]) {
  if (hotspots.length === 0) return { orderedHotspots: [], totalDistance: 0, estimatedDuration: 0 };
  const visited = new Set<number>();
  const orderedHotspots: Hotspot[] = [];
  let curLat = station.lat, curLng = station.lng, totalDistance = 0;
  const sorted = [...hotspots].sort((a, b) => {
    const ro = { high: 0, medium: 1, low: 2 };
    return (ro[a.risk_level as keyof typeof ro] ?? 3) - (ro[b.risk_level as keyof typeof ro] ?? 3) || b.crime_count - a.crime_count;
  });
  for (let i = 0; i < sorted.length; i++) {
    let nearIdx = -1, nearDist = Infinity;
    for (let j = 0; j < sorted.length; j++) {
      if (visited.has(j)) continue;
      const d = haversineDistance(curLat, curLng, sorted[j].latitude, sorted[j].longitude);
      if (d < nearDist) { nearDist = d; nearIdx = j; }
    }
    if (nearIdx === -1) break;
    visited.add(nearIdx); totalDistance += nearDist;
    orderedHotspots.push(sorted[nearIdx]);
    curLat = sorted[nearIdx].latitude; curLng = sorted[nearIdx].longitude;
  }
  totalDistance += haversineDistance(curLat, curLng, station.lat, station.lng);
  return { orderedHotspots, totalDistance, estimatedDuration: Math.round((totalDistance / 30) * 60 + orderedHotspots.length * 5) };
}

export default function PatrolRoutes() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [stationIdx, setStationIdx] = useState(0);
  const [routeName, setRouteName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, h, c] = await Promise.all([api.getRoutes(), api.getHotspots(), api.getCrimes({ limit: 100 })]);
      setRoutes(r); setHotspots(h); setCrimes(c.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!routeName.trim()) return;
    setGenerating(true);
    try {
      const station = STATIONS[stationIdx];
      const { orderedHotspots, totalDistance, estimatedDuration } = nearestNeighborRoute({ lat: station.lat, lng: station.lng }, hotspots);
      const saved = await api.saveRoute({
        name: routeName.trim(), station_latitude: station.lat, station_longitude: station.lng, station_name: station.name,
        hotspots: orderedHotspots.map((h) => ({ latitude: h.latitude, longitude: h.longitude, risk_level: h.risk_level, area_name: h.area_name })),
        waypoints: [{ latitude: station.lat, longitude: station.lng, order: 0 }, ...orderedHotspots.map((h, i) => ({ latitude: h.latitude, longitude: h.longitude, order: i+1 })), { latitude: station.lat, longitude: station.lng, order: orderedHotspots.length+1 }],
        total_distance: totalDistance, estimated_duration: estimatedDuration, status: 'active',
      });
      setRoutes((p) => [saved, ...p]); setRouteName('');
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await api.deleteRoute(id); setRoutes((p) => p.filter((r) => r.id !== id)); }
    catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  const activeRoutes = routes.filter((r) => r.status === 'active').length;
  const totalPatrolTime = routes.reduce((s, r) => s + (r.estimated_duration || 0), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-500/15 glow-blue border border-blue-500/20">
          <Navigation className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Patrol Routes</h1>
          <p className="text-sm text-slate-400">Nearest-neighbor optimized patrol routes from stations to hotspots</p>
        </div>
      </div>

      {/* Generator */}
      <div className="glass-deep rounded-2xl border border-blue-500/20 neon-pulse p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
            <Navigation className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Generate New Route</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Police Station</label>
            <select
              value={stationIdx} onChange={(e) => setStationIdx(Number(e.target.value))}
              className="w-full rounded-xl glass-deep border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none appearance-none"
            >
              {STATIONS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Route Name</label>
            <input
              type="text" placeholder="e.g. Night Patrol – Sector A" value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full rounded-xl glass-deep border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={handleGenerate} disabled={generating || !routeName.trim() || hotspots.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 border border-blue-500/30 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white hover:bg-blue-500 disabled:opacity-60 btn-press transition-all"
          >
            {generating ? <ButtonLoader /> : <Plus className="h-4 w-4" />}
            Generate Route
          </button>
        </div>
        {hotspots.length === 0 && (
          <p className="mt-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> No hotspots available. Detect hotspots first.
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Routes',      value: activeRoutes,       icon: <Route className="h-5 w-5" />,        color: '#3b82f6', glow: 'glow-blue',   border: 'border-blue-500/20' },
          { label: 'Available Hotspots', value: hotspots.length,    icon: <MapPin className="h-5 w-5" />,       color: '#f97316', glow: 'glow-orange', border: 'border-orange-500/20' },
          { label: 'Total Patrol Time',  value: formatDuration(totalPatrolTime), icon: <Clock className="h-5 w-5" />, color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
        ].map(({ label, value, icon, color, glow, border }, i) => (
          <div key={label} className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse-subtle" style={{ background: color }} />
            </div>
            <p className="text-2xl font-bold stat-3d" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Route cards */}
      {routes.length === 0 ? (
        <div className="glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/60 mb-4"><Route className="h-10 w-10 text-slate-600" /></div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No patrol routes created</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Select a station, name your route, and click "Generate Route".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {routes.map((route, i) => (
            <div
              key={route.id}
              className="glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 card-3d animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{route.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5" />{route.station_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getStatusColor(route.status)}`}>{route.status}</span>
                  <button
                    onClick={() => handleDelete(route.id)} disabled={deletingId === route.id}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/50 p-1.5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all btn-press disabled:opacity-60"
                  >
                    {deletingId === route.id ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Distance', value: route.total_distance !== null ? formatDistance(route.total_distance) : '—' },
                  { label: 'Duration', value: route.estimated_duration !== null ? formatDuration(route.estimated_duration) : '—' },
                  { label: 'Stops', value: String(route.hotspots.length) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40 p-2.5 text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Route order */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Route Order</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-green-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Start: {route.station_name}</span>
                  </div>
                  {route.hotspots.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm pl-1">
                      <Crosshair className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400">{idx + 1}. {h.area_name}</span>
                      <span className={`inline-block rounded-full border px-1.5 py-0.5 text-xs font-medium capitalize ${getRiskLevelColor(h.risk_level)}`}>{h.risk_level}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">Return: {route.station_name}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/40 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Created {formatDate(route.created_at)}</span>
                <span>{crimes.length} crimes on record</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
