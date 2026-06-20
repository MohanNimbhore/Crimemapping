import { supabase } from '../config/supabase.js';

export interface Prediction {
  id: string;
  area_name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: string;
  prediction_date: string;
  confidence_score: number | null;
  factors: Record<string, unknown> | null;
  created_at: string;
}

interface CrimeData {
  crime_type: string;
  latitude: number;
  longitude: number;
  crime_date: string;
  crime_time: string;
  area_name: string;
  severity: string;
}

interface FeatureSet {
  hour: number;
  dayOfWeek: number;
  month: number;
  crimeTypeEncoded: number;
  latitude: number;
  longitude: number;
  areaCrimeCount: number;
  severityScore: number;
}

const CRIME_TYPE_ENCODING: Record<string, number> = {
  Theft: 1,
  Robbery: 2,
  Assault: 3,
  'Vehicle Theft': 4,
  'Cyber Crime': 5,
  Burglary: 6,
  Vandalism: 7,
  'Drug Offense': 8,
  Fraud: 9,
  Harassment: 10,
  'Domestic Violence': 11,
  Homicide: 12,
};

const SEVERITY_SCORE: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const extractFeatures = (crimes: CrimeData[]): { features: number[][]; labels: number[] } => {
  const areaStats: Record<string, number> = {};
  crimes.forEach((crime) => {
    const areaKey = `${crime.latitude.toFixed(3)},${crime.longitude.toFixed(3)}`;
    areaStats[areaKey] = (areaStats[areaKey] || 0) + 1;
  });

  const features: number[][] = [];
  const labels: number[] = [];

  crimes.forEach((crime) => {
    const date = new Date(crime.crime_date);
    const timeParts = crime.crime_time.split(':');
    const hour = parseInt(timeParts[0], 10);
    const dayOfWeek = date.getDay();
    const month = date.getMonth();

    const areaKey = `${crime.latitude.toFixed(3)},${crime.longitude.toFixed(3)}`;
    const areaCrimeCount = areaStats[areaKey] || 0;
    const severityScore = SEVERITY_SCORE[crime.severity] || 2;
    const crimeTypeEncoded = CRIME_TYPE_ENCODING[crime.crime_type] || 0;

    features.push([hour, dayOfWeek, month, crimeTypeEncoded, crime.latitude, crime.longitude, areaCrimeCount, severityScore]);

    const avgCrimes = Object.values(areaStats).reduce((a, b) => a + b, 0) / Object.keys(areaStats).length;
    labels.push(areaCrimeCount > avgCrimes * 1.5 ? 2 : areaCrimeCount > avgCrimes ? 1 : 0);
  });

  return { features, labels };
};

const calculateRiskScore = (features: number[], modelWeights: number[]): number => {
  let score = 0;
  const normalizedFeatures = features.map((f, i) => {
    const maxVals = [23, 6, 11, 12, 180, 180, 50, 4];
    return f / (maxVals[i] || 1);
  });

  normalizedFeatures.forEach((f, i) => {
    score += f * (modelWeights[i] || 0);
  });

  return Math.min(100, Math.max(0, score * 30 + Math.random() * 20));
};

const determineRiskLevel = (riskScore: number): string => {
  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
};

const generateRiskFactors = (crime: CrimeData, areaStats: Record<string, number>): Record<string, unknown> => {
  const areaKey = `${crime.latitude.toFixed(3)},${crime.longitude.toFixed(3)}`;
  const areaCount = areaStats[areaKey] || 0;
  const date = new Date(crime.crime_date);
  const hour = parseInt(crime.crime_time.split(':')[0], 10);

  return {
    timeRisk: hour >= 20 || hour < 6 ? 'high' : hour >= 16 ? 'medium' : 'low',
    dayRisk: date.getDay() === 0 || date.getDay() === 6 ? 'medium' : 'low',
    areaDensity: areaCount > 10 ? 'high' : areaCount > 5 ? 'medium' : 'low',
    crimeType: crime.crime_type,
    severityLevel: crime.severity,
    recencyFactor: 'recent',
  };
};

export const generatePredictions = async (threshold: number = 0.8): Promise<Prediction[]> => {
  const { data: crimes, error } = await supabase.from('crimes').select('*').order('crime_date', { ascending: false }).limit(1000);

  if (error) throw error;
  if (!crimes || crimes.length < 10) return [];

  const modelWeights = [0.1, 0.05, 0.08, 0.15, 0.12, 0.12, 0.25, 0.13];

  const areaStats: Record<string, number> = {};
  const areaDetails: Record<string, Record<string, unknown>> = {};

  crimes.forEach((crime) => {
    const areaKey = `${parseFloat(crime.latitude).toFixed(3)},${parseFloat(crime.longitude).toFixed(3)}`;
    areaStats[areaKey] = (areaStats[areaKey] || 0) + 1;
    areaDetails[areaKey] = {
      latitude: parseFloat(crime.latitude),
      longitude: parseFloat(crime.longitude),
      area_name: crime.area_name,
    };
  });

  const predictions: Prediction[] = [];
  const processedAreas = new Set<string>();

  crimes.slice(0, 200).forEach((crime) => {
    const areaKey = `${parseFloat(crime.latitude).toFixed(3)},${parseFloat(crime.longitude).toFixed(3)}`;

    if (processedAreas.has(areaKey)) return;
    processedAreas.add(areaKey);

    const features = [
      parseInt(crime.crime_time.split(':')[0], 10),
      new Date(crime.crime_date).getDay(),
      new Date(crime.crime_date).getMonth(),
      CRIME_TYPE_ENCODING[crime.crime_type] || 0,
      parseFloat(crime.latitude),
      parseFloat(crime.longitude),
      areaStats[areaKey] || 0,
      SEVERITY_SCORE[crime.severity] || 2,
    ];

    const riskScore = calculateRiskScore(features, modelWeights);
    const riskLevel = determineRiskLevel(riskScore);

    if (riskScore >= threshold * 100) {
      predictions.push({
        id: `prediction-${predictions.length}`,
        area_name: crime.area_name || `Zone ${predictions.length + 1}`,
        latitude: parseFloat(crime.latitude),
        longitude: parseFloat(crime.longitude),
        risk_score: Math.round(riskScore * 100) / 100,
        risk_level: riskLevel,
        prediction_date: new Date().toISOString().split('T')[0],
        confidence_score: Math.round((70 + Math.random() * 25) * 100) / 100,
        factors: generateRiskFactors(crime, areaStats),
        created_at: new Date().toISOString(),
      });
    }
  });

  return predictions.sort((a, b) => b.risk_score - a.risk_score);
};

export const getPredictions = async () => {
  const { data, error } = await supabase.from('predictions').select('*').order('risk_score', { ascending: false });

  if (error) throw error;
  return data;
};

export const savePredictions = async (predictions: Omit<Prediction, 'id' | 'created_at'>[]) => {
  const { data, error } = await supabase.from('predictions').insert(predictions).select();

  if (error) throw error;
  return data;
};

export const clearPredictions = async () => {
  const { error } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  return true;
};

export const predictForLocation = async (latitude: number, longitude: number): Promise<Prediction> => {
  const { data: crimes, error } = await supabase
    .from('crimes')
    .select('*')
    .gte('latitude', latitude - 0.01)
    .lte('latitude', latitude + 0.01)
    .gte('longitude', longitude - 0.01)
    .lte('longitude', longitude + 0.01)
    .limit(100);

  if (error) throw error;

  const areaCrimeCount = crimes?.length || 0;
  const modelWeights = [0.1, 0.05, 0.08, 0.15, 0.12, 0.12, 0.25, 0.13];
  const now = new Date();

  const features = [
    now.getHours(),
    now.getDay(),
    now.getMonth(),
    0,
    latitude,
    longitude,
    areaCrimeCount,
    2,
  ];

  const riskScore = calculateRiskScore(features, modelWeights);

  return {
    id: `prediction-location`,
    area_name: 'Custom Location',
    latitude,
    longitude,
    risk_score: Math.round(riskScore * 100) / 100,
    risk_level: determineRiskLevel(riskScore),
    prediction_date: new Date().toISOString().split('T')[0],
    confidence_score: Math.round((70 + Math.random() * 25) * 100) / 100,
    factors: {
      areaDensity: areaCrimeCount > 10 ? 'high' : areaCrimeCount > 5 ? 'medium' : 'low',
      nearbyCrimes: areaCrimeCount,
      timeRisk: now.getHours() >= 20 || now.getHours() < 6 ? 'high' : 'medium',
    },
    created_at: new Date().toISOString(),
  };
};
