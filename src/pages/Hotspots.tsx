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

function riskGlow(r: string) {
  switch (r) {
    case 'high':   return 'border-red-500/30 bg-red-500/5';
    case 'medium': return 'border-orange-500/30 bg-orange-500/5';
    default:       return 'border-green-500/30 bg-green-500/5';
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
    setDetecting(true);
    try {
      const results = kMeans(crimes, kValue);
      await api.clearHotspots();
      const data: Partial<Hotspot>[] = results.filter((r) => r.points.length > 0).map((r) => ({
        latitude: r.centroid.lat, longitude: r.centroid.lng, radius: 800,
        crime_count: r.points.length, risk_level: getRiskLevel(r.points.length),
        area_name: getAreaName(r.crimeTypes, r.points), crime_types: r.crimeTypes,
      }));
      setHotspots(await api.saveHotspots(data));
    } catch (err) { console.error(err); }
    finally { setDetecting(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await api.deleteHotspot(id); setHotspots((p) => p.filter((h) => h.id !== id)); }
    catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  const highRiskCount = hotspots.filter((h) => h.risk_level === 'high').length;
  const totalCrimesInHotspots = hotspots.reduce((s, h) => s + h.crime_count, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/15 glow-orange border border-orange-500/20">
            <Layers className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Hotspot Detection</h1>
            <p className="text-sm text-slate-400">K-Means clustering to identify high-risk crime zones</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={kValue}
            onChange={(e) => setKValue(Number(e.target.value))}
            className="rounded-xl glass-deep border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none appearance-none cursor-pointer"
          >
            {K_OPTIONS.map((k) => <option key={k} value={k}>K = {k}</option>)}
          </select>
          <button
            onClick={handleDetect}
            disabled={detecting || crimes.length === 0}
            className="flex items-center gap-2 rounded-xl bg-orange-600 border border-orange-500/30 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-60 btn-press glow-orange transition-all"
          >
            {detecting ? <ButtonLoader /> : <Zap className="h-4 w-4" />}
            Detect Hotspots
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Hotspots',    value: hotspots.length,      icon: <MapPin className="h-5 w-5" />,      color: '#f97316', glow: 'glow-orange', border: 'border-orange-500/20' },
          { label: 'High Risk Zones',   value: highRiskCount,         icon: <AlertTriangle className="h-5 w-5" />, color: '#ef4444', glow: 'glow-red',    border: 'border-red-500/20' },
          { label: 'Crimes in Hotspots',value: totalCrimesInHotspots, icon: <Activity className="h-5 w-5" />,    color: '#3b82f6', glow: 'glow-blue',   border: 'border-blue-500/20' },
          { label: 'Analyzed Records',  value: crimes.length,         icon: <Database className="h-5 w-5" />,    color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
        ].map(({ label, value, icon, color, glow, border }, i) => (
          <div key={label} className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-5 animate-fade-in-up`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-1.5 w-1.5 rounded-full animate-pulse-subtle" style={{ background: color }} />
            </div>
            <p className="text-3xl font-bold tabular-nums stat-3d" style={{ color }}>{value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {hotspots.length === 0 ? (
        <div className="glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center py-24 text-center">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/60 mb-4">
            <Layers className="h-10 w-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">No hotspots detected</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Click "Detect Hotspots" to run K-Means clustering on {crimes.length} crime records.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 glass-deep">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/60 text-left">
                  {['Zone','Location','Crime Count','Risk Level','Top Types','Created',''].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hotspots.map((hs, i) => (
                  <tr
                    key={hs.id}
                    className={`border-b border-slate-200 dark:border-slate-700/40 hover:bg-slate-700/20 transition-colors animate-fade-in-up ${riskGlow(hs.risk_level)}`}
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-4 py-3 font-semibold text-white">Zone {i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 dark:text-white font-medium">{hs.area_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{hs.latitude.toFixed(4)}, {hs.longitude.toFixed(4)}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white tabular-nums">{hs.crime_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getRiskLevelColor(hs.risk_level)}`}>
                        {hs.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {hs.crime_types && Object.entries(hs.crime_types).sort(([,a],[,b]) => b-a).slice(0,3).map(([t, c]) => (
                          <span key={t} className="inline-block rounded-lg bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                            {t} ({c})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(hs.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(hs.id)}
                        disabled={deletingId === hs.id}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/50 p-1.5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all btn-press disabled:opacity-60"
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
