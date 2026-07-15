import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, EyeOff, ChevronDown, ChevronUp, MapPin, AlertTriangle, Crosshair } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { CRIME_TYPES, CITIES, CITIES_COORDINATES } from '../types';
import { formatDate, formatTime, getSeverityColor, getRiskLevelColor } from '../lib/utils';
import { PageLoader } from '../components/ui/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

const blueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function riskCircleColor(level: string): string {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#f97316';
    case 'low': return '#22c55e';
    default: return '#64748b';
  }
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  map.flyTo(center, map.getZoom(), { duration: 1.2 });
  return null;
}

export default function CrimeMap() {
  const [loading, setLoading] = useState(true);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showCrimes, setShowCrimes] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [region, setRegion] = useState<'gujarat' | 'all'>('gujarat');
  const [crimeType, setCrimeType] = useState<string>('all');
  const [city, setCity] = useState<string>('all');

  const GUJARAT_CITIES = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, h] = await Promise.all([
        api.getCrimes({ limit: 1000 }),
        api.getHotspots(),
      ]);
      setCrimes(c.data);
      setHotspots(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCrimes = crimes.filter((c) => {
    if (region === 'gujarat' && !GUJARAT_CITIES.includes(c.city)) return false;
    if (city !== 'all' && c.city !== city) return false;
    if (crimeType !== 'all' && c.crime_type !== crimeType) return false;
    return true;
  });

  const filteredHotspots = hotspots.filter((h) => {
    if (region === 'gujarat' && city === 'all') {
      return GUJARAT_CITIES.some((gc) => h.area_name.includes(gc));
    }
    if (city !== 'all') return h.area_name.includes(city);
    return true;
  });

  const mapCenter: [number, number] =
    city !== 'all' && CITIES_COORDINATES[city]
      ? [CITIES_COORDINATES[city].lat, CITIES_COORDINATES[city].lng]
      : region === 'gujarat'
        ? [23.0225, 72.5714]
        : [22.9734, 78.6569];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crime Map</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Interactive map of crime incidents and hotspots</p>
        </div>
        <button
          onClick={() => setFiltersOpen((s) => !s)}
          className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Filters
        </button>
      </div>

      {/* Filter Bar */}
      {filtersOpen && (
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 animate-fade-in">
          <div className="flex flex-wrap items-end gap-4">
            {/* Region toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Region</label>
              <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => { setRegion('gujarat'); setCity('all'); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    region === 'gujarat'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Gujarat
                </button>
                <button
                  onClick={() => { setRegion('all'); setCity('all'); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    region === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  All India
                </button>
              </div>
            </div>

            {/* Crime Type */}
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Crime Type</label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Crime Types</option>
                {CRIME_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Cities</option>
                {(region === 'gujarat' ? GUJARAT_CITIES : CITIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Toggle buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowCrimes((s) => !s)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  showCrimes
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                {showCrimes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Markers
              </button>
              <button
                onClick={() => setShowHotspots((s) => !s)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  showHotspots
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                {showHotspots ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Hotspots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[calc(100vh-280px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700">
        <MapContainer
          center={mapCenter}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom
          zoomControl
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <MapCenter center={mapCenter} />

          {showCrimes &&
            filteredCrimes.map((crime) => (
              <Marker
                key={crime.id}
                position={[crime.latitude, crime.longitude]}
                icon={blueIcon}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold capitalize">{crime.crime_type}</span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{crime.area_name}, {crime.city}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(crime.crime_date)} at {formatTime(crime.crime_time)}
                    </div>
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getSeverityColor(crime.severity)}`}>
                      {crime.severity}
                    </span>
                    {crime.description && (
                      <p className="pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                        {crime.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {showHotspots &&
            filteredHotspots.map((hotspot) => {
              const color = riskCircleColor(hotspot.risk_level);
              return (
                <Circle
                  key={hotspot.id}
                  center={[hotspot.latitude, hotspot.longitude]}
                  radius={hotspot.radius || 800}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: hotspot.risk_level !== 'high' ? '6 6' : undefined,
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] space-y-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">{hotspot.area_name}</span>
                      </div>
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getRiskLevelColor(hotspot.risk_level)}`}>
                        {hotspot.risk_level} risk
                      </span>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {hotspot.crime_count} crimes
                      </div>
                      {hotspot.crime_types && Object.keys(hotspot.crime_types).length > 0 && (
                        <div className="pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                          {Object.entries(hotspot.crime_types)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 3)
                            .map(([type, count]) => (
                              <div key={type}>{type}: {count}</div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>
              );
            })}
        </MapContainer>

        {/* View indicator - top right */}
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 text-xs font-medium text-white">
          <Crosshair className="h-3.5 w-3.5 text-blue-400" />
          {filteredCrimes.length} crimes · {filteredHotspots.length} hotspots
        </div>

        {/* Legend - bottom left */}
        <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-2 text-xs text-white">
          <div className="font-semibold mb-1.5">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="" className="h-4 w-3" />
              Crime Marker
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High Risk
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Medium Risk
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Low Risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
