import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Eye, EyeOff, Map, Target, AlertTriangle, TrendingUp,
  ChevronDown, ChevronRight, SlidersHorizontal, X, Layers,
  RefreshCw, ZoomIn,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { CRIME_TYPES, CITIES, CITIES_COORDINATES } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

/* ─── helpers ──────────────────────────────────────────────── */
interface Cluster {
  lat: number; lng: number; count: number;
  severity: string; crimes: Crime[];
}

function cluster(points: Crime[], grid: number): Cluster[] {
  const cells = new Map<string, Cluster>();
  for (const p of points) {
    const k = `${Math.floor(p.latitude / grid)},${Math.floor(p.longitude / grid)}`;
    if (!cells.has(k)) {
      cells.set(k, {
        lat: Math.floor(p.latitude / grid) * grid + grid / 2,
        lng: Math.floor(p.longitude / grid) * grid + grid / 2,
        count: 0, severity: 'low', crimes: [],
      });
    }
    const c = cells.get(k)!;
    c.count++;
    c.crimes.push(p);
    if (p.severity === 'critical') c.severity = 'critical';
    else if (p.severity === 'high' && c.severity !== 'critical') c.severity = 'high';
    else if (p.severity === 'medium' && c.severity === 'low') c.severity = 'medium';
  }
  return Array.from(cells.values());
}

function sevColor(s: string) {
  switch (s) {
    case 'critical': return '#ef4444';
    case 'high':     return '#f97316';
    case 'medium':   return '#eab308';
    case 'low':      return '#22c55e';
    default:         return '#64748b';
  }
}
function riskColor(r: string) {
  switch (r) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f97316';
    case 'low':    return '#22c55e';
    default:       return '#64748b';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canvas = (L as any).canvas({ padding: 0.5 });
const GUJARAT = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prev = useRef<string>('');
  useEffect(() => {
    const key = `${center[0]},${center[1]}`;
    if (prev.current !== key) {
      map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.5 });
      prev.current = key;
    }
  }, [center, zoom, map]);
  return null;
}

/* ─── Component ────────────────────────────────────────────── */
export default function CrimeMap() {
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [region, setRegion] = useState<'gujarat' | 'all'>('gujarat');
  const [crimeType, setCrimeType] = useState('');
  const [city, setCity] = useState('');
  const [_selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([api.getCrimes({ limit: 2000 }), api.getHotspots()]);
      setCrimes(c.data);
      setHotspots(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* filtered data */
  const filtered = useMemo(() => crimes.filter((c) => {
    if (region === 'gujarat' && !GUJARAT.includes(c.city)) return false;
    if (city && c.city !== city) return false;
    if (crimeType && c.crime_type !== crimeType) return false;
    return true;
  }), [crimes, region, city, crimeType]);

  const filteredHotspots = useMemo(() => hotspots.filter((h) => {
    if (city) return h.area_name.toLowerCase().includes(city.toLowerCase());
    if (region === 'gujarat') return GUJARAT.some((g) => h.area_name.toLowerCase().includes(g.toLowerCase()));
    return true;
  }), [hotspots, region, city]);

  /* clusters (coarser = faster) */
  const clusters = useMemo(() => cluster(filtered, 0.08), [filtered]);

  const mapCenter: [number, number] = useMemo(() =>
    city && CITIES_COORDINATES[city]
      ? [CITIES_COORDINATES[city].lat, CITIES_COORDINATES[city].lng]
      : region === 'gujarat' ? [22.3, 72.1] : [22.97, 78.65],
    [city, region]);

  const mapZoom = city ? 11 : region === 'gujarat' ? 7 : 5;

  /* summary stats */
  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((c) => { m[c.crime_type] = (m[c.crime_type] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  const bySeverity = useMemo(() => {
    const m: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    filtered.forEach((c) => { m[c.severity] = (m[c.severity] || 0) + 1; });
    return m;
  }, [filtered]);

  const reset = () => { setCrimeType(''); setCity(''); };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col gap-0 animate-fade-in">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pb-3 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crime Map</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time crime intelligence and hotspot analysis</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region pills */}
          <div className="flex rounded-xl bg-slate-800/60 border border-slate-700/50 p-1 gap-1">
            {(['gujarat', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRegion(r); setCity(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all btn-press ${region === r ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                {r === 'gujarat' ? 'Gujarat' : 'All India'}
              </button>
            ))}
          </div>
          {/* Crime type */}
          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value)}
            className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Types</option>
            {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* City */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {(region === 'gujarat' ? GUJARAT : CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(crimeType || city) && (
            <button onClick={reset} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all btn-press">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all btn-press">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs font-semibold text-slate-300 hover:text-white transition-all btn-press"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Stats
            {sidebarOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex flex-1 gap-4 min-h-0">

        {/* ── Map ─────────────────────────────────────────── */}
        <div className="relative flex-1 min-w-0 overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/30">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            scrollWheelZoom
            zoomControl={false}
            preferCanvas
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              keepBuffer={6}
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              pane="shadowPane"
            />
            <FlyTo center={mapCenter} zoom={mapZoom} />

            {/* Crime clusters */}
            {showCrimes && clusters.map((cl, i) => {
              const col = sevColor(cl.severity);
              const r = cl.count === 1 ? 5 : Math.min(5 + Math.sqrt(cl.count) * 2.5, 30);
              return (
                <CircleMarker
                  key={i}
                  center={[cl.lat, cl.lng]}
                  radius={r}
                  renderer={canvas}
                  pathOptions={{
                    color: col,
                    fillColor: col,
                    fillOpacity: cl.count > 1 ? 0.6 : 0.8,
                    weight: cl.count > 5 ? 2 : 1,
                  }}
                  eventHandlers={{ click: () => setSelectedCluster(cl) }}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[180px]">
                      <p className="font-bold text-white text-sm">{cl.count === 1 ? cl.crimes[0].crime_type : `${cl.count} Incidents`}</p>
                      {cl.count === 1 ? (
                        <>
                          <p className="text-slate-300 text-xs">{cl.crimes[0].area_name}, {cl.crimes[0].city}</p>
                          <p className="text-slate-400 text-xs">{cl.crimes[0].crime_date} · {cl.crimes[0].crime_time}</p>
                          {cl.crimes[0].description && (
                            <p className="text-slate-400 text-xs border-t border-slate-700 pt-1 mt-1">{cl.crimes[0].description}</p>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-slate-300 space-y-0.5">
                          {Object.entries(cl.crimes.reduce((acc, c) => { acc[c.crime_type] = (acc[c.crime_type] || 0) + 1; return acc; }, {} as Record<string, number>))
                            .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => (
                              <div key={t} className="flex justify-between gap-3"><span>{t}</span><span className="text-slate-400">{n}</span></div>
                            ))}
                        </div>
                      )}
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: col + '33', color: col, border: `1px solid ${col}66` }}>
                        {cl.severity}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {/* Hotspot rings */}
            {showHotspots && filteredHotspots.map((hs) => {
              const col = riskColor(hs.risk_level);
              return (
                <Circle
                  key={hs.id}
                  center={[hs.latitude, hs.longitude]}
                  radius={hs.radius || 1200}
                  renderer={canvas}
                  pathOptions={{
                    color: col,
                    fillColor: col,
                    fillOpacity: 0.1,
                    weight: hs.risk_level === 'high' ? 2.5 : 1.5,
                    dashArray: hs.risk_level !== 'high' ? '6 5' : undefined,
                  }}
                >
                  <Popup>
                    <div className="space-y-1.5 min-w-[160px]">
                      <p className="font-bold text-white text-sm">{hs.area_name}</p>
                      <p className="text-slate-300 text-xs">{hs.crime_count} crimes recorded</p>
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: col + '33', color: col, border: `1px solid ${col}66` }}>
                        {hs.risk_level} risk
                      </span>
                    </div>
                  </Popup>
                </Circle>
              );
            })}
          </MapContainer>

          {/* Toggle buttons inside map */}
          <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => setShowCrimes((s) => !s)}
              className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press shadow-lg ${showCrimes ? 'bg-blue-600/85 border-blue-500/50 text-white' : 'bg-slate-900/75 border-slate-600/50 text-slate-400'}`}
            >
              {showCrimes ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Crimes ({filtered.length})
            </button>
            <button
              onClick={() => setShowHotspots((s) => !s)}
              className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press shadow-lg ${showHotspots ? 'bg-orange-600/85 border-orange-500/50 text-white' : 'bg-slate-900/75 border-slate-600/50 text-slate-400'}`}
            >
              {showHotspots ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Zones ({filteredHotspots.length})
            </button>
          </div>

          {/* Cluster count indicator */}
          <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            <span>{clusters.length} clusters from {filtered.length} incidents</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-slate-900/85 backdrop-blur border border-slate-700/50 px-3 py-2.5 text-xs space-y-1">
            <p className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5"><ZoomIn className="h-3 w-3 text-blue-400" /> Zoom to uncrowd</p>
            {[['#ef4444','Critical'],['#f97316','High'],['#eab308','Medium'],['#22c55e','Low']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-2 text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c }} />
                {l}
              </div>
            ))}
            <div className="flex items-center gap-2 text-slate-400 border-t border-slate-700/50 pt-1 mt-1">
              <span className="h-2.5 w-2.5 rounded-full border border-dashed border-orange-400 shrink-0" />
              Hotspot zone
            </div>
          </div>

          {/* Attribution */}
          <div className="absolute bottom-3 right-3 z-[1000] text-[10px] text-slate-600">
            &copy; OpenStreetMap &copy; CARTO
          </div>
        </div>

        {/* ── Stats Sidebar ─────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-72 flex flex-col gap-3 overflow-y-auto shrink-0 pr-0.5 animate-fade-in-right" style={{ maxHeight: '100%' }}>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/15"><Map className="h-4 w-4 text-blue-400" /></div>
                <h3 className="text-sm font-semibold text-white">Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: filtered.length, color: 'text-blue-400' },
                  { label: 'Hotspots', value: filteredHotspots.length, color: 'text-orange-400' },
                  { label: 'Critical', value: bySeverity.critical, color: 'text-red-400' },
                  { label: 'High', value: bySeverity.high, color: 'text-orange-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-slate-900/60 px-3 py-2.5 text-center">
                    <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity breakdown */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-red-500/15"><AlertTriangle className="h-4 w-4 text-red-400" /></div>
                <h3 className="text-sm font-semibold text-white">By Severity</h3>
              </div>
              <div className="space-y-2.5">
                {(['critical', 'high', 'medium', 'low'] as const).map((s) => {
                  const v = bySeverity[s] || 0;
                  const pct = filtered.length ? Math.round((v / filtered.length) * 100) : 0;
                  const col = sevColor(s);
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold capitalize text-slate-300">{s}</span>
                        <span className="text-xs tabular-nums font-bold" style={{ color: col }}>{v}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}88, ${col})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top crime types */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-500/15"><TrendingUp className="h-4 w-4 text-purple-400" /></div>
                <h3 className="text-sm font-semibold text-white">Top Crime Types</h3>
              </div>
              {byType.length > 0 ? (
                <div className="space-y-2">
                  {byType.map(([type, count], i) => {
                    const pct = filtered.length ? Math.round((count / filtered.length) * 100) : 0;
                    const hue = ['#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316','#22c55e'][i];
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300 truncate max-w-[70%]">{type}</span>
                          <span className="text-xs font-semibold text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: hue }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No data</p>
              )}
            </div>

            {/* Hotspot list */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/70 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-orange-500/15"><Target className="h-4 w-4 text-orange-400" /></div>
                <h3 className="text-sm font-semibold text-white">Active Zones</h3>
              </div>
              {filteredHotspots.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredHotspots.slice(0, 8).map((hs) => {
                    const col = riskColor(hs.risk_level);
                    return (
                      <div key={hs.id} className="flex items-center gap-2.5 rounded-xl bg-slate-900/50 px-2.5 py-2 hover:bg-slate-700/40 transition-colors">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{hs.area_name}</p>
                          <p className="text-[11px] text-slate-500">{hs.crime_count} crimes</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase rounded-full px-1.5 py-0.5" style={{ color: col, background: col + '20', border: `1px solid ${col}40` }}>
                          {hs.risk_level[0].toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                  {filteredHotspots.length > 8 && (
                    <p className="text-center text-xs text-slate-500 pt-1">+{filteredHotspots.length - 8} more</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No hotspots found</p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
