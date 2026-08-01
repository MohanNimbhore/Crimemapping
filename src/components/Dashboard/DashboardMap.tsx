import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Eye, EyeOff, Maximize2, Layers } from 'lucide-react';
import { useState } from 'react';
import type { Crime, Hotspot } from '../../types';
import 'ol/ol.css';

interface DashboardMapProps {
  crimes: Crime[];
  hotspots: Hotspot[];
  center: [number, number];
}

interface ClusterPoint {
  lat: number; lng: number; count: number; severity: string; crimes: Crime[];
}

function clusterPoints(points: Crime[], gridSize: number): ClusterPoint[] {
  const cells = new globalThis.Map<string, ClusterPoint>();
  for (const p of points) {
    const k = `${Math.floor(p.latitude / gridSize)},${Math.floor(p.longitude / gridSize)}`;
    if (!cells.has(k)) {
      cells.set(k, {
        lat: Math.floor(p.latitude / gridSize) * gridSize + gridSize / 2,
        lng: Math.floor(p.longitude / gridSize) * gridSize + gridSize / 2,
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

export default function DashboardMap({ crimes, hotspots, center }: DashboardMapProps) {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const olMap = useRef<OLMap | null>(null);
  const crimeLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const hotspotLayer = useRef<VectorLayer<VectorSource> | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  const clusters = useMemo(() => clusterPoints(crimes.slice(0, 300), 0.15), [crimes]);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || olMap.current) return;

    const isDark = document.documentElement.classList.contains('dark');

    const crimeSource = new VectorSource();
    const hotspotSource = new VectorSource();

    crimeLayer.current = new VectorLayer({ source: crimeSource, zIndex: 2 });
    hotspotLayer.current = new VectorLayer({ source: hotspotSource, zIndex: 1 });

    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -8],
      stopEvent: false,
    });
    overlayRef.current = popup;

    olMap.current = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        hotspotLayer.current,
        crimeLayer.current,
      ],
      overlays: [popup],
      view: new View({
        center: fromLonLat([center[1], center[0]]),
        zoom: 6,
        enableRotation: false,
      }),
      controls: [],
    });

    // Popup on click
    olMap.current.on('click', (evt) => {
      const feature = olMap.current!.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const props = feature.getProperties();
        const geom = feature.getGeometry();
        let coord = evt.coordinate;
        if (geom instanceof Point) coord = (geom as Point).getCoordinates();
        popup.setPosition(coord);
        if (popupRef.current) {
          popupRef.current.innerHTML = props.html || '';
          popupRef.current.style.display = 'block';
        }
      } else {
        if (popupRef.current) popupRef.current.style.display = 'none';
        popup.setPosition(undefined);
      }
    });

    // Call updateSize whenever the container resizes (handles expand/sidebar toggle)
    const resizeObserver = new ResizeObserver(() => {
      olMap.current?.updateSize();
    });
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      olMap.current?.setTarget(undefined);
      olMap.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Fly to new center
  useEffect(() => {
    olMap.current?.getView().animate({ center: fromLonLat([center[1], center[0]]), zoom: 7, duration: 800 });
  }, [center]);

  // Update crime features
  useEffect(() => {
    if (!crimeLayer.current) return;
    const source = crimeLayer.current.getSource()!;
    source.clear();
    clusters.forEach((cl) => {
      const col = sevColor(cl.severity);
      const r = cl.count === 1 ? 6 : Math.min(6 + Math.log2(cl.count) * 4, 28);
      const f = new Feature({ geometry: new Point(fromLonLat([cl.lng, cl.lat])) });
      f.setStyle(new Style({
        image: new CircleStyle({
          radius: r,
          fill: new Fill({ color: col + (cl.count === 1 ? 'cc' : 'aa') }),
          stroke: new Stroke({ color: col, width: cl.count > 1 ? 1.5 : 1 }),
        }),
      }));
      const topType = cl.crimes[0].crime_type;
      f.setProperties({
        html: `<div class="space-y-1 min-w-[150px] text-sm">
          <p class="font-bold text-slate-900 dark:text-white">${cl.count === 1 ? topType : `${cl.count} crimes`}</p>
          <p class="text-slate-600 text-xs">${cl.count === 1 ? cl.crimes[0].area_name : `Top: ${topType}`}</p>
          <span class="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style="background:${col}33;color:${col};border:1px solid ${col}66">${cl.severity}</span>
        </div>`,
      });
      source.addFeature(f);
    });
    crimeLayer.current.setVisible(showCrimes);
  }, [clusters, showCrimes]);

  // Update hotspot features
  useEffect(() => {
    if (!hotspotLayer.current) return;
    const source = hotspotLayer.current.getSource()!;
    source.clear();
    hotspots.forEach((hs) => {
      const col = riskColor(hs.risk_level);
      // radius in meters → degrees approx (OL circles use map units, so we use a point+style workaround)
      const f = new Feature({ geometry: new Circle(fromLonLat([hs.longitude, hs.latitude]), (hs.radius || 1000)) });
      f.setStyle(new Style({
        fill: new Fill({ color: col + '1a' }),
        stroke: new Stroke({
          color: col,
          width: hs.risk_level === 'high' ? 2 : 1.5,
          lineDash: hs.risk_level !== 'high' ? [6, 5] : undefined,
        }),
      }));
      f.setProperties({
        html: `<div class="space-y-1 min-w-[140px] text-sm">
          <p class="font-bold text-slate-900 dark:text-white">${hs.area_name}</p>
          <p class="text-slate-600 text-xs">${hs.crime_count} crimes</p>
          <span class="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style="background:${col}33;color:${col};border:1px solid ${col}66">${hs.risk_level} risk</span>
        </div>`,
      });
      source.addFeature(f);
    });
    hotspotLayer.current.setVisible(showHotspots);
  }, [hotspots, showHotspots]);

  // Toggle visibility
  useEffect(() => { crimeLayer.current?.setVisible(showCrimes); }, [showCrimes]);
  useEffect(() => { hotspotLayer.current?.setVisible(showHotspots); }, [showHotspots]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* Popup */}
      <div
        ref={popupRef}
        className="hidden absolute z-50 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl px-3 py-2.5 pointer-events-none"
        style={{ transform: 'translateX(-50%)' }}
      />

      {/* Controls — top right */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => setShowCrimes((s) => !s)}
          className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press ${showCrimes ? 'bg-blue-600/80 border-blue-500/60 text-white shadow-lg shadow-blue-500/20' : 'bg-white/80 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600/50 text-slate-500 dark:text-slate-400'}`}
        >
          {showCrimes ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Crimes
        </button>
        <button
          onClick={() => setShowHotspots((s) => !s)}
          className={`flex items-center gap-1.5 rounded-lg backdrop-blur border px-2.5 py-1.5 text-xs font-semibold transition-all btn-press ${showHotspots ? 'bg-orange-600/80 border-orange-500/60 text-white shadow-lg shadow-orange-500/20' : 'bg-white/80 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600/50 text-slate-500 dark:text-slate-400'}`}
        >
          {showHotspots ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Hotspots
        </button>
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-1.5 rounded-lg bg-white/80 dark:bg-slate-900/70 backdrop-blur border border-slate-300 dark:border-slate-600/50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-all btn-press"
        >
          <Maximize2 className="h-3 w-3" />
          Expand
        </button>
      </div>

      {/* Stats pill — top left */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/80 dark:bg-slate-900/75 backdrop-blur border border-slate-200 dark:border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
        <Layers className="h-3 w-3 text-blue-400" />
        <span>{crimes.length} incidents</span>
        <span className="text-slate-400">·</span>
        <span>{hotspots.length} zones</span>
      </div>

      {/* Legend — bottom left */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-xs space-y-1.5">
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
