import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Eye, EyeOff, Map as MapIcon, Target, AlertTriangle, TrendingUp,
  X, Layers, RefreshCw, ZoomIn, Shield, Activity, BarChart3,
  ChevronRight, Flame,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { CRIME_TYPES, CITIES, CITIES_COORDINATES } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

/* ─── Helpers ───────────────────────────────────────────────── */
interface Cluster {
  lat: number; lng: number; count: number;
  severity: string; crimes: Crime[];
}

function clusterCrimes(points: Crime[], grid: number): Cluster[] {
  const cells = new globalThis.Map<string, Cluster>();
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
const leafletCanvas = (L as any).canvas({ padding: 0.5 });
const GUJARAT = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

const TYPE_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316','#22c55e','#eab308','#ef4444'];

function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prev = useRef('');
  useEffect(() => {
    const key = `${center[0]},${center[1]}`;
    if (prev.current !== key) {
      map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.5 });
      prev.current = key;
    }
  }, [center, zoom, map]);
  return null;
}

/* ─── Main Component ────────────────────────────────────────── */
export default function CrimeMap() {
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [region, setRegion] = useState<'gujarat' | 'all'>('gujarat');
  const [crimeType, setCrimeType] = useState('');
  const [city, setCity] = useState('');

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

  const clusters = useMemo(() => clusterCrimes(filtered, 0.08), [filtered]);

  const mapCenter: [number, number] = useMemo(() =>
    city && CITIES_COORDINATES[city]
      ? [CITIES_COORDINATES[city].lat, CITIES_COORDINATES[city].lng]
      : region === 'gujarat' ? [22.3, 72.1] : [22.97, 78.65],
    [city, region]);

  const mapZoom = city ? 11 : region === 'gujarat' ? 7 : 5;

  const bySeverity = useMemo(() => {
    const m: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    filtered.forEach((c) => { m[c.severity] = (m[c.severity] || 0) + 1; });
    return m;
  }, [filtered]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((c) => { m[c.crime_type] = (m[c.crime_type] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const topHotspot = filteredHotspots.sort((a, b) => (b.crime_count || 0) - (a.crime_count || 0))[0];

  const reset = () => { setCrimeType(''); setCity(''); };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ minHeight: 'calc(100vh - 80px)' }}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/15 glow-blue border border-blue-500/20">
              <MapIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Crime Intelligence Map</h1>
          </div>
          <p className="text-sm text-slate-400 ml-12">Real-time incident tracking · Hotspot analysis · Predictive zones</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 p-1 gap-1">
            {(['gujarat', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRegion(r); setCity(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                  region === r
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 glow-blue'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'gujarat' ? 'Gujarat' : 'All India'}
              </button>
            ))}
          </div>

          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value)}
            className="rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 focus:glow-blue appearance-none cursor-pointer"
          >
            <option value="">All Crime Types</option>
            {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 px-3 py-2 text-xs text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {(region === 'gujarat' ? GUJARAT : CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {(crimeType || city) && (
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all btn-press neon-pulse-red">
              <X className="h-3 w-3" /> Clear
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2 rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 text-slate-400 hover:text-blue-400 transition-all btn-press"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Map (full width) ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden map-frame scanlines" style={{ height: '62vh', minHeight: 380 }}>

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

          {showCrimes && clusters.map((cl, i) => {
            const col = sevColor(cl.severity);
            const r = cl.count === 1 ? 5 : Math.min(5 + Math.sqrt(cl.count) * 2.8, 32);
            return (
              <CircleMarker
                key={i}
                center={[cl.lat, cl.lng]}
                radius={r}
                renderer={leafletCanvas}
                pathOptions={{
                  color: col,
                  fillColor: col,
                  fillOpacity: cl.count > 1 ? 0.6 : 0.85,
                  weight: cl.count > 5 ? 2 : 1,
                }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[190px]">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {cl.count === 1 ? cl.crimes[0].crime_type : `${cl.count} Incidents`}
                    </p>
                    {cl.count === 1 ? (
                      <>
                        <p className="text-slate-600 dark:text-slate-300 text-xs">{cl.crimes[0].area_name}, {cl.crimes[0].city}</p>
                        <p className="text-slate-400 text-xs">{cl.crimes[0].crime_date} · {cl.crimes[0].crime_time}</p>
                        {cl.crimes[0].description && (
                          <p className="text-slate-400 text-xs border-t border-slate-700 pt-1">{cl.crimes[0].description}</p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-0.5">
                        {Object.entries(
                          cl.crimes.reduce((acc, c) => { acc[c.crime_type] = (acc[c.crime_type] || 0) + 1; return acc; }, {} as Record<string, number>)
                        ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => (
                          <div key={t} className="flex justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <span>{t}</span><span className="text-slate-400 font-semibold">{n}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: col + '33', color: col, border: `1px solid ${col}66` }}>
                      {cl.severity}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {showHotspots && filteredHotspots.map((hs) => {
            const col = riskColor(hs.risk_level);
            return (
              <Circle
                key={hs.id}
                center={[hs.latitude, hs.longitude]}
                radius={hs.radius || 1200}
                renderer={leafletCanvas}
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
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{hs.area_name}</p>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">{hs.crime_count} crimes recorded</p>
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: col + '33', color: col, border: `1px solid ${col}66` }}>
                      {hs.risk_level} risk
                    </span>
                  </div>
                </Popup>
              </Circle>
            );
          })}
        </MapContainer>

        {/* ── Floating top-left info badge ─── */}
        <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-medium text-slate-200 neon-pulse">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-900 dark:text-white font-semibold">{filtered.length}</span>
          <span className="text-slate-400">incidents</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-slate-900 dark:text-white font-semibold">{clusters.length}</span>
          <span className="text-slate-400">clusters</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-slate-900 dark:text-white font-semibold">{filteredHotspots.length}</span>
          <span className="text-slate-400">zones</span>
        </div>

        {/* ── Layer toggles top-right ─── */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => setShowCrimes((s) => !s)}
            className={`flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-semibold transition-all btn-press border ${
              showCrimes
                ? 'border-blue-500/40 text-white bg-blue-600/20'
                : 'border-slate-600/40 text-slate-400 hover:text-white'
            }`}
          >
            {showCrimes ? <Eye className="h-3.5 w-3.5 text-blue-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            Crimes
          </button>
          <button
            onClick={() => setShowHotspots((s) => !s)}
            className={`flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-semibold transition-all btn-press border ${
              showHotspots
                ? 'border-orange-500/40 text-white bg-orange-600/20'
                : 'border-slate-600/40 text-slate-400 hover:text-white'
            }`}
          >
            {showHotspots ? <Eye className="h-3.5 w-3.5 text-orange-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            Zones
          </button>
        </div>

        {/* ── Legend bottom-left ─── */}
        <div className="absolute bottom-4 left-4 z-[1000] map-overlay rounded-xl px-3 py-2.5 text-xs space-y-1.5">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
            <ZoomIn className="h-3 w-3 text-blue-400" /> Severity
          </p>
          {[['#ef4444','Critical'],['#f97316','High'],['#eab308','Medium'],['#22c55e','Low']].map(([col, lbl]) => (
            <div key={lbl} className="flex items-center gap-2 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              {lbl}
            </div>
          ))}
          <div className="flex items-center gap-2 text-slate-400 border-t border-slate-200 dark:border-slate-700/50 pt-1.5 mt-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-orange-400 shrink-0" />
            Hotspot
          </div>
        </div>

        {/* ── Attribution ─── */}
        <div className="absolute bottom-4 right-4 z-[1000] text-[10px] text-slate-600">
          &copy; OpenStreetMap &copy; CARTO
        </div>
      </div>

      {/* ── Bottom Summary Panel ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Stat cards (4-col) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {[
            { icon: <Activity className="h-5 w-5" />, label: 'Total Crimes', value: filtered.length, color: '#3b82f6', glow: 'glow-blue', border: 'border-blue-500/20' },
            { icon: <Flame className="h-5 w-5" />,    label: 'Critical',     value: bySeverity.critical, color: '#ef4444', glow: 'glow-red',    border: 'border-red-500/20 neon-pulse-red' },
            { icon: <AlertTriangle className="h-5 w-5" />, label: 'High Risk', value: bySeverity.high, color: '#f97316', glow: 'glow-orange', border: 'border-orange-500/20' },
            { icon: <Target className="h-5 w-5" />,   label: 'Hotspot Zones', value: filteredHotspots.length, color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
          ].map(({ icon, label, value, color, glow, border }) => (
            <div
              key={label}
              className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-4 flex flex-col gap-3 cursor-default`}
            >
              <div className="flex items-center justify-between">
                <span style={{ color }} className="opacity-80">{icon}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div>
                <p
                  className="text-3xl font-bold tabular-nums tracking-tight stat-3d"
                  style={{ color }}
                >
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Severity breakdown (3-col) */}
        <div className="lg:col-span-3 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Severity Breakdown</h3>
          </div>
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map((s) => {
              const v = bySeverity[s] || 0;
              const pct = filtered.length ? Math.round((v / filtered.length) * 100) : 0;
              const col = sevColor(s);
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize">{s}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tabular-nums" style={{ color: col }}>{v}</span>
                      <span className="text-[10px] text-slate-600">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${col}60, ${col})`,
                        boxShadow: `0 0 8px ${col}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crime types (3-col) */}
        <div className="lg:col-span-3 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Top Crime Types</h3>
          </div>
          {byType.length > 0 ? (
            <div className="space-y-2.5">
              {byType.slice(0, 5).map(([type, count], i) => {
                const pct = filtered.length ? Math.round((count / filtered.length) * 100) : 0;
                const col = TYPE_COLORS[i % TYPE_COLORS.length];
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[68%]">{type}</span>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: col }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}60` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No data available</p>
          )}
        </div>

        {/* Active hotspots (2-col) */}
        <div className="lg:col-span-2 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/20">
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Hot Zones</h3>
          </div>
          {filteredHotspots.length > 0 ? (
            <div className="space-y-2">
              {filteredHotspots.slice(0, 5).map((hs) => {
                const col = riskColor(hs.risk_level);
                const isTop = hs.id === topHotspot?.id;
                return (
                  <div
                    key={hs.id}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all ${isTop ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-100/60 dark:bg-slate-800/40 hover:bg-slate-700/40'}`}
                  >
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate leading-tight">{hs.area_name}</p>
                      <p className="text-[10px] text-slate-500">{hs.crime_count} crimes</p>
                    </div>
                  </div>
                );
              })}
              {filteredHotspots.length > 5 && (
                <p className="text-center text-[11px] text-slate-500 pt-1">+{filteredHotspots.length - 5} more zones</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No zones found</p>
          )}
        </div>

      </div>
    </div>
  );
}
