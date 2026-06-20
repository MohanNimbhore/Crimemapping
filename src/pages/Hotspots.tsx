import React, { useEffect, useState } from 'react';
import { Target, RefreshCw, Trash2, MapPin, AlertTriangle, Zap, Brain } from 'lucide-react';
import { api } from '../lib/api';
import type { Hotspot, Crime } from '../types';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';
import { getRiskLevelColor } from '../lib/utils';

export default function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [selectedK, setSelectedK] = useState(8);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hotspotsData, crimesData] = await Promise.all([api.getHotspots(), api.getCrimes({ limit: 1000 })]);
      setHotspots(hotspotsData);
      setCrimes(crimesData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectHotspots = async () => {
    if (crimes.length < 5) return;
    setDetecting(true);
    try {
      const points = crimes.map(c => ({
        latitude: c.latitude,
        longitude: c.longitude,
        crime_type: c.crime_type,
        severity: c.severity,
      }));

      const clusters = kMeans(points, selectedK);

      const AREA_LABELS = ['Downtown', 'Midtown', 'Uptown', 'Financial District', 'Arts District', 'Industrial Zone', 'Residential Area', 'Commercial Hub', 'University District', 'Harbor Area', 'Airport Zone', 'Shopping Center', 'Entertainment District', 'Historic District', 'Medical Center'];

      const newHotspots: Partial<Hotspot>[] = clusters
        .filter(c => c.crimeCount >= 3)
        .sort((a, b) => b.crimeCount - a.crimeCount)
        .map((cluster, idx) => ({
          latitude: cluster.center.lat,
          longitude: cluster.center.lng,
          radius: 500 + cluster.crimeCount * 10,
          crime_count: cluster.crimeCount,
          risk_level: cluster.crimeCount >= 15 ? 'high' : cluster.crimeCount >= 8 ? 'medium' : 'low',
          area_name: AREA_LABELS[idx % AREA_LABELS.length] + (idx >= AREA_LABELS.length ? ` ${Math.floor(idx / AREA_LABELS.length) + 1}` : ''),
          crime_types: cluster.crimeTypes,
        }));

      await api.clearHotspots();
      if (newHotspots.length > 0) {
        await api.saveHotspots(newHotspots);
      }
      fetchData();
    } catch (error) {
      console.error('Failed to detect hotspots:', error);
    } finally {
      setDetecting(false);
    }
  };

  const kMeans = (points: Array<{ latitude: number; longitude: number; crime_type: string; severity?: string }>, k: number) => {
    if (points.length === 0) return [];
    k = Math.min(k, points.length);

    const centroids: Array<{ lat: number; lng: number }> = [];
    const usedIndices = new Set<number>();
    while (centroids.length < k) {
      const idx = Math.floor(Math.random() * points.length);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        centroids.push({ lat: points[idx].latitude, lng: points[idx].longitude });
      }
    }

    let iterations = 0;
    let changed = true;
    while (changed && iterations < 100) {
      changed = false;
      const clusters: Array<Array<typeof points[0]>> = Array.from({ length: k }, () => []);

      points.forEach(point => {
        let minDist = Infinity;
        let closest = 0;
        centroids.forEach((c, i) => {
          const dist = Math.sqrt((point.latitude - c.lat) ** 2 + (point.longitude - c.lng) ** 2);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        clusters[closest].push(point);
      });

      centroids.forEach((c, i) => {
        if (clusters[i].length > 0) {
          const newLat = clusters[i].reduce((s, p) => s + p.latitude, 0) / clusters[i].length;
          const newLng = clusters[i].reduce((s, p) => s + p.longitude, 0) / clusters[i].length;
          if (Math.abs(newLat - c.lat) > 0.0001 || Math.abs(newLng - c.lng) > 0.0001) {
            changed = true;
            centroids[i] = { lat: newLat, lng: newLng };
          }
        }
      });
      iterations++;
    }

    const results: Array<{
      center: { lat: number; lng: number };
      points: typeof points;
      crimeCount: number;
      crimeTypes: Record<string, number>;
    }> = [];

    const finalClusters: Array<typeof points> = Array.from({ length: k }, () => []);
    points.forEach(point => {
      let minDist = Infinity;
      let closest = 0;
      centroids.forEach((c, i) => {
        const dist = Math.sqrt((point.latitude - c.lat) ** 2 + (point.longitude - c.lng) ** 2);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      finalClusters[closest].push(point);
    });

    finalClusters.forEach((cluster, i) => {
      if (cluster.length > 0) {
        const crimeTypes: Record<string, number> = {};
        cluster.forEach(p => { crimeTypes[p.crime_type] = (crimeTypes[p.crime_type] || 0) + 1; });
        results.push({
          center: centroids[i],
          points: cluster,
          crimeCount: cluster.length,
          crimeTypes,
        });
      }
    });

    return results;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this hotspot?')) {
      await api.deleteHotspot(id);
      fetchData();
    }
  };

  const totalCrimes = hotspots.reduce((sum, h) => sum + h.crime_count, 0);
  const highRiskCount = hotspots.filter(h => h.risk_level === 'high').length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Hotspot Analysis</h1>
          <p className="text-slate-400 mt-0.5 text-sm">AI-powered crime hotspot detection using K-Means clustering</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedK}
            onChange={(e) => setSelectedK(parseInt(e.target.value))}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            {[3, 5, 8, 10, 12, 15].map((k) => (
              <option key={k} value={k}>K = {k} clusters</option>
            ))}
          </select>
          <button
            onClick={detectHotspots}
            disabled={detecting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 btn-press"
          >
            {detecting ? <ButtonLoader /> : <Brain className="w-4 h-4" />}
            Detect Hotspots
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<Target className="w-5 h-5" />} label="Total Hotspots" value={hotspots.length} color="blue" delay={0} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="High Risk Zones" value={highRiskCount} color="red" delay={80} />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Crimes in Hotspots" value={totalCrimes} color="orange" delay={160} />
        <StatCard icon={<RefreshCw className="w-5 h-5" />} label="Analyzed Records" value={crimes.length} color="green" delay={240} />
      </div>

      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/15">
            <Zap className="w-4 h-4 text-orange-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Detected Hotspots</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/40">
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Crime Count</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk Level</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Crime Types</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {hotspots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center">
                        <Target className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-slate-400 text-sm">No hotspots detected. Click &quot;Detect Hotspots&quot; to analyze.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                hotspots.map((hotspot, idx) => (
                  <tr key={hotspot.id} className="hover:bg-slate-700/15 transition-colors group/row animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{hotspot.area_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{hotspot.crime_count}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRiskLevelColor(hotspot.risk_level)}`}>
                        {hotspot.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {Object.entries(hotspot.crime_types || {}).slice(0, 3).map(([type, count]) => (
                        <span key={type} className="inline-block mr-2 px-2 py-0.5 bg-slate-700/50 rounded-lg text-xs font-medium">
                          {type}: {count}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(hotspot.id)}
                        className="p-2 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all btn-press opacity-0 group-hover/row:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
    red: { bg: 'from-red-500/15 to-red-600/5', icon: 'text-red-400 bg-red-500/15' },
    orange: { bg: 'from-orange-500/15 to-orange-600/5', icon: 'text-orange-400 bg-orange-500/15' },
    green: { bg: 'from-emerald-500/15 to-emerald-600/5', icon: 'text-emerald-400 bg-emerald-500/15' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-gradient-to-br ${c.bg} border border-slate-700/50 rounded-2xl p-4 card-lift animate-fade-in-up`} style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.icon}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
