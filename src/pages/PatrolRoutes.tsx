import { useEffect, useState, useCallback } from 'react';
import { Route, Plus, Trash2, MapPin, Clock, Navigation, Flag, CircleDot, Activity, AlertTriangle } from 'lucide-react';
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
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestNeighborRoute(
  station: { lat: number; lng: number },
  hotspots: Hotspot[]
): { orderedHotspots: Hotspot[]; totalDistance: number; estimatedDuration: number } {
  if (hotspots.length === 0) {
    return { orderedHotspots: [], totalDistance: 0, estimatedDuration: 0 };
  }

  const visited = new Set<number>();
  const orderedHotspots: Hotspot[] = [];
  let currentLat = station.lat;
  let currentLng = station.lng;
  let totalDistance = 0;

  // Sort hotspots by risk (high first) then crime count
  const sortedHotspots = [...hotspots].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    const riskDiff = (riskOrder[b.risk_level as keyof typeof riskOrder] || 3) - (riskOrder[a.risk_level as keyof typeof riskOrder] || 3);
    if (riskDiff !== 0) return riskDiff;
    return b.crime_count - a.crime_count;
  });

  for (let i = 0; i < sortedHotspots.length; i++) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let j = 0; j < sortedHotspots.length; j++) {
      if (visited.has(j)) continue;
      const dist = haversineDistance(currentLat, currentLng, sortedHotspots[j].latitude, sortedHotspots[j].longitude);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = j;
      }
    }

    if (nearestIdx === -1) break;
    visited.add(nearestIdx);
    totalDistance += nearestDist;
    orderedHotspots.push(sortedHotspots[nearestIdx]);
    currentLat = sortedHotspots[nearestIdx].latitude;
    currentLng = sortedHotspots[nearestIdx].longitude;
  }

  // Return to station
  const returnDist = haversineDistance(currentLat, currentLng, station.lat, station.lng);
  totalDistance += returnDist;

  // Estimate duration: avg 30 km/h in city, plus 5 min per stop
  const travelMinutes = (totalDistance / 30) * 60;
  const stopMinutes = orderedHotspots.length * 5;
  const estimatedDuration = Math.round(travelMinutes + stopMinutes);

  return { orderedHotspots, totalDistance, estimatedDuration };
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
      const [r, h, c] = await Promise.all([
        api.getRoutes(),
        api.getHotspots(),
        api.getCrimes({ limit: 100 }),
      ]);
      setRoutes(r);
      setHotspots(h);
      setCrimes(c.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!routeName.trim()) return;
    setGenerating(true);
    try {
      const station = STATIONS[stationIdx];
      const { orderedHotspots, totalDistance, estimatedDuration } = nearestNeighborRoute(
        { lat: station.lat, lng: station.lng },
        hotspots
      );

      const routeData: Partial<PatrolRoute> = {
        name: routeName.trim(),
        station_latitude: station.lat,
        station_longitude: station.lng,
        station_name: station.name,
        hotspots: orderedHotspots.map((h) => ({
          latitude: h.latitude,
          longitude: h.longitude,
          risk_level: h.risk_level,
          area_name: h.area_name,
        })),
        waypoints: [
          { latitude: station.lat, longitude: station.lng, order: 0 },
          ...orderedHotspots.map((h, i) => ({
            latitude: h.latitude,
            longitude: h.longitude,
            order: i + 1,
          })),
          { latitude: station.lat, longitude: station.lng, order: orderedHotspots.length + 1 },
        ],
        total_distance: totalDistance,
        estimated_duration: estimatedDuration,
        status: 'active',
      };

      const saved = await api.saveRoute(routeData);
      setRoutes((prev) => [saved, ...prev]);
      setRouteName('');
    } catch (err) {
      console.error('Failed to generate route:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete route:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const activeRoutes = routes.filter((r) => r.status === 'active').length;
  const totalPatrolTime = routes.reduce((sum, r) => sum + (r.estimated_duration || 0), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patrol Routes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Nearest-neighbor optimized patrol routes from police stations to hotspots</p>
      </div>

      {/* Generate Route */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Generate New Route</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Police Station</label>
            <select
              value={stationIdx}
              onChange={(e) => setStationIdx(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              {STATIONS.map((s, i) => (
                <option key={s.name} value={i}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Route Name</label>
            <input
              type="text"
              placeholder="e.g. Night Patrol - Sector A"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !routeName.trim() || hotspots.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 btn-press"
          >
            {generating ? <ButtonLoader /> : <Plus className="h-4 w-4" />}
            Generate Route
          </button>
        </div>
        {hotspots.length === 0 && (
          <p className="mt-2 text-xs text-amber-500 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            No hotspots available. Detect hotspots first on the Hotspots page.
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Routes</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{activeRoutes}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <Route className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Available Hotspots</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{hotspots.length}</p>
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-950/30 p-2.5">
              <MapPin className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Patrol Time</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(totalPatrolTime)}</p>
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Route Cards */}
      {routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Route className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No patrol routes created</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Select a police station, name your route, and click "Generate Route" to create an optimized patrol path through {hotspots.length} hotspots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {routes.map((route, i) => (
            <div
              key={route.id}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 card-lift animate-fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{route.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {route.station_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(route.status)}`}>
                    {route.status}
                  </span>
                  <button
                    onClick={() => handleDelete(route.id)}
                    disabled={deletingId === route.id}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-60"
                    title="Delete route"
                  >
                    {deletingId === route.id ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Distance</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {route.total_distance !== null ? formatDistance(route.total_distance) : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {route.estimated_duration !== null ? formatDuration(route.estimated_duration) : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Stops</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{route.hotspots.length}</p>
                </div>
              </div>

              {/* Route Order */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Route Order</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200">Start: {route.station_name}</span>
                  </div>
                  {route.hotspots.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm pl-1">
                      <CircleDot className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">{idx + 1}. {h.area_name}</span>
                      <span className={`inline-block rounded-full border px-1.5 py-0.5 text-xs font-medium capitalize ${getRiskLevelColor(h.risk_level)}`}>
                        {h.risk_level}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-200">End: Return to {route.station_name}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" />
                  Created {formatDate(route.created_at)}
                </span>
                <span>{crimes.length} crimes on record</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
