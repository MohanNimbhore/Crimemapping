import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Loader2, SlidersHorizontal, Eye, EyeOff, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Hotspot } from '../types';
import { CRIME_TYPES, CITIES, CITIES_COORDINATES } from '../types';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const riskColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
};

export default function CrimeMap() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', city: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Ahmedabad');
  const [mapView, setMapView] = useState<'gujarat' | 'india'>('gujarat');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [crimesData, hotspotsData] = await Promise.all([
        api.getCrimes({ ...filters, limit: 500 }),
        api.getHotspots(),
      ]);
      setCrimes(crimesData.data);
      setHotspots(hotspotsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const center = CITIES_COORDINATES[selectedCity] || { lat: 23.0225, lng: 72.5714 };

  const gujaratCities = ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];
  const allCities = CITIES;
  const cityOptions = mapView === 'gujarat' ? gujaratCities : allCities;

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Crime Map</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Interactive visualization of crime incidents and hotspots</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all btn-press ${
              showFilters
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-sm shadow-blue-500/10'
                : 'bg-slate-800/70 border-slate-700/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center gap-3 animate-fade-in">
          {/* Map View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-700">
            <button
              onClick={() => { setMapView('gujarat'); setSelectedCity('Ahmedabad'); setFilters({ ...filters, city: 'Ahmedabad' }); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapView === 'gujarat'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gujarat
            </button>
            <button
              onClick={() => { setMapView('india'); setSelectedCity('Ahmedabad'); setFilters({ ...filters, city: '' }); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapView === 'india'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All India
            </button>
          </div>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            <option value="">All Types</option>
            {CRIME_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={(e) => {
              const city = e.target.value;
              setSelectedCity(city);
              setFilters({ ...filters, city });
            }}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all btn-press ${
                showMarkers ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {showMarkers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Markers
            </button>
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all btn-press ${
                showHotspots ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {showHotspots ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Hotspots
            </button>
          </div>
        </div>
      )}

      <div className="relative bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden h-full card-lift">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-[1000] animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-400">Loading map data...</p>
            </div>
          </div>
        )}
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={mapView === 'gujarat' ? 12 : 5}
          className="h-full w-full"
          style={{ background: '#1e293b' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {showMarkers && crimes.map((crime) => (
            <Marker key={crime.id} position={[crime.latitude, crime.longitude]} icon={defaultIcon}>
              <Popup className="crime-popup">
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      crime.severity === 'critical' || crime.severity === 'high' ? 'bg-red-500' :
                      crime.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <h3 className="font-bold text-slate-900 text-sm">{crime.crime_type}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{crime.area_name}, {crime.city}</p>
                  <p className="text-sm text-slate-500">{crime.crime_date} at {crime.crime_time}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mt-2 border ${
                    crime.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    crime.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    crime.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {crime.severity} severity
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {showHotspots && hotspots.map((hotspot) => (
            <Circle
              key={hotspot.id}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={hotspot.radius}
              pathOptions={{
                color: riskColors[hotspot.risk_level] || '#f97316',
                fillColor: riskColors[hotspot.risk_level] || '#f97316',
                fillOpacity: 0.15,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-3 min-w-[180px]">
                  <h3 className="font-bold text-slate-900 text-sm">{hotspot.area_name}</h3>
                  <p className="text-sm text-slate-600">{hotspot.crime_count} crimes in this hotspot</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mt-2 border ${
                    hotspot.risk_level === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                    hotspot.risk_level === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    'bg-green-100 text-green-700 border-green-200'
                  }`}>
                    {hotspot.risk_level} risk
                  </span>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 shadow-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Legend</div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
              <span className="text-slate-300 text-xs">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30" />
              <span className="text-slate-300 text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />
              <span className="text-slate-300 text-xs">Low</span>
            </div>
          </div>
        </div>

        {/* Map View Badge */}
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-white font-medium">
              {mapView === 'gujarat' ? 'Gujarat View' : 'All India View'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
