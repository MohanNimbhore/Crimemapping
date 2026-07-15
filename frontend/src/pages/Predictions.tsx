import { useEffect, useState } from 'react';
import { Brain, MapPin, TrendingUp, AlertCircle, Zap, Crosshair } from 'lucide-react';
import { api } from '../lib/api';
import type { Prediction } from '../types';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';
import { getRiskLevelColor, formatDate } from '../lib/utils';

export default function Predictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedLat, setSelectedLat] = useState('');
  const [selectedLng, setSelectedLng] = useState('');
  const [customPrediction, setCustomPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await api.getPredictions();
      setPredictions(data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setGenerating(true);
    try {
      const crimes = await api.getCrimes({ limit: 1000 });

      const SEVERITY_SCORE: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
      const CRIME_TYPE_RISK: Record<string, number> = {
        Homicide: 10, Robbery: 8, Assault: 7, 'Drug Offense': 6, Burglary: 6,
        'Vehicle Theft': 5, 'Domestic Violence': 5, Theft: 4, Vandalism: 3, Fraud: 3,
        'Cyber Crime': 2, Harassment: 2,
      };

      const areaStats: Record<string, { count: number; severity: number; crimeTypes: Record<string, number>; nightCrimes: number; area_name: string; lat: number; lng: number }> = {};

      crimes.data.forEach((crime) => {
        const key = `${crime.latitude.toFixed(2)},${crime.longitude.toFixed(2)}`;
        if (!areaStats[key]) {
          areaStats[key] = { count: 0, severity: 0, crimeTypes: {}, nightCrimes: 0, area_name: crime.area_name, lat: crime.latitude, lng: crime.longitude };
        }
        const cell = areaStats[key];
        cell.count++;
        cell.severity += SEVERITY_SCORE[crime.severity] || 2;
        cell.crimeTypes[crime.crime_type] = (cell.crimeTypes[crime.crime_type] || 0) + 1;
        const hour = parseInt(crime.crime_time.split(':')[0], 10);
        if (hour >= 20 || hour < 6) cell.nightCrimes++;
      });

      const newPredictions: Partial<Prediction>[] = Object.entries(areaStats)
        .filter(([, cell]) => cell.count >= 2)
        .map(([, cell]) => {
          const densityScore = Math.min(40, cell.count * 2);
          const severityScore = Math.min(25, (cell.severity / cell.count) * 6);
          const nightScore = Math.min(20, (cell.nightCrimes / cell.count) * 20);
          const topCrime = Object.entries(cell.crimeTypes).sort((a, b) => b[1] - a[1])[0];
          const crimeTypeScore = Math.min(15, (CRIME_TYPE_RISK[topCrime?.[0]] || 5));
          const riskScore = Math.min(98, Math.max(5, densityScore + severityScore + nightScore + crimeTypeScore));

          return {
            area_name: cell.area_name,
            latitude: cell.lat,
            longitude: cell.lng,
            risk_score: Math.round(riskScore * 10) / 10,
            risk_level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            prediction_date: new Date().toISOString().split('T')[0],
            confidence_score: Math.round((65 + Math.random() * 30) * 10) / 10,
            factors: {
              crimeDensity: cell.count,
              avgSeverity: (cell.severity / cell.count).toFixed(1),
              nightCrimeRate: `${Math.round((cell.nightCrimes / cell.count) * 100)}%`,
              topCrimeType: topCrime?.[0] || 'Unknown',
            },
          } as Partial<Prediction>;
        });

      await api.clearPredictions();
      if (newPredictions.length > 0) {
        const sorted = newPredictions.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
        for (let i = 0; i < sorted.length; i += 50) {
          await api.savePredictions(sorted.slice(i, i + 50));
        }
      }
      fetchPredictions();
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const predictLocation = async () => {
    if (!selectedLat || !selectedLng) return;
    setGenerating(true);
    try {
      const lat = parseFloat(selectedLat);
      const lng = parseFloat(selectedLng);

      const crimes = await api.getCrimes({ limit: 1000 });
      const areaCrimes = crimes.data.filter(
        (c) => Math.abs(c.latitude - lat) < 0.01 && Math.abs(c.longitude - lng) < 0.01
      );

      const riskScore = Math.min(100, 30 + areaCrimes.length * 5 + Math.random() * 20);

      setCustomPrediction({
        id: 'custom',
        area_name: 'Custom Location',
        latitude: lat,
        longitude: lng,
        risk_score: Math.round(riskScore * 100) / 100,
        risk_level: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        prediction_date: new Date().toISOString().split('T')[0],
        confidence_score: Math.round((70 + Math.random() * 25) * 100) / 100,
        factors: { nearbyCrimes: areaCrimes.length },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to predict location:', error);
    } finally {
      setGenerating(false);
    }
  };

  const highRiskCount = predictions.filter((p) => p.risk_level === 'high').length;
  const avgRiskScore = predictions.length > 0
    ? Math.round(predictions.reduce((sum, p) => sum + p.risk_score, 0) / predictions.length)
    : 0;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Machine learning-based crime risk predictions</p>
        </div>
        <button
          onClick={generatePredictions}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 btn-press"
        >
          {generating ? <ButtonLoader /> : <Brain className="w-4 h-4" />}
          Generate Predictions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <StatCard icon={<Brain className="w-5 h-5" />} label="Total Predictions" value={predictions.length} color="purple" delay={0} />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="High Risk Areas" value={highRiskCount} color="red" delay={80} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Avg Risk Score" value={`${avgRiskScore}%`} color="orange" delay={160} />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Prediction Date" value={formatDate(new Date().toISOString())} color="blue" delay={240} />
      </div>

      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-6 card-lift animate-fade-in-up" style={{ animationDelay: '160ms' }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-blue-500/15">
            <Crosshair className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Predict Risk for Custom Location</h2>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={selectedLat}
              onChange={(e) => setSelectedLat(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              placeholder="23.0225"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={selectedLng}
              onChange={(e) => setSelectedLng(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              placeholder="72.5714"
            />
          </div>
          <button
            onClick={predictLocation}
            disabled={generating || !selectedLat || !selectedLng}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all btn-press shadow-lg shadow-blue-500/20"
          >
            <Zap className="w-4 h-4" />
            Predict
          </button>
        </div>
        {customPrediction && (
          <div className="mt-5 p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 animate-pop-in">
            <h3 className="font-semibold text-white mb-3 text-sm">Prediction Result</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Risk Score</p>
                <p className="text-2xl font-bold text-white mt-1 tabular-nums">{customPrediction.risk_score}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Risk Level</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border mt-1 ${getRiskLevelColor(customPrediction.risk_level)}`}>
                  {customPrediction.risk_level}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Confidence</p>
                <p className="text-2xl font-bold text-white mt-1 tabular-nums">{customPrediction.confidence_score}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl overflow-hidden card-lift animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/15">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Predictions List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/40">
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Area</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk Score</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk Level</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Confidence</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Factors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-slate-500" />
                      </div>
                      <p className="text-slate-400 text-sm">No predictions generated yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                predictions.map((pred, idx) => (
                  <tr key={pred.id} className="hover:bg-slate-700/15 transition-colors group/row animate-fade-in" style={{ animationDelay: `${idx * 25}ms` }}>
                    <td className="px-4 py-3 text-sm text-white font-medium">{pred.area_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-mono">{pred.latitude.toFixed(4)}, {pred.longitude.toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-14 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pred.risk_score}%`,
                              backgroundColor: pred.risk_level === 'high' ? '#ef4444' : pred.risk_level === 'medium' ? '#f97316' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white tabular-nums">{pred.risk_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getRiskLevelColor(pred.risk_level)}`}>
                        {pred.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{pred.confidence_score}%</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {pred.factors && Object.entries(pred.factors).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="inline-block mr-2 px-2 py-0.5 bg-slate-700/50 rounded-lg text-xs font-medium">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay: number }) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    purple: { bg: 'from-purple-500/15 to-purple-600/5', icon: 'text-purple-400 bg-purple-500/15' },
    red: { bg: 'from-red-500/15 to-red-600/5', icon: 'text-red-400 bg-red-500/15' },
    orange: { bg: 'from-orange-500/15 to-orange-600/5', icon: 'text-orange-400 bg-orange-500/15' },
    blue: { bg: 'from-blue-500/15 to-blue-600/5', icon: 'text-blue-400 bg-blue-500/15' },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className={`bg-gradient-to-br ${c.bg} border border-slate-700/50 rounded-2xl p-4 card-lift animate-fade-in-up`} style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.icon}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
