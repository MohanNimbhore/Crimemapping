import { useEffect, useState, Fragment } from 'react';
import { Route, Trash2, MapPin, Clock, AlertTriangle, Navigation, Zap, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { PatrolRoute, Hotspot, Crime } from '../types';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';
import { formatDistance, formatDuration } from '../lib/utils';

const STATIONS = [
  { name: 'Ahmedabad Police Commissionerate', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Surat Police Headquarters', latitude: 21.1702, longitude: 72.8311 },
  { name: 'Vadodara Police Station', latitude: 22.3072, longitude: 73.1812 },
  { name: 'Rajkot Police Station', latitude: 22.3039, longitude: 70.8022 },
  { name: 'Gandhinagar Police Station', latitude: 23.2156, longitude: 72.6369 },
  { name: 'Mumbai Police HQ', latitude: 19.076, longitude: 72.8777 },
  { name: 'Delhi Police HQ', latitude: 28.7041, longitude: 77.1025 },
  { name: 'Bangalore Police HQ', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Chennai Police HQ', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Kolkata Police HQ', latitude: 22.5726, longitude: 88.3639 },
];

function kMeansFromCrimes(crimes: Crime[], k: number): Partial<Hotspot>[] {
  if (crimes.length === 0) return [];
  k = Math.min(k, crimes.length);

  const centroids: Array<{ lat: number; lng: number }> = [];
  const usedIdx = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * crimes.length);
    if (!usedIdx.has(idx)) {
      usedIdx.add(idx);
      centroids.push({ lat: crimes[idx].latitude, lng: crimes[idx].longitude });
    }
  }

  for (let iter = 0; iter < 50; iter++) {
    const clusters: Array<Crime[]> = Array.from({ length: k }, () => []);
    crimes.forEach(c => {
      let minDist = Infinity, closest = 0;
      centroids.forEach((ce, i) => {
        const d = (c.latitude - ce.lat) ** 2 + (c.longitude - ce.lng) ** 2;
        if (d < minDist) { minDist = d; closest = i; }
      });
      clusters[closest].push(c);
    });
    centroids.forEach((ce, i) => {
      if (clusters[i].length > 0) {
        ce.lat = clusters[i].reduce((s, c) => s + c.latitude, 0) / clusters[i].length;
        ce.lng = clusters[i].reduce((s, c) => s + c.longitude, 0) / clusters[i].length;
      }
    });
  }

  const finalClusters: Array<Crime[]> = Array.from({ length: k }, () => []);
  crimes.forEach(c => {
    let minDist = Infinity, closest = 0;
    centroids.forEach((ce, i) => {
      const d = (c.latitude - ce.lat) ** 2 + (c.longitude - ce.lng) ** 2;
      if (d < minDist) { minDist = d; closest = i; }
    });
    finalClusters[closest].push(c);
  });

  const AREA_LABELS = [
    'Maninagar', 'Navrangpura', 'Satellite', 'Bopal', 'Paldi',
    'Vastrapur', 'Thaltej', 'Nikol', 'Chandkheda', 'Bapunagar',
  ];

  return finalClusters
    .map((cluster, i) => {
      if (cluster.length === 0) return null;
      const crimeTypes: Record<string, number> = {};
      cluster.forEach(c => { crimeTypes[c.crime_type] = (crimeTypes[c.crime_type] || 0) + 1; });
      return {
        latitude: centroids[i].lat,
        longitude: centroids[i].lng,
        radius: 500,
        crime_count: cluster.length,
        risk_level: cluster.length >= 15 ? 'high' : cluster.length >= 8 ? 'medium' : 'low',
        area_name: AREA_LABELS[i % AREA_LABELS.length],
        crime_types: crimeTypes,
      } as Partial<Hotspot>;
    })
    .filter((h): h is Partial<Hotspot> => h !== null && (h.crime_count || 0) >= 3)
    .sort((a, b) => (b.crime_count || 0) - (a.crime_count || 0));
}

export default function PatrolRoutes() {
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedStation, setSelectedStation] = useState(STATIONS[0]);
  const [routeName, setRouteName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routesData, hotspotsData, crimesResult] = await Promise.all([
        api.getRoutes(),
        api.getHotspots(),
        api.getCrimes({ limit: 1000 }),
      ]);
      setRoutes(routesData);
      setHotspots(hotspotsData.filter(h => h.risk_level === 'high' || h.risk_level === 'medium'));
      setCrimes(crimesResult.data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const generateRoute = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      let availableHotspots: Array<{ latitude: number; longitude: number; risk_level: string; area_name: string; crime_count: number }> = hotspots;

      if (availableHotspots.length === 0 && crimes.length > 0) {
        const detected = kMeansFromCrimes(crimes, 10);
        availableHotspots = detected.map(h => ({
          latitude: h.latitude!,
          longitude: h.longitude!,
          risk_level: h.risk_level!,
          area_name: h.area_name!,
          crime_count: h.crime_count!,
        }));

        if (detected.length > 0) {
          await api.clearHotspots();
          await api.saveHotspots(detected);
          const fresh = await api.getHotspots();
          setHotspots(fresh.filter(h => h.risk_level === 'high' || h.risk_level === 'medium'));
        }
      }

      if (availableHotspots.length === 0) {
        setErrorMsg('No crime data available. Please add some crime records first.');
        return;
      }

      const sorted = [...availableHotspots].sort((a, b) => {
        const riskPriority: Record<string, number> = { high: 0, medium: 1, low: 2 };
        return (riskPriority[a.risk_level] ?? 2) - (riskPriority[b.risk_level] ?? 2);
      });

      const ordered: typeof sorted = [];
      const remaining = [...sorted];
      let cur = { lat: selectedStation.latitude, lng: selectedStation.longitude };

      while (remaining.length > 0 && ordered.length < 8) {
        let nearestIdx = 0;
        let nearestDist = Infinity;
        remaining.forEach((h, i) => {
          const dist = calculateDistance(cur.lat, cur.lng, h.latitude, h.longitude);
          if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
        });
        const nearest = remaining.splice(nearestIdx, 1)[0];
        ordered.push(nearest);
        cur = { lat: nearest.latitude, lng: nearest.longitude };
      }

      let totalDistance = 0;
      cur = { lat: selectedStation.latitude, lng: selectedStation.longitude };
      ordered.forEach(h => {
        totalDistance += calculateDistance(cur.lat, cur.lng, h.latitude, h.longitude);
        cur = { lat: h.latitude, lng: h.longitude };
      });
      totalDistance += calculateDistance(cur.lat, cur.lng, selectedStation.latitude, selectedStation.longitude);

      const estimatedDuration = Math.round((totalDistance / 30) * 60 + ordered.length * 10);

      const waypoints = [
        { latitude: selectedStation.latitude, longitude: selectedStation.longitude, order: 0 },
        ...ordered.map((h, i) => ({ latitude: h.latitude, longitude: h.longitude, order: i + 1 })),
        { latitude: selectedStation.latitude, longitude: selectedStation.longitude, order: ordered.length + 1 },
      ];

      const newRoute: Partial<PatrolRoute> = {
        name: routeName || `Patrol Route - ${selectedStation.name}`,
        station_latitude: selectedStation.latitude,
        station_longitude: selectedStation.longitude,
        station_name: selectedStation.name,
        hotspots: ordered.map(h => ({ latitude: h.latitude, longitude: h.longitude, risk_level: h.risk_level, area_name: h.area_name })),
        waypoints,
        total_distance: Math.round(totalDistance * 100) / 100,
        estimated_duration: estimatedDuration,
        status: 'active',
      };

      await api.saveRoute(newRoute);
      setRouteName('');
      fetchData();
    } catch (error) {
      console.error('Failed to generate route:', error);
      setErrorMsg('Failed to generate route. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      await api.deleteRoute(id);
      fetchData();
    }
  };

  const totalPatrolTime = routes.reduce((sum, r) => sum + (r.estimated_duration || 0), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Patrol Routes</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Optimized patrol routing using nearest-neighbor algorithm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<Route className="w-5 h-5" />} label="Active Routes" value={routes.length} color="blue" delay={0} />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Available Hotspots" value={hotspots.length} color="orange" delay={80} />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Total Patrol Time" value={`${totalPatrolTime} min`} color="green" delay={160} />
      </div>

      {/* Generator */}
      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 card-lift animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <Navigation className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Generate New Patrol Route</h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          {hotspots.length > 0
            ? `Using ${hotspots.length} existing hotspots for routing.`
            : crimes.length > 0
            ? 'No hotspots detected — will auto-detect from crime data.'
            : 'No data available. Please add crime records first.'}
        </p>

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-500/8 border border-red-500/25 rounded-xl text-red-400 text-sm animate-pop-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Station</label>
            <select
              value={selectedStation.name}
              onChange={(e) => {
                const station = STATIONS.find(s => s.name === e.target.value);
                if (station) setSelectedStation(station);
              }}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            >
              {STATIONS.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Route Name (optional)</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              placeholder="Enter route name..."
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generateRoute}
              disabled={generating || crimes.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all w-full justify-center btn-press shadow-lg shadow-blue-500/20"
            >
              {generating ? <ButtonLoader /> : <Zap className="w-4 h-4" />}
              Generate & Save
            </button>
          </div>
        </div>

        {hotspots.length > 0 && (
          <p className="text-xs text-slate-500 mt-4">
            Hotspots to visit: {hotspots.slice(0, 8).map(h => h.area_name).join(', ')}
            {hotspots.length > 8 ? ` +${hotspots.length - 8} more` : ''}
          </p>
        )}
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        {routes.length === 0 ? (
          <div className="col-span-2 bg-slate-800/70 border border-slate-700/50 rounded-2xl p-12 text-center card-lift">
            <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mx-auto mb-4">
              <Route className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No patrol routes generated yet.</p>
            <p className="text-sm text-slate-500 mt-1">Click &quot;Generate & Save&quot; above to create an optimized patrol route.</p>
          </div>
        ) : (
          routes.map((route, idx) => (
            <div key={route.id} className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift group animate-fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="p-4 border-b border-slate-700/50 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{route.name}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{route.station_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
                    route.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                    route.status === 'completed' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                    'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                  }`}>
                    {route.status}
                  </span>
                  <button
                    onClick={() => handleDelete(route.id)}
                    className="p-2 rounded-xl hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-all btn-press"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 border-b border-slate-700/30">
                <div className="p-2.5 rounded-xl bg-slate-900/30">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Distance</p>
                  <p className="text-lg font-bold text-white">{formatDistance(route.total_distance || 0)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/30">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Duration</p>
                  <p className="text-lg font-bold text-white">{formatDuration(route.estimated_duration || 0)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/30">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">Stops</p>
                  <p className="text-lg font-bold text-white">{route.hotspots?.length || 0}</p>
                </div>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">Route Order</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-lg text-[10px] font-bold">Start</span>
                  {(route.hotspots || []).slice(0, 5).map((h, i) => (
                    <Fragment key={i}>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        h.risk_level === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'
                      }`}>
                        {h.area_name}
                      </span>
                    </Fragment>
                  ))}
                  {(route.hotspots?.length || 0) > 5 && (
                    <span className="text-slate-500 text-[10px]">+{route.hotspots.length - 5} more</span>
                  )}
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-lg text-[10px] font-bold">End</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
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
