import { supabase } from '../config/supabase.js';

export const getDashboardStats = async () => {
  const { count: totalCrimes, error: crimesError } = await supabase.from('crimes').select('*', { count: 'exact', head: true });
  if (crimesError) throw crimesError;

  const { count: totalHotspots, error: hotspotsError } = await supabase.from('hotspots').select('*', { count: 'exact', head: true });
  if (hotspotsError) throw hotspotsError;

  const { count: activeAlerts, error: alertsError } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false);
  if (alertsError) throw alertsError;

  const { data: highRiskAreas, error: riskError } = await supabase.from('predictions').select('*').gte('risk_score', 70).limit(10);
  if (riskError) throw riskError;

  const { data: crimeData, error: crimeDataError } = await supabase.from('crimes').select('crime_type, severity, crime_date');
  if (crimeDataError) throw crimeDataError;

  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  crimeData?.forEach((crime) => {
    byType[crime.crime_type] = (byType[crime.crime_type] || 0) + 1;
    bySeverity[crime.severity] = (bySeverity[crime.severity] || 0) + 1;
    const month = crime.crime_date.substring(0, 7);
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  return {
    totalCrimes: totalCrimes || 0,
    totalHotspots: totalHotspots || 0,
    activeAlerts: activeAlerts || 0,
    highRiskAreas: highRiskAreas?.length || 0,
    crimeDistribution: {
      byType,
      bySeverity,
      byMonth,
    },
  };
};

export const getCrimeTrends = async (period: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
  const { data: crimes, error } = await supabase.from('crimes').select('crime_date, crime_type').order('crime_date', { ascending: true });

  if (error) throw error;

  const trends: Record<string, { total: number; byType: Record<string, number> }> = {};

  crimes?.forEach((crime) => {
    let key: string;

    if (period === 'daily') {
      key = crime.crime_date;
    } else if (period === 'weekly') {
      const date = new Date(crime.crime_date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = crime.crime_date.substring(0, 7);
    }

    if (!trends[key]) {
      trends[key] = { total: 0, byType: {} };
    }
    trends[key].total++;
    trends[key].byType[crime.crime_type] = (trends[key].byType[crime.crime_type] || 0) + 1;
  });

  return Object.entries(trends)
    .map(([date, data]) => ({
      date,
      total: data.total,
      byType: data.byType,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getHotspotComparison = async () => {
  const { data: hotspots, error } = await supabase.from('hotspots').select('*').order('crime_count', { ascending: false }).limit(10);

  if (error) throw error;

  return hotspots?.map((h) => ({
    id: h.id,
    area: h.area_name,
    crimeCount: h.crime_count,
    riskLevel: h.risk_level,
    crimeTypes: h.crime_types,
    latitude: h.latitude,
    longitude: h.longitude,
  }));
};

export const getPredictionAccuracy = async () => {
  const { data: predictions, error: predError } = await supabase.from('predictions').select('*').order('prediction_date', { ascending: false }).limit(50);

  if (predError) throw predError;

  const accuracyData =
    predictions?.map((pred) => ({
      area: pred.area_name,
      predictedRisk: pred.risk_level,
      confidence: pred.confidence_score || 0,
      date: pred.prediction_date,
    })) || [];

  const avgConfidence = accuracyData.reduce((sum, p) => sum + p.confidence, 0) / (accuracyData.length || 1);

  return {
    predictions: accuracyData,
    averageConfidence: Math.round(avgConfidence * 100) / 100,
    totalPredictions: accuracyData.length,
  };
};

export const getCrimeHeatmapData = async () => {
  const { data: crimes, error } = await supabase.from('crimes').select('latitude, longitude, severity').limit(1000);

  if (error) throw error;

  return crimes?.map((c) => ({
    lat: parseFloat(c.latitude),
    lng: parseFloat(c.longitude),
    weight: c.severity === 'critical' ? 4 : c.severity === 'high' ? 3 : c.severity === 'medium' ? 2 : 1,
  }));
};

export const getAreaStats = async () => {
  const { data: crimes, error } = await supabase.from('crimes').select('area_name, city, crime_type');

  if (error) throw error;

  const areaStats: Record<string, { total: number; byType: Record<string, number>; cities: Set<string> }> = {};

  crimes?.forEach((crime) => {
    const area = crime.area_name;
    if (!areaStats[area]) {
      areaStats[area] = { total: 0, byType: {}, cities: new Set() };
    }
    areaStats[area].total++;
    areaStats[area].byType[crime.crime_type] = (areaStats[area].byType[crime.crime_type] || 0) + 1;
    areaStats[area].cities.add(crime.city);
  });

  return Object.entries(areaStats)
    .map(([area, data]) => ({
      area,
      total: data.total,
      byType: data.byType,
      cities: Array.from(data.cities),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
};
