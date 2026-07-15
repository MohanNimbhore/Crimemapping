import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet';
import { Eye, EyeOff, Maximize2 } from 'lucide-react';
import type { Crime, Hotspot } from '../../types';
import 'leaflet/dist/leaflet.css';

interface DashboardMapProps {
  crimes: Crime[];
  hotspots: Hotspot[];
  center: [number, number];
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  map.flyTo(center, map.getZoom(), { duration: 1.2 });
  return null;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f97316';
    case 'low':
      return '#22c55e';
    default:
      return '#64748b';
  }
}

function riskColor(risk: string): string {
  switch (risk) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f97316';
    case 'low':
      return '#22c55e';
    default:
      return '#64748b';
  }
}

export default function DashboardMap({ crimes, hotspots, center }: DashboardMapProps) {
  const navigate = useNavigate();
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-slate-700/50">
      <MapContainer
        center={center}
        zoom={5}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <MapCenter center={center} />

        {showCrimes &&
          crimes.map((crime) => (
            <Circle
              key={crime.id}
              center={[crime.latitude, crime.longitude]}
              radius={300}
              pathOptions={{
                color: severityColor(crime.severity),
                fillColor: severityColor(crime.severity),
                fillOpacity: 0.5,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold capitalize">{crime.crime_type}</div>
                  <div className="text-slate-600 capitalize">{crime.severity} severity</div>
                  <div className="text-slate-600">{crime.city}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {new Date(crime.crime_date).toLocaleDateString()}
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

        {showHotspots &&
          hotspots.map((hotspot) => {
            const color = riskColor(hotspot.risk_level);
            return (
              <Circle
                key={hotspot.id}
                center={[hotspot.latitude, hotspot.longitude]}
                radius={800}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: hotspot.risk_level !== 'high' ? '6 6' : undefined,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{hotspot.area_name}</div>
                    <div className="text-slate-600 capitalize">{hotspot.risk_level} risk</div>
                    <div className="text-slate-600">{hotspot.crime_count} crimes</div>
                  </div>
                </Popup>
              </Circle>
            );
          })}
      </MapContainer>

      {/* Toggle controls */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowCrimes((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          {showCrimes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Crimes
        </button>
        <button
          onClick={() => setShowHotspots((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          {showHotspots ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Hotspots
        </button>
        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Fullscreen
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-2 text-xs text-white">
        <div className="font-semibold mb-1.5">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical / High
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Medium
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Low
          </div>
        </div>
      </div>
    </div>
  );
}
