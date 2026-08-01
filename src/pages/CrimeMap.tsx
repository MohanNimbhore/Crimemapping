import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import {
  Eye, EyeOff, Map as MapIcon, Target, AlertTriangle, TrendingUp,
  X, Layers, RefreshCw, ZoomIn, Shield, Activity, BarChart3,
  ChevronRight, Flame,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { CRIME_TYPES, CITIES, CITIES_COORDINATES } from '../types';
import { PageLoader } from '../components/ui/LoadingSpinner';
import 'ol/ol.css';

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

const GUJARAT = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];
const TYPE_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316','#22c55e','#eab308','#ef4444'];

/* ─── Main Component ────────────────────────────────────────── */
export default function CrimeMap() {
  const mapRef   = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const olMap    = useRef<OLMap | null>(null);
  const crimeLayerRef   = useRef<VectorLayer<VectorSource> | null>(null);
  const hotspotLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const overlayRef      = useRef<Overlay | null>(null);

  const [loading, setLoading]       = useState(true);
  const [crimes, setCrimes]         = useState<Crime[]>([]);
  const [hotspots, setHotspots]     = useState<Hotspot[]>([]);
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [region, setRegion]         = useState<'gujarat' | 'all'>('gujarat');
  const [crimeType, setCrimeType]   = useState('');
  const [city, setCity]             = useState('');

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

  const topHotspot = [...filteredHotspots].sort((a, b) => (b.crime_count || 0) - (a.crime_count || 0))[0];

  const reset = () => { setCrimeType(''); setCity(''); };

  /* ── Init OpenLayers map ─────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current || olMap.current) return;

    

    const crimeSource   = new VectorSource();
    const hotspotSource = new VectorSource();

    crimeLayerRef.current   = new VectorLayer({ source: crimeSource,   zIndex: 2 });
    hotspotLayerRef.current = new VectorLayer({ source: hotspotSource, zIndex: 1 });

    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      stopEvent: false,
    });
    overlayRef.current = popup;

    olMap.current = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        hotspotLayerRef.current,
        crimeLayerRef.current,
      ],
      overlays: [popup],
      view: new View({
        center: fromLonLat([72.1, 22.3]),
        zoom: 7,
        enableRotation: false,
      }),
      controls: [],
    });

    olMap.current.on('click', (evt) => {
      const feature = olMap.current!.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 6 });
      if (feature) {
        const html = feature.get('html');
        if (html && popupRef.current) {
          const geom = feature.getGeometry();
          const coord = geom instanceof Point ? (geom as Point).getCoordinates() : evt.coordinate;
          popup.setPosition(coord);
          popupRef.current.innerHTML = html;
          popupRef.current.style.display = 'block';
        }
      } else {
        popup.setPosition(undefined);
        if (popupRef.current) popupRef.current.style.display = 'none';
      }
    });

    olMap.current.on('pointermove', (evt) => {
      const hit = olMap.current!.hasFeatureAtPixel(evt.pixel, { hitTolerance: 6 });
      if (mapRef.current) mapRef.current.style.cursor = hit ? 'pointer' : '';
    });

    const observer = new MutationObserver(() => {
      olMap.current?.updateSize();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const resizeObserver = new ResizeObserver(() => {
      olMap.current?.updateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
      olMap.current?.setTarget(undefined);
      olMap.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fly to new center ───────────────────────────────────── */
  useEffect(() => {
    olMap.current?.getView().animate({
      center: fromLonLat([mapCenter[1], mapCenter[0]]),
      zoom: mapZoom,
      duration: 800,
    });
  }, [mapCenter, mapZoom]);

  /* ── Sync crime features ─────────────────────────────────── */
  useEffect(() => {
    if (!crimeLayerRef.current) return;
    const source = crimeLayerRef.current.getSource()!;
    source.clear();
    clusters.forEach((cl) => {
      const col = sevColor(cl.severity);
      const r = cl.count === 1 ? 6 : Math.min(6 + Math.sqrt(cl.count) * 2.8, 28);
      const f = new Feature({ geometry: new Point(fromLonLat([cl.lng, cl.lat])) });
      f.setStyle(new Style({
        image: new CircleStyle({
          radius: r,
          fill: new Fill({ color: col + (cl.count === 1 ? 'cc' : '99') }),
          stroke: new Stroke({ color: col, width: cl.count > 5 ? 2 : 1 }),
        }),
        ...(cl.count > 1 ? {
          text: new Text({
            text: String(cl.count),
            fill: new Fill({ color: '#fff' }),
            font: `bold ${Math.min(10 + cl.count, 13)}px sans-serif`,
          }),
        } : {}),
      }));
      const typeMap = cl.crimes.reduce((acc, c) => {
        acc[c.crime_type] = (acc[c.crime_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topTypes = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
      f.set('html', `
        <div style="min-width:180px" class="space-y-1.5">
          <p style="font-weight:700;font-size:13px;color:#0f172a">${cl.count === 1 ? cl.crimes[0].crime_type : `${cl.count} Incidents`}</p>
          ${cl.count === 1 ? `
            <p style="font-size:11px;color:#475569">${cl.crimes[0].area_name}, ${cl.crimes[0].city}</p>
            <p style="font-size:11px;color:#64748b">${cl.crimes[0].crime_date} · ${cl.crimes[0].crime_time}</p>
          ` : topTypes.map(([t, n]) => `
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569"><span>${t}</span><span style="font-weight:600">${n}</span></div>
          `).join('')}
          <span style="display:inline-block;border-radius:9999px;padding:1px 8px;font-size:10px;font-weight:700;text-transform:uppercase;background:${col}33;color:${col};border:1px solid ${col}66">${cl.severity}</span>
        </div>
      `);
      source.addFeature(f);
    });
  }, [clusters]);

  /* ── Sync hotspot features ───────────────────────────────── */
  useEffect(() => {
    if (!hotspotLayerRef.current) return;
    const source = hotspotLayerRef.current.getSource()!;
    source.clear();
    filteredHotspots.forEach((hs) => {
      const col = riskColor(hs.risk_level);
      // Circle geometry in EPSG:3857 uses metres
      const center3857 = fromLonLat([hs.longitude, hs.latitude]);
      const radiusM = hs.radius || 1200;
      const f = new Feature({ geometry: new Circle(center3857, radiusM) });
      f.setStyle(new Style({
        fill: new Fill({ color: col + '1a' }),
        stroke: new Stroke({
          color: col,
          width: hs.risk_level === 'high' ? 2.5 : 1.5,
          lineDash: hs.risk_level !== 'high' ? [6, 5] : undefined,
        }),
      }));
      // Use a point feature for click detection (circles aren't hit-tested well)
      const pt = new Feature({ geometry: new Point(center3857) });
      pt.setStyle(new Style({ image: new CircleStyle({ radius: 0, fill: new Fill({ color: 'transparent' }) }) }));
      pt.set('html', `
        <div style="min-width:150px" class="space-y-1">
          <p style="font-weight:700;font-size:13px;color:#0f172a">${hs.area_name}</p>
          <p style="font-size:11px;color:#475569">${hs.crime_count} crimes recorded</p>
          <span style="display:inline-block;border-radius:9999px;padding:1px 8px;font-size:10px;font-weight:700;text-transform:uppercase;background:${col}33;color:${col};border:1px solid ${col}66">${hs.risk_level} risk</span>
        </div>
      `);
      source.addFeature(f);
      source.addFeature(pt);
    });
  }, [filteredHotspots]);

  /* ── Toggle layers ───────────────────────────────────────── */
  useEffect(() => { crimeLayerRef.current?.setVisible(showCrimes); }, [showCrimes]);
  useEffect(() => { hotspotLayerRef.current?.setVisible(showHotspots); }, [showHotspots]);

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
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/20">
              <MapIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Crime Intelligence Map</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-12">Real-time incident tracking · Hotspot analysis · Predictive zones</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 p-1 gap-1">
            {(['gujarat', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRegion(r); setCity(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                  region === r
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'gujarat' ? 'Gujarat' : 'All India'}
              </button>
            ))}
          </div>

          <select
            value={crimeType}
            onChange={(e) => setCrimeType(e.target.value)}
            className="rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Crime Types</option>
            {CRIME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="">All Cities</option>
            {(region === 'gujarat' ? GUJARAT : CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {(crimeType || city) && (
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-all btn-press">
              <X className="h-3 w-3" /> Clear
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2 rounded-xl glass-deep border border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-all btn-press"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden map-frame" style={{ height: '62vh', minHeight: 380 }}>

        <div ref={mapRef} className="h-full w-full" />

        {/* Popup */}
        <div
          ref={popupRef}
          className="absolute z-50 hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl px-3 py-2.5"
          style={{ transform: 'translateX(-50%)', pointerEvents: 'none' }}
        />

        {/* Floating badge – top left */}
        <div className="absolute left-4 top-4 z-[100] flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-medium neon-pulse">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-900 dark:text-white font-semibold">{filtered.length}</span>
          <span className="text-slate-500 dark:text-slate-400">incidents</span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-900 dark:text-white font-semibold">{clusters.length}</span>
          <span className="text-slate-500 dark:text-slate-400">clusters</span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-900 dark:text-white font-semibold">{filteredHotspots.length}</span>
          <span className="text-slate-500 dark:text-slate-400">zones</span>
        </div>

        {/* Layer toggles – top right */}
        <div className="absolute right-4 top-4 z-[100] flex flex-col gap-2">
          <button
            onClick={() => setShowCrimes((s) => !s)}
            className={`flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-semibold transition-all btn-press border ${
              showCrimes
                ? 'border-blue-500/40 text-slate-900 dark:text-white bg-blue-600/10 dark:bg-blue-600/20'
                : 'border-slate-300 dark:border-slate-600/40 text-slate-500 dark:text-slate-400'
            }`}
          >
            {showCrimes ? <Eye className="h-3.5 w-3.5 text-blue-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            Crimes
          </button>
          <button
            onClick={() => setShowHotspots((s) => !s)}
            className={`flex items-center gap-2 map-overlay rounded-xl px-3 py-2 text-xs font-semibold transition-all btn-press border ${
              showHotspots
                ? 'border-orange-500/40 text-slate-900 dark:text-white bg-orange-600/10 dark:bg-orange-600/20'
                : 'border-slate-300 dark:border-slate-600/40 text-slate-500 dark:text-slate-400'
            }`}
          >
            {showHotspots ? <Eye className="h-3.5 w-3.5 text-orange-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            Zones
          </button>
        </div>

        {/* Legend – bottom left */}
        <div className="absolute bottom-4 left-4 z-[100] map-overlay rounded-xl px-3 py-2.5 text-xs space-y-1.5">
          <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
            <ZoomIn className="h-3 w-3 text-blue-400" /> Severity
          </p>
          {[['#ef4444','Critical'],['#f97316','High'],['#eab308','Medium'],['#22c55e','Low']].map(([col, lbl]) => (
            <div key={lbl} className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
              {lbl}
            </div>
          ))}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50 pt-1.5 mt-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-orange-400 shrink-0" />
            Hotspot
          </div>
        </div>

        {/* Attribution */}
        <div className="absolute bottom-4 right-4 z-[100] text-[10px] text-slate-400 dark:text-slate-600">
          © OpenStreetMap © CARTO
        </div>
      </div>

      {/* ── Bottom Summary Panel ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Stat cards */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {[
            { icon: <Activity className="h-5 w-5" />, label: 'Total Crimes',   value: filtered.length,          color: '#3b82f6', glow: 'glow-blue',   border: 'border-blue-500/20' },
            { icon: <Flame className="h-5 w-5" />,    label: 'Critical',        value: bySeverity.critical,      color: '#ef4444', glow: 'glow-red',    border: 'border-red-500/20' },
            { icon: <AlertTriangle className="h-5 w-5" />, label: 'High Risk',  value: bySeverity.high,          color: '#f97316', glow: 'glow-orange', border: 'border-orange-500/20' },
            { icon: <Target className="h-5 w-5" />,   label: 'Hotspot Zones',   value: filteredHotspots.length,  color: '#8b5cf6', glow: 'glow-purple', border: 'border-purple-500/20' },
          ].map(({ icon, label, value, color, glow, border }) => (
            <div key={label} className={`card-3d glass-deep rounded-2xl border ${border} ${glow} p-4 flex flex-col gap-3 cursor-default`}>
              <div className="flex items-center justify-between">
                <span style={{ color }} className="opacity-80">{icon}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums tracking-tight stat-3d" style={{ color }}>
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Severity breakdown */}
        <div className="lg:col-span-3 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/20">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Severity Breakdown</h3>
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
                      <span className="text-[10px] text-slate-500 dark:text-slate-500">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}60, ${col})`, boxShadow: `0 0 8px ${col}60` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top crime types */}
        <div className="lg:col-span-3 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Top Crime Types</h3>
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
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}60` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No data available</p>
          )}
        </div>

        {/* Hot zones */}
        <div className="lg:col-span-2 glass-deep rounded-2xl border border-slate-200 dark:border-slate-700/40 p-4 card-3d">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-orange-500/15 border border-orange-500/20">
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hot Zones</h3>
          </div>
          {filteredHotspots.length > 0 ? (
            <div className="space-y-2">
              {filteredHotspots.slice(0, 5).map((hs) => {
                const col = riskColor(hs.risk_level);
                const isTop = hs.id === topHotspot?.id;
                return (
                  <div key={hs.id} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all ${isTop ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700/40'}`}>
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
