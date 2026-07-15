import { useEffect, useState, useCallback } from 'react';
import { FileText, Target, AlertTriangle, MapPin, Activity, RefreshCw } from 'lucide-react';
import { PageLoader } from '../components/ui/LoadingSpinner';
import SparklineCard from '../components/Dashboard/SparklineCard';
import DashboardMap from '../components/Dashboard/DashboardMap';
import MapFilters from '../components/Dashboard/MapFilters';
import RecentAlerts from '../components/Dashboard/RecentAlerts';
import BottomPanels from '../components/Dashboard/BottomPanels';
import { api } from '../lib/api';
import { autoSeedIfEmpty } from '../lib/seedData';
import type { Crime, Hotspot, Alert, CrimeTrend, DashboardStats } from '../types';
import { CITIES_COORDINATES } from '../types';

interface Filters {
  type: string;
  severity: string;
  city: string;
}

function generateSparkData(base: number, variance: number, points = 12): { v: number }[] {
  const data: { v: number }[] = [];
  for (let i = 0; i < points; i++) {
    data.push({ v: Math.max(0, Math.round(base + (Math.random() - 0.5) * variance)) });
  }
  return data;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<CrimeTrend[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [predictions, setPredictions] = useState<{ area: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filters, setFilters] = useState<Filters>({ type: '', severity: '', city: '' });
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.0225, 72.5714]);

  useEffect(() => {
    async function initialize() {
      try {
        setSeeding(true);
        const seeded = await autoSeedIfEmpty();
        if (seeded) {
          setSeeding(false);
        }
        await fetchAllData();
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
        setSeeding(false);
      }
    }
    initialize();
  }, []);

  const fetchAllData = async () => {
    const [statsData, trendsData, alertsData, crimesData, hotspotsData, predictionsData] = await Promise.all([
      api.getDashboardStats(),
      api.getCrimeTrends(),
      api.getAlerts({}),
      api.getCrimes({ limit: 500 }),
      api.getHotspots(),
      api.getPredictions(),
    ]);

    setStats(statsData);
    setTrends(trendsData);
    setAlerts(alertsData);
    setCrimes(crimesData.data);
    setHotspots(hotspotsData.slice(0, 20));
    setPredictions(predictionsData.slice(0, 10).map((p) => ({ area: p.area_name, score: p.risk_score })));
  };

  const applyFilters = useCallback(async () => {
    const result = await api.getCrimes({
      type: filters.type || undefined,
      severity: filters.severity || undefined,
      city: filters.city || undefined,
      limit: 500,
    });
    setCrimes(result.data);

    if (filters.city && CITIES_COORDINATES[filters.city]) {
      setMapCenter([CITIES_COORDINATES[filters.city].lat, CITIES_COORDINATES[filters.city].lng]);
    }
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          {seeding ? (
            <>
              <Activity className="w-8 h-8 text-blue-400 animate-pulse mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Initializing crime database...</p>
            </>
          ) : (
            <PageLoader />
          )}
        </div>
      </div>
    );
  }

  const prevMonthCrimes = trends.length >= 2 ? trends[trends.length - 2]?.total || 0 : 0;
  const currentMonthCrimes = trends.length >= 1 ? trends[trends.length - 1]?.total || 0 : 0;
  const crimeChange = prevMonthCrimes > 0 ? Math.round(((currentMonthCrimes - prevMonthCrimes) / prevMonthCrimes) * 100) : 0;

  const typeDistribution = Object.entries(stats?.crimeDistribution.byType || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topHotspots = hotspots.slice(0, 5).map((h) => ({
    area: h.area_name,
    count: h.crime_count,
    risk: h.risk_level,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white animate-fade-in-up">Command Center</h1>
          <p className="text-slate-400 mt-0.5 text-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            Crime intelligence and predictive analytics overview
          </p>
        </div>
        <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all btn-press"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SparklineCard
          title="Total Crimes"
          value={stats?.totalCrimes || 0}
          trend={`${Math.abs(crimeChange)}%`}
          trendUp={crimeChange < 0}
          icon={<FileText className="w-5 h-5" />}
          sparkColor="#3b82f6"
          sparkData={generateSparkData(stats?.totalCrimes || 100, 50)}
          subtitle="All recorded incidents"
          delay={0}
        />
        <SparklineCard
          title="Active Hotspots"
          value={stats?.totalHotspots || 0}
          trend="12%"
          trendUp={false}
          icon={<Target className="w-5 h-5" />}
          sparkColor="#f97316"
          sparkData={generateSparkData(30, 15)}
          subtitle="Identified risk zones"
          delay={80}
        />
        <SparklineCard
          title="Active Alerts"
          value={stats?.activeAlerts || 0}
          trend="8%"
          trendUp={stats?.activeAlerts === 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          sparkColor="#ef4444"
          sparkData={generateSparkData(15, 10)}
          subtitle="Unread notifications"
          delay={160}
        />
        <SparklineCard
          title="High Risk Areas"
          value={stats?.highRiskAreas || 0}
          trend="5%"
          trendUp={false}
          icon={<MapPin className="w-5 h-5" />}
          sparkColor="#a855f7"
          sparkData={generateSparkData(12, 8)}
          subtitle="Above 70% risk score"
          delay={240}
        />
      </div>

      {/* Map + Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Map Card */}
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
            <div className="px-4 py-3.5 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/15">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Crime Activity Map</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live monitoring</span>
              </div>
            </div>
            <div className="h-[420px]">
              <DashboardMap crimes={crimes} hotspots={hotspots} center={mapCenter} />
            </div>
          </div>

          {/* Bottom Panels */}
          <BottomPanels
            trends={trends}
            typeDistribution={typeDistribution}
            topHotspots={topHotspots}
            predictions={predictions}
          />
        </div>

        <div className="flex flex-col gap-4">
          <MapFilters filters={filters} onChange={setFilters} onApply={applyFilters} />
          <div className="flex-1 min-h-[360px]">
            <RecentAlerts alerts={alerts.slice(0, 10)} />
          </div>
        </div>
      </div>
    </div>
  );
}
