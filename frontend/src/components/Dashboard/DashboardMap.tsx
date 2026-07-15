import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import { Eye, EyeOff, Maximize2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Crime, Hotspot } from '../../types';
import { CITIES_COORDINATES } from '../../types';
import 'leaflet/dist/leaflet.css';

const riskColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
};

interface Props {
  crimes: Crime[];
  hotspots: Hotspot[];
  center: [number, number];
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.5 });
  }, [center, map]);
  return null;
}

export default function DashboardMap({ crimes, hotspots, center }: Props) {
  const navigate = useNavigate();
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden">
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-xl btn-press ${
            showMarkers ? 'bg-blue-500/90 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/80 border-slate-600 text-slate-300'
          }`}
        >
          {showMarkers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Crimes
        </button>
        <button
          onClick={() => setShowHotspots(!showHotspots)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all backdrop-blur-xl btn-press ${
            showHotspots ? 'bg-orange-500/90 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-900/80 border-slate-600 text-slate-300'
          }`}
        >
          {showHotspots ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Hotspots
        </button>
        <button
          onClick={() => navigate('/map')}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-600 text-slate-300 hover:text-white transition-all backdrop-blur-xl btn-press"
          title="Full screen map"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <MapCenter center={center} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {showMarkers && crimes.slice(0, 200).map((crime) => (
          <Circle
            key={crime.id}
            center={[crime.latitude, crime.longitude]}
            radius={80}
            pathOptions={{
              color: crime.severity === 'critical' || crime.severity === 'high' ? '#ef4444' : crime.severity === 'medium' ? '#f97316' : '#22c55e',
              fillColor: crime.severity === 'critical' || crime.severity === 'high' ? '#ef4444' : crime.severity === 'medium' ? '#f97316' : '#22c55e',
              fillOpacity: 0.5,
              weight: 0,
            }}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${crime.severity === 'critical' || crime.severity === 'high' ? 'bg-red-500' : crime.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`} />
                  <p className="font-bold text-slate-900 text-xs">{crime.crime_type}</p>
                </div>
                <p className="text-slate-600 text-xs">{crime.area_name}, {crime.city}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {showHotspots && hotspots.map((hotspot) => (
          <Circle
            key={hotspot.id}
            center={[hotspot.latitude, hotspot.longitude]}
            radius={hotspot.radius || 600}
            pathOptions={{
              color: riskColors[hotspot.risk_level] || '#f97316',
              fillColor: riskColors[hotspot.risk_level] || '#f97316',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: hotspot.risk_level === 'high' ? undefined : '4 4',
            }}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <p className="font-bold text-slate-900 text-xs">{hotspot.area_name}</p>
                <p className="text-slate-600 text-xs">{hotspot.crime_count} crimes</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${
                  hotspot.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                  hotspot.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {hotspot.risk_level} risk
                </span>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-3 py-2.5 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Navigation className="w-3 h-3 text-slate-400" />
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Map Legend</p>
        </div>
        <div className="space-y-1">
          {[
            { color: '#ef4444', label: 'High Risk' },
            { color: '#f97316', label: 'Medium Risk' },
            { color: '#22c55e', label: 'Low Risk' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }} />
              <span className="text-[11px] text-slate-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
