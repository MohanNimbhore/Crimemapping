import { supabase } from '../config/supabase.js';

export interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  crime_count: number;
  risk_level: string;
  area_name: string;
  crime_types: Record<string, number>;
  created_at: string;
  updated_at: string;
}

interface ClusterPoint {
  latitude: number;
  longitude: number;
  crime_type: string;
}

interface Cluster {
  center: { lat: number; lng: number };
  points: ClusterPoint[];
  crimeCount: number;
  crimeTypes: Record<string, number>;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
};

const kMeans = (points: ClusterPoint[], k: number, maxIterations: number = 100): Cluster[] => {
  if (points.length === 0) return [];
  if (points.length < k) k = points.length;

  const centroids: { lat: number; lng: number }[] = [];
  const usedIndices = new Set<number>();

  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * points.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push({ lat: points[idx].latitude, lng: points[idx].longitude });
    }
  }

  let iterations = 0;
  let changed = true;

  while (changed && iterations < maxIterations) {
    changed = false;
    const clusters: ClusterPoint[][] = Array.from({ length: k }, () => []);

    points.forEach((point) => {
      let minDist = Infinity;
      let closestCentroid = 0;

      centroids.forEach((centroid, i) => {
        const dist = calculateDistance(point.latitude, point.longitude, centroid.lat, centroid.lng);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = i;
        }
      });

      clusters[closestCentroid].push(point);
    });

    centroids.forEach((centroid, i) => {
      if (clusters[i].length > 0) {
        const newLat = clusters[i].reduce((sum, p) => sum + p.latitude, 0) / clusters[i].length;
        const newLng = clusters[i].reduce((sum, p) => sum + p.longitude, 0) / clusters[i].length;

        if (Math.abs(newLat - centroid.lat) > 0.0001 || Math.abs(newLng - centroid.lng) > 0.0001) {
          changed = true;
          centroids[i] = { lat: newLat, lng: newLng };
        }
      }
    });

    iterations++;
  }

  const finalClusters: Cluster[] = [];
  points.forEach((point) => {
    let minDist = Infinity;
    let closestCentroid = 0;

    centroids.forEach((centroid, i) => {
      const dist = calculateDistance(point.latitude, point.longitude, centroid.lat, centroid.lng);
      if (dist < minDist) {
        minDist = dist;
        closestCentroid = i;
      }
    });

    if (!finalClusters[closestCentroid]) {
      finalClusters[closestCentroid] = {
        center: centroids[closestCentroid],
        points: [],
        crimeCount: 0,
        crimeTypes: {},
      };
    }

    finalClusters[closestCentroid].points.push(point);
    finalClusters[closestCentroid].crimeCount++;
    finalClusters[closestCentroid].crimeTypes[point.crime_type] =
      (finalClusters[closestCentroid].crimeTypes[point.crime_type] || 0) + 1;
  });

  return finalClusters.filter((c) => c && c.crimeCount > 0);
};

const determineRiskLevel = (crimeCount: number): string => {
  if (crimeCount >= 15) return 'high';
  if (crimeCount >= 8) return 'medium';
  return 'low';
};

const calculateRadius = (points: ClusterPoint[], center: { lat: number; lng: number }): number => {
  if (points.length === 0) return 300;

  const distances = points.map((p) => calculateDistance(p.latitude, p.longitude, center.lat, center.lng));
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  const maxDistance = Math.max(...distances);

  return Math.max(300, Math.min(1000, (avgDistance + maxDistance) / 2));
};

export const detectHotspots = async (params?: {
  city?: string;
  k?: number;
  minCrimes?: number;
}): Promise<Hotspot[]> => {
  let query = supabase.from('crimes').select('latitude, longitude, crime_type');

  if (params?.city) {
    query = query.eq('city', params.city);
  }

  const { data: crimes, error } = await query;

  if (error) throw error;
  if (!crimes || crimes.length === 0) return [];

  const points: ClusterPoint[] = crimes.map((c) => ({
    latitude: parseFloat(c.latitude),
    longitude: parseFloat(c.longitude),
    crime_type: c.crime_type,
  }));

  const k = params?.k || Math.max(3, Math.min(15, Math.floor(points.length / 30)));
  const clusters = kMeans(points, k);

  const hotspots: Hotspot[] = clusters.map((cluster, index) => {
    const riskLevel = determineRiskLevel(cluster.crimeCount);
    const radius = calculateRadius(cluster.points, cluster.center);

    return {
      id: `hotspot-${index}`,
      latitude: cluster.center.lat,
      longitude: cluster.center.lng,
      radius,
      crime_count: cluster.crimeCount,
      risk_level: riskLevel,
      area_name: `Hotspot Zone ${index + 1}`,
      crime_types: cluster.crimeTypes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const minCrimes = params?.minCrimes || 3;
  return hotspots.filter((h) => h.crime_count >= minCrimes).sort((a, b) => b.crime_count - a.crime_count);
};

export const getHotspots = async () => {
  const { data, error } = await supabase.from('hotspots').select('*').order('crime_count', { ascending: false });

  if (error) throw error;
  return data;
};

export const saveHotspots = async (hotspots: Omit<Hotspot, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase.from('hotspots').insert(hotspots).select();

  if (error) throw error;
  return data;
};

export const deleteHotspot = async (id: string) => {
  const { error } = await supabase.from('hotspots').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const clearHotspots = async () => {
  const { error } = await supabase.from('hotspots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  return true;
};
