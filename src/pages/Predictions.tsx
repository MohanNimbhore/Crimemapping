import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Trash2, MapPin, Target, TrendingUp, Calendar, Crosshair, BrainCircuit } from 'lucide-react';
import { api } from '../lib/api';
import type { Crime, Prediction } from '../types';
import { getRiskLevelColor, formatDate } from '../lib/utils';
import { PageLoader, ButtonLoader } from '../components/ui/LoadingSpinner';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const SEV_W: Record<string, number> = { critical: 40, high: 25, medium: 12, low: 5 };

function computeRiskScore(crimes: Crime[], lat: number, lng: number, r = 2) {
  const nearby = crimes.filter((c) => haversineDistance(lat, lng, c.latitude, c.longitude) <= r);
  if (nearby.length === 0) return { score: 10, factors: { crimeCount: 0, severityScore: 0, timeFactor: 0, typeDiversity: 0, radius: r } };
  const n = nearby.length;
  const density = Math.min(n * 3, 30);
  const sev = Math.min(nearby.reduce((s, c) => s + (SEV_W[c.severity] || 5), 0) / Math.max(n, 1), 30);
  const now = Date.now();
  const time = Math.min(nearby.reduce((s, c) => s + Math.max(0, 20 - Math.max(0, (now - new Date(c.crime_date).getTime()) / 86400000) * 0.3), 0) / Math.max(n, 1), 20);
  const types = new Set(nearby.map((c) => c.crime_type));
  const div = Math.min(types.size * 4, 20);
  return { score: Math.min(Math.round(density + sev + time + div), 100), factors: { crimeCount: n, severityScore: Math.round(sev), timeFactor: Math.round(time), typeDiversity: div, uniqueTypes: types.size, radius: r } };
}

function getLevel(s: number): 'low' | 'medium' | 'high' { return s >= 70 ? 'high' : s >= 40 ? 'medium' : 'low'; }
function getConf(score: number, count: number): number { return Math.round((Math.min(count/10,1)*0.6 + Math.abs(score-50)/50*0.4)*100); }

function scoreBarColor(s: number) { return s >= 70 ? '#ef4444' : s >= 40 ? '#f97316' : '#22c55e'; }

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
      const [c, p] = await Promise.all([api.getCrimes({ limit: 1000 }), api.getPredictions()]);
      setCrimes(c.data); setPredictions(p);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const areaMap = new globalThis.Map<string, { lat: number; lng: number; area: string; crimes: Crime[] }>();
      crimes.forEach((c) => {
        const key = `${c.latitude.toFixed(2)}_${c.longitude.toFixed(2)}`;
        if (!areaMap.has(key)) areaMap.set(key, { lat: c.latitude, lng: c.longitude, area: c.area_name, crimes: [] });
        areaMap.get(key)!.crimes.push(c);
      });
      const generated: Partial<Prediction>[] = Array.from(areaMap.values()).slice(0, 15).map(({ lat, lng, area }) => {
        const { score, factors } = computeRiskScore(crimes, lat, lng);
        return {
          area_name: area || `Zone (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          risk_score: score,
          risk_level: getLevel(score),
          prediction_date: new Date().toISOString().split('T')[0],
          confidence_score: getConf(score, (factors.crimeCount as number) || 0),
          factors,
        };
      });
      await api.clearPredictions();
      const saved = await api.savePredictions(generated);
      setPredictions(saved);
    } finally { setGenerating(false); }
  };

  const handleCustomPredict = async () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return;
    setPredicting(true);
    try {
      const { score, factors } = computeRiskScore(crimes, lat, lng);
      const saved = await api.savePredictions([{ area_name: `Custom (${lat.toFixed(4)}, ${lng.toFixed(4)})`, latitude: lat, longitude: lng, risk_score: score, risk_level: getLevel(score), prediction_date: new Date().toISOString().split('T')[0], confidence_score: getConf(score, (factors.crimeCount as number) || 0), factors }]);
      setPredictions((p) => [...saved, ...p]);
      setCustomLat(''); setCustomLng('');
    } catch (err) { console.error(err); }
    finally { setPredicting(false); }
  };

  const handleClear = async () => { try { await api.clearPredictions(); setPredictions([]); } catch (err) { console.error(err); } };

  const highRisk = predictions.filter((p) => p.risk_level === 'high').length;
  const avgScore = predictions.length > 0 ? Math.round(predictions.reduce((s, p) => s + p.risk_score, 0) / predictions.length) : 0;
  const latestDate = predictions.length > 0 ? predictions[0].prediction_date : '—';

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/20">
            <BrainCircuit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Predictions</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">Risk scoring based on crime density, severity, time, and type</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {predictions.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 hover:border-red-300 transition-all btn-press shadow-sm"
            >
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || crimes.length === 0}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-purple-500/20 disabled:opacity-60 btn-press transition-all"
          >
            {generating ? <ButtonLoader /> : <Sparkles className="h-4 w-4 text-white" />}
            Generate Predictions
          </button>
        </div>
      </div>

      {/* Custom predictor */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-purple-200 dark:border-purple-500/30 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-purple-500/15">
            <Crosshair className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Location Prediction</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {[
            { label: 'Latitude', placeholder: '23.0225', val: customLat, set: setCustomLat },
            { label: 'Longitude', placeholder: '72.5714', val: customLng, set: setCustomLng },
          ].map(({ label, placeholder, val, set }) => (
            <div key={label} className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
              <input
                type="number" step="any" placeholder={placeholder} value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
              />
            </div>
          ))}
          <button
            onClick={handleCustomPredict}
            disabled={predicting || !customLat || !customLng}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 disabled:opacity-60 btn-press transition-all"
          >
            {predicting ? <ButtonLoader /> : <Target className="h-4 w-4 text-white" />}
            Predict
          </button>
        </div>
      </div>

      {/* Calm Resting Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Predictions', value: predictions.length, icon: <Sparkles className="h-5 w-5" />, color: '#8b5cf6', border: 'border-purple-200 dark:border-purple-500/30' },
          { label: 'High Risk Areas',   value: highRisk,            icon: <TrendingUp className="h-5 w-5" />, color: '#ef4444', border: 'border-red-200 dark:border-red-500/30' },
          { label: 'Avg Risk Score',    value: `${avgScore}/100`,   icon: <Target className="h-5 w-5" />,    color: '#f97316', border: 'border-orange-200 dark:border-orange-500/30' },
          { label: 'Prediction Date',   value: formatDate(latestDate) || '—', icon: <Calendar className="h-5 w-5" />, color: '#3b82f6', border: 'border-blue-200 dark:border-blue-500/30' },
        ].map(({ label, value, icon, color, border }) => (
          <div
            key={label}
            className={`card-lift bg-white dark:bg-slate-900/90 rounded-2xl border ${border} p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default`}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ color }}>{icon}</span>
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            </div>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {predictions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center py-20 text-center shadow-sm">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <Sparkles className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No predictions generated</h3>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-md">Click "Generate Predictions" to analyze {crimes.length} crime records.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-left">
                  {['Area','Location','Risk Score','Risk Level','Confidence','Factors'].map((h) => (
                    <th key={h} className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {predictions.map((pred) => {
                  const col = scoreBarColor(pred.risk_score);
                  return (
                    <tr key={pred.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400 shrink-0" />{pred.area_name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-500 dark:text-slate-400">{pred.latitude.toFixed(4)}, {pred.longitude.toFixed(4)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pred.risk_score}%`, background: col }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: col }}>{pred.risk_score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${getRiskLevelColor(pred.risk_level)}`}>{pred.risk_level}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">{pred.confidence_score !== null ? `${pred.confidence_score}%` : '—'}</td>
                      <td className="px-4 py-3.5">
                        {pred.factors && (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(pred.factors).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">{k}: {String(v)}</span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
