import { useEffect, useState, useCallback } from 'react';
import { Zap, Trash2, MapPin, AlertTriangle, Activity, Database, Layers } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { getRiskLevelColor, formatDate } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

const K_OPTIONS = [3, 5, 8, 10, 12, 15];

interface KMeansResult {
  centroid: { lat: number; lng: number };
  points: Crime[];
  crimeTypes: Record<string, number>;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function kMeans(crimes: Crime[], k: number, maxIterations = 100): KMeansResult[] {
  if (crimes.length === 0 || k <= 0) return [];
  const kActual = Math.min(k, crimes.length);

  // Initialize centroids using k-means++ seeding
  const centroids: { lat: number; lng: number }[] = [];
  const firstIdx = Math.floor(Math.random() * crimes.length);
  centroids.push({ lat: crimes[firstIdx].latitude, lng: crimes[firstIdx].longitude });

  while (centroids.length < kActual) {
    const distances = crimes.map((c) => {
      let minDist = Infinity;
      for (const cen of centroids) {
        const d = haversineDistance(c.latitude, c.longitude, cen.lat, cen.lng);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    if (totalDist === 0) {
      centroids.push({ lat: crimes[0].latitude, lng: crimes[0].longitude });
      continue;
    }
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push({ lat: crimes[idx].latitude, lng: crimes[idx].longitude });
  }

  // Iterate
  let assignments = new Array(crimes.length).fill(0);
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign
    for (let i = 0; i < crimes.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let j = 0; j < centroids.length; j++) {
        const d = haversineDistance(crimes[i].latitude, crimes[i].longitude, centroids[j].lat, centroids[j].lng);
        if (d < minDist) { minDist = d; bestCluster = j; }
      }
      if (assignments[i] !== bestCluster) { assignments[i] = bestCluster; changed = true; }
    }

    // Update centroids
    for (let j = 0; j < centroids.length; j++) {
      const clusterPoints = crimes.filter((_, i) => assignments[i] === j);
      if (clusterPoints.length > 0) {
        centroids[j] = {
          lat: clusterPoints.reduce((sum, p) => sum + p.latitude, 0) / clusterPoints.length,
          lng: clusterPoints.reduce((sum, p) => sum + p.longitude, 0) / clusterPoints.length,
        };
      }
    }

    if (!changed) break;
  }

  // Build results
  return centroids.map((centroid, j) => {
    const points = crimes.filter((_, i) => assignments[i] === j);
    const crimeTypes: Record<string, number> = {};
    points.forEach((p) => {
      crimeTypes[p.crime_type] = (crimeTypes[p.crime_type] || 0) + 1;
    });
    return { centroid, points, crimeTypes };
  });
}

function getRiskLevel(crimeCount: number): 'low' | 'medium' | 'high' {
  if (crimeCount >= 10) return 'high';
  if (crimeCount >= 5) return 'medium';
  return 'low';
}

function getAreaName(crimeTypes: Record<string, number>, points: Crime[]): string {
  if (points.length > 0 && points[0].area_name) return points[0].area_name;
  const topType = Object.entries(crimeTypes).sort(([, a], [, b]) => b - a)[0];
  return topType ? `${topType[0]} Zone` : 'Unknown Zone';
}

export default function Hotspots() {
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [kValue, setKValue] = useState(5);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([
        api.getCrimes({ limit: 1000 }),
        api.getHotspots(),
      ]);
      setCrimes(c.data);
      setHotspots(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const results = kMeans(crimes, kValue);
      await api.clearHotspots();

      const hotspotData: Partial<Hotspot>[] = results
        .filter((r) => r.points.length > 0)
        .map((r) => ({
          latitude: r.centroid.lat,
          longitude: r.centroid.lng,
          radius: 800,
          crime_count: r.points.length,
          risk_level: getRiskLevel(r.points.length),
          area_name: getAreaName(r.crimeTypes, r.points),
          crime_types: r.crimeTypes,
        }));

      const saved = await api.saveHotspots(hotspotData);
      setHotspots(saved);
    } catch (err) {
      console.error('Failed to detect hotspots:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteHotspot(id);
      setHotspots((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Failed to delete hotspot:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const highRiskCount = hotspots.filter((h) => h.risk_level === 'high').length;
  const totalCrimesInHotspots = hotspots.reduce((sum, h) => sum + h.crime_count, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hotspot Detection</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">K-Means clustering to identify high-risk crime zones</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={kValue}
            onChange={(e) => setKValue(Number(e.target.value))}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {K_OPTIONS.map((k) => (
              <option key={k} value={k}>K = {k}</option>
            ))}
          </select>
          <button
            onClick={handleDetect}
            disabled={detecting || crimes.length === 0}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60 btn-press"
          >
            {detecting ? <ButtonLoader /> : <Zap className="h-4 w-4" />}
            Detect Hotspots
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Hotspots</p>
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">High Risk Zones</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{highRiskCount}</p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-950/30 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Crimes in Hotspots</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalCrimesInHotspots}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Analyzed Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{crimes.length}</p>
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <Database className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {hotspots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No hotspots detected</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Click "Detect Hotspots" to run K-Means clustering on {crimes.length} crime records and identify high-risk zones.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Zone</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Location</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Crime Count</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Risk Level</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Top Crime Types</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Created</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {hotspots.map((hotspot, i) => (
                  <tr
                    key={hotspot.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      Zone {i + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{hotspot.area_name}</div>
                      <div className="text-xs text-slate-400">{hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{hotspot.crime_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getRiskLevelColor(hotspot.risk_level)}`}>
                        {hotspot.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {hotspot.crime_types &&
                          Object.entries(hotspot.crime_types)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([type, count]) => (
                              <span key={type} className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                                {type} ({count})
                              </span>
                            ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(hotspot.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(hotspot.id)}
                        disabled={deletingId === hotspot.id}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-60"
                        title="Delete"
                      >
                        {deletingId === hotspot.id ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
