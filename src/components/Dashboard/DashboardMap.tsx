import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap, CircleMarker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff, Maximize2, Layers } from 'lucide-react';
import type { Crime, Hotspot } from '../../types';
import 'leaflet/dist/leaflet.css';

interface DashboardMapProps {
  crimes: Crime[];
  hotspots: Hotspot[];
  center: [number, number];
}

/** Groups points into grid cells and returns cluster centroids. */
function clusterPoints(points: Crime[], gridSize: number): ClusterPoint[] {
  const cells = new Map<string, { lat: number; lng: number; count: number; severity: string; crimes: Crime[] }>();

  for (const p of points) {
    const cellLat = Math.floor(p.latitude / gridSize) * gridSize;
    const cellLng = Math.floor(p.longitude / gridSize) * gridSize;
    const key = `${cellLat},${cellLng}`;
    if (!cells.has(key)) {
      cells.set(key, { lat: cellLat + gridSize / 2, lng: cellLng + gridSize / 2, count: 0, severity: 'low', crimes: [] });
    }
    const cell = cells.get(key)!;
    cell.count++;
    cell.crimes.push(p);
    // escalate severity
    if (p.severity === 'critical' || (p.severity === 'high' && cell.severity !== 'critical')) cell.severity = p.severity;
    else if (p.severity === 'medium' && cell.severity === 'low') cell.severity = p.severity;
  }

  return Array.from(cells.values());
}

interface ClusterPoint {
  lat: number;
  lng: number;
  count: number;
  severity: string;
  crimes: Crime[];
}

function severityColor(s: string) {
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
const canvasRenderer = (L as any).canvas({ padding: 0.5 });

function FlyToCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef<[number, number]>(center);
  useEffect(() => {
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      map.flyTo(center, 7, { duration: 1.0, easeLinearity: 0.5 });
      prevCenter.current = center;
    }
  }, [center, map]);
  return null;
}

export default function DashboardMap({ crimes, hotspots, center }: DashboardMapProps) {
  const navigate = useNavigate();
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  // Cluster crimes into grid cells (fast, no extra lib)
  const clusters = useMemo(() => clusterPoints(crimes.slice(0, 300), 0.15), [crimes]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl={false}
        preferCanvas
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
          maxZoom={19}
          keepBuffer={4}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          attribution=""
          maxZoom={19}
          pane="shadowPane"
        />

        <FlyToCenter center={center} />

        {/* Crime clusters */}
        {showCrimes && clusters.map((cl, i) => {
          const color = severityColor(cl.severity);
          const r = cl.count === 1 ? 6 : Math.min(6 + Math.log2(cl.count) * 4, 28);
          return (
            <CircleMarker
              key={i}
              center={[cl.lat, cl.lng]}
              radius={r}
              renderer={canvasRenderer}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: cl.count === 1 ? 0.75 : 0.65,
                weight: cl.count === 1 ? 1 : 1.5,
                stroke: true,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold text-slate-900 dark:text-white">{cl.count === 1 ? cl.crimes[0].crime_type : `${cl.count} crimes`}</p>
                  {cl.count === 1 ? (
                    <>
                      <p className="text-slate-300">{cl.crimes[0].area_name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{cl.crimes[0].crime_date}</p>
                    </>
                  ) : (
                    <p className="text-slate-300 text-xs">Top: {cl.crimes[0].crime_type}</p>
                  )}
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: color + '33', color, border: `1px solid ${color}66` }}
                  >
                    {cl.severity}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Hotspot rings */}
        {showHotspots && hotspots.map((hs) => {
          const color = riskColor(hs.risk_level);
          return (
            <Circle
              key={hs.id}
              center={[hs.latitude, hs.longitude]}
              radius={hs.radius || 1000}
              renderer={canvasRenderer}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.12,
                weight: hs.risk_level === 'high' ? 2 : 1.5,
                dashArray: hs.risk_level !== 'high' ? '5 5' : undefined,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold text-slate-900 dark:text-white">{hs.area_name}</p>
                  <p className="text-slate-300">{hs.crime_count} crimes</p>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: color + '33', color, border: `1px solid ${color}66` }}
                  >
                    {hs.risk_level} risk
                  </span>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {/* Controls — top right */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={() => setShowCrimes((s) => !s)}
          className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press ${showCrimes ? 'bg-blue-600/80 border-blue-500/60 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/70 border-slate-600/50 text-slate-400 hover:text-white'}`}
        >
          {showCrimes ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Crimes
        </button>
        <button
          onClick={() => setShowHotspots((s) => !s)}
          className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press ${showHotspots ? 'bg-orange-600/80 border-orange-500/60 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-900/70 border-slate-600/50 text-slate-400 hover:text-white'}`}
        >
          {showHotspots ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Hotspots
        </button>
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900/70 backdrop-blur border border-slate-600/50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-white hover:bg-slate-800/70 transition-all btn-press"
        >
          <Maximize2 className="h-3 w-3" />
          Expand
        </button>
      </div>

      {/* Stats pill — top left */}
      <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg bg-slate-900/75 backdrop-blur border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
        <Layers className="h-3 w-3 text-blue-400" />
        <span>{crimes.length} incidents</span>
        <span className="text-slate-600">·</span>
        <span>{hotspots.length} zones</span>
      </div>

      {/* Legend — bottom left */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-xs text-slate-700 dark:text-white space-y-1.5">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Severity</p>
        {[['#ef4444', 'Critical'], ['#f97316', 'High'], ['#eab308', 'Medium'], ['#22c55e', 'Low']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-slate-500 dark:text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
