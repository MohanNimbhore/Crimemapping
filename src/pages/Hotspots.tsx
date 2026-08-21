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
    if (totalDist === 0) { centroids.push({ lat: crimes[0].latitude, lng: crimes[0].longitude }); continue; }
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let i = 0; i < distances.length; i++) { r -= distances[i]; if (r <= 0) { idx = i; break; } }
    centroids.push({ lat: crimes[idx].latitude, lng: crimes[idx].longitude });
  }
  let assignments = new Array(crimes.length).fill(0);
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    for (let i = 0; i < crimes.length; i++) {
      let minDist = Infinity; let bestCluster = 0;
      for (let j = 0; j < centroids.length; j++) {
        const d = haversineDistance(crimes[i].latitude, crimes[i].longitude, centroids[j].lat, centroids[j].lng);
        if (d < minDist) { minDist = d; bestCluster = j; }
      }
      if (assignments[i] !== bestCluster) { assignments[i] = bestCluster; changed = true; }
    }
    for (let j = 0; j < centroids.length; j++) {
      const pts = crimes.filter((_, i) => assignments[i] === j);
      if (pts.length > 0) { centroids[j] = { lat: pts.reduce((s, p) => s + p.latitude, 0) / pts.length, lng: pts.reduce((s, p) => s + p.longitude, 0) / pts.length }; }
    }
    if (!changed) break;
  }
  return centroids.map((centroid, j) => {
    const points = crimes.filter((_, i) => assignments[i] === j);
    const crimeTypes: Record<string, number> = {};
    points.forEach((p) => { crimeTypes[p.crime_type] = (crimeTypes[p.crime_type] || 0) + 1; });
    return { centroid, points, crimeTypes };
  });
}

function getRiskLevel(n: number): 'low' | 'medium' | 'high' { return n >= 10 ? 'high' : n >= 5 ? 'medium' : 'low'; }
function getAreaName(crimeTypes: Record<string, number>, points: Crime[]): string {
  if (points.length > 0 && points[0].area_name) return points[0].area_name;
  const top = Object.entries(crimeTypes).sort(([, a], [, b]) => b - a)[0];
  return top ? `${top[0]} Zone` : 'Unknown Zone';
}

function riskRowClass(r: string) {
  switch (r) {
    case 'high':   return 'border-l-4 border-l-red-500 bg-red-500/[0.02] dark:bg-red-500/[0.05]';
    case 'medium': return 'border-l-4 border-l-orange-500 bg-orange-500/[0.02] dark:bg-orange-500/[0.05]';
    default:       return 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.05]';
  }
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
      const [c, h] = await Promise.all([api.getCrimes({ limit: 1000 }), api.getHotspots()]);
      setCrimes(c.data); setHotspots(h);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDetect = async () => {
    if (crimes.length === 0) return;
    setDetecting(true);
    try {
      const clusters = kMeans(crimes, kValue);
      const newHotspots: Partial<Hotspot>[] = clusters.map((c) => ({
        latitude: Number(c.centroid.lat.toFixed(6)),
        longitude: Number(c.centroid.lng.toFixed(6)),
        radius: 1000,
        crime_count: c.points.length,
        risk_level: getRiskLevel(c.points.length),
        area_name: getAreaName(c.crimeTypes, c.points),
        crime_types: c.crimeTypes,
      }));
      await api.clearHotspots();
      const saved = await api.saveHotspots(newHotspots);
      setHotspots(saved);
    } finally { setDetecting(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteHotspot(id);
      setHotspots((prev) => prev.filter((h) => h.id !== id));
    } finally { setDeletingId(null); }
  };

  if (loading) return <PageLoader />;

  const highRiskCount = hotspots.filter((h) => h.risk_level === 'high').length;
  const totalCrimesInHotspots = hotspots.reduce((acc, h) => acc + h.crime_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hotspot Analysis
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            K-Means clustering and spatial density risk mapping
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={kValue}
            onChange={(e) => setKValue(Number(e.target.value))}
            className="rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-orange-500 focus:outline-none appearance-none cursor-pointer shadow-sm"
          >
            {K_OPTIONS.map((k) => <option key={k} value={k}>K = {k} Clusters</option>)}
          </select>
          <button
            onClick={handleDetect}
            disabled={detecting || crimes.length === 0}
            className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-60 btn-press transition-all"
          >
            {detecting ? <ButtonLoader /> : <Zap className="h-4 w-4 text-white" />}
            Detect Hotspots
          </button>
        </div>
      </div>

      {/* Calm Normal State Stat Cards (Pops smoothly ONLY on Real Hover) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Hotspots',     value: hotspots.length,       icon: <MapPin className="h-5 w-5" />,        color: '#f97316', border: 'border-orange-200 dark:border-orange-500/30' },
          { label: 'High Risk Zones',    value: highRiskCount,          icon: <AlertTriangle className="h-5 w-5" />, color: '#ef4444', border: 'border-red-200 dark:border-red-500/30' },
          { label: 'Crimes in Hotspots', value: totalCrimesInHotspots,  icon: <Activity className="h-5 w-5" />,     color: '#3b82f6', border: 'border-blue-200 dark:border-blue-500/30' },
          { label: 'Analyzed Records',   value: crimes.length,          icon: <Database className="h-5 w-5" />,     color: '#8b5cf6', border: 'border-purple-200 dark:border-purple-500/30' },
        ].map(({ label, value, icon, color, border }) => (
          <div
            key={label}
            className={`card-lift bg-white dark:bg-slate-900/90 rounded-2xl border ${border} p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default`}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            </div>
            <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {hotspots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20 text-center shadow-sm">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Layers className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No hotspots detected</h3>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-md">Click "Detect Hotspots" to run K-Means clustering on {crimes.length} crime records.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-left">
                  {['Zone','Location','Crime Count','Risk Level','Top Crime Types','Created','Action'].map((h) => (
                    <th key={h} className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {hotspots.map((hs, i) => (
                  <tr
                    key={hs.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${riskRowClass(hs.risk_level)}`}
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">Zone {i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-900 dark:text-white font-semibold">{hs.area_name}</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{hs.latitude.toFixed(4)}, {hs.longitude.toFixed(4)}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white tabular-nums">{hs.crime_count}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${getRiskLevelColor(hs.risk_level)}`}>
                        {hs.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {hs.crime_types && Object.entries(hs.crime_types).sort(([,a],[,b]) => b-a).slice(0,3).map(([t, c]) => (
                          <span key={t} className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                            {t} ({c})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(hs.created_at)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(hs.id)}
                        disabled={deletingId === hs.id}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 hover:border-red-300 transition-all btn-press disabled:opacity-60"
                        title="Delete hotspot"
                      >
                        {deletingId === hs.id ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
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
