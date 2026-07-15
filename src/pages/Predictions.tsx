import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Trash2, MapPin, Target, TrendingUp, Calendar, Crosshair } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Prediction } from '../types';
import { getRiskLevelColor, formatDate } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
};

function computeRiskScore(
  crimes: Crime[],
  lat: number,
  lng: number,
  radiusKm = 2
): { score: number; factors: Record<string, unknown> } {
  const nearby = crimes.filter(
    (c) => haversineDistance(lat, lng, c.latitude, c.longitude) <= radiusKm
  );

  if (nearby.length === 0) {
    return {
      score: 10,
      factors: {
        crimeCount: 0,
        severityScore: 0,
        timeFactor: 0,
        typeDiversity: 0,
        radius: radiusKm,
      },
    };
  }

  // Crime density factor (0-30)
  const crimeCount = nearby.length;
  const densityScore = Math.min(crimeCount * 3, 30);

  // Severity factor (0-30)
  const severityScore = Math.min(
    nearby.reduce((sum, c) => sum + (SEVERITY_WEIGHT[c.severity] || 5), 0) / Math.max(crimeCount, 1),
    30
  );

  // Time factor - recent crimes weigh more (0-20)
  const now = new Date();
  const timeFactor = Math.min(
    nearby.reduce((sum, c) => {
      const daysAgo = Math.max(0, (now.getTime() - new Date(c.crime_date).getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, 20 - daysAgo * 0.3);
    }, 0) / Math.max(crimeCount, 1),
    20
  );

  // Crime type diversity (0-20)
  const uniqueTypes = new Set(nearby.map((c) => c.crime_type));
  const typeDiversity = Math.min(uniqueTypes.size * 4, 20);

  const score = Math.round(densityScore + severityScore + timeFactor + typeDiversity);

  return {
    score: Math.min(score, 100),
    factors: {
      crimeCount,
      severityScore: Math.round(severityScore),
      timeFactor: Math.round(timeFactor),
      typeDiversity,
      uniqueTypes: uniqueTypes.size,
      radius: radiusKm,
    },
  };
}

function getRiskLevelFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getConfidence(score: number, crimeCount: number): number {
  // Higher crime count and more extreme scores = higher confidence
  const countFactor = Math.min(crimeCount / 10, 1);
  const scoreFactor = Math.abs(score - 50) / 50;
  return Math.round((countFactor * 0.6 + scoreFactor * 0.4) * 100);
}

export default function Predictions() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.getCrimes({ limit: 1000 }),
        api.getPredictions(),
      ]);
      setCrimes(c.data);
      setPredictions(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Group crimes by approximate area (rounded coords)
      const areaMap = new Map<string, { lat: number; lng: number; area: string; crimes: Crime[] }>();
      crimes.forEach((c) => {
        const key = `${c.latitude.toFixed(2)}_${c.longitude.toFixed(2)}`;
        if (!areaMap.has(key)) {
          areaMap.set(key, {
            lat: c.latitude,
            lng: c.longitude,
            area: c.area_name,
            crimes: [],
          });
        }
        areaMap.get(key)!.crimes.push(c);
      });

      // Generate predictions for top areas by crime count
      const areas = Array.from(areaMap.values())
        .sort((a, b) => b.crimes.length - a.crimes.length)
        .slice(0, 20);

      await api.clearPredictions();

      const predictionData: Partial<Prediction>[] = areas.map((area) => {
        const { score, factors } = computeRiskScore(area.crimes, area.lat, area.lng);
        const crimeCount = (factors.crimeCount as number) || area.crimes.length;
        return {
          area_name: area.area,
          latitude: area.lat,
          longitude: area.lng,
          risk_score: score,
          risk_level: getRiskLevelFromScore(score),
          prediction_date: new Date().toISOString().split('T')[0],
          confidence_score: getConfidence(score, crimeCount),
          factors,
        };
      });

      const saved = await api.savePredictions(predictionData);
      setPredictions(saved);
    } catch (err) {
      console.error('Failed to generate predictions:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCustomPredict = async () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return;

    setPredicting(true);
    try {
      const { score, factors } = computeRiskScore(crimes, lat, lng);
      const crimeCount = (factors.crimeCount as number) || 0;

      const predictionData: Partial<Prediction> = {
        area_name: `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
        risk_score: score,
        risk_level: getRiskLevelFromScore(score),
        prediction_date: new Date().toISOString().split('T')[0],
        confidence_score: getConfidence(score, crimeCount),
        factors,
      };

      const saved = await api.savePredictions([predictionData]);
      setPredictions((prev) => [...saved, ...prev]);
      setCustomLat('');
      setCustomLng('');
    } catch (err) {
      console.error('Failed to predict custom location:', err);
    } finally {
      setPredicting(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.clearPredictions();
      setPredictions([]);
    } catch (err) {
      console.error('Failed to clear predictions:', err);
    }
  };

  const highRiskCount = predictions.filter((p) => p.risk_level === 'high').length;
  const avgRiskScore = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.risk_score, 0) / predictions.length)
    : 0;
  const latestDate = predictions.length > 0
    ? predictions[0].prediction_date
    : '—';

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Predictions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Risk scoring based on crime density, severity, time, and type</p>
        </div>
        <div className="flex items-center gap-3">
          {predictions.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || crimes.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 btn-press"
          >
            {generating ? <ButtonLoader /> : <Sparkles className="h-4 w-4" />}
            Generate Predictions
          </button>
        </div>
      </div>

      {/* Custom Location Prediction */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Custom Location Prediction</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Latitude</label>
            <input
              type="number"
              step="any"
              placeholder="23.0225"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Longitude</label>
            <input
              type="number"
              step="any"
              placeholder="72.5714"
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleCustomPredict}
            disabled={predicting || !customLat || !customLng}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 btn-press"
          >
            {predicting ? <ButtonLoader /> : <Target className="h-4 w-4" />}
            Predict
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Predictions</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{predictions.length}</p>
            </div>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-950/30 p-2.5">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">High Risk Areas</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{highRiskCount}</p>
            </div>
            <div className="rounded-lg bg-red-100 dark:bg-red-950/30 p-2.5">
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Risk Score</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{avgRiskScore}<span className="text-sm text-slate-400">/100</span></p>
            </div>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-950/30 p-2.5">
              <Target className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 card-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Prediction Date</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatDate(latestDate)}</p>
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-950/30 p-2.5">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      {predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No predictions generated</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Click "Generate Predictions" to analyze {crimes.length} crime records and produce risk scores, or predict a custom location above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Area</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Location</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Risk Score</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Risk Level</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Confidence</th>
                  <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Factors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {predictions.map((pred, i) => (
                  <tr
                    key={pred.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {pred.area_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {pred.latitude.toFixed(4)}, {pred.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pred.risk_score >= 70 ? 'bg-red-500' : pred.risk_score >= 40 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${pred.risk_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{pred.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getRiskLevelColor(pred.risk_level)}`}>
                        {pred.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {pred.confidence_score !== null ? `${pred.confidence_score}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {pred.factors ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(pred.factors).slice(0, 4).map(([key, val]) => (
                            <span key={key} className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                              {key}: {String(val)}
                            </span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
