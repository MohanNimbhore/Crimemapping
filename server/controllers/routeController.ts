import { supabase } from '../config/supabase.js';

export interface PatrolRoute {
  id: string;
  name: string;
  station_latitude: number;
  station_longitude: number;
  station_name: string;
  hotspots: Array<{
    latitude: number;
    longitude: number;
    risk_level: string;
    area_name: string;
  }>;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    order: number;
  }>;
  total_distance: number | null;
  estimated_duration: number | null;
  status: string;
  assigned_officer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Hotspot {
  latitude: number;
  longitude: number;
  risk_level: string;
  area_name: string;
  crime_count?: number;
}

interface Waypoint {
  latitude: number;
  longitude: number;
  order: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const sortByRisk = (hotspots: Hotspot[]): Hotspot[] => {
  const riskPriority: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return [...hotspots].sort((a, b) => {
    const riskDiff = (riskPriority[a.risk_level] ?? 2) - (riskPriority[b.risk_level] ?? 2);
    if (riskDiff !== 0) return riskDiff;
    return (b.crime_count || 0) - (a.crime_count || 0);
  });
};

const nearestNeighborTSP = (start: { lat: number; lng: number }, points: Hotspot[]): Hotspot[] => {
  if (points.length === 0) return [];
  if (points.length === 1) return points;

  const ordered: Hotspot[] = [];
  const remaining = [...points];
  let current = { lat: start.lat, lng: start.lng };

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((point, i) => {
      const dist = calculateDistance(current.lat, current.lng, point.latitude, point.longitude);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });

    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    current = { lat: nearest.latitude, lng: nearest.longitude };
  }

  return ordered;
};

const twoOptImprove = (route: Hotspot[], station: { lat: number; lng: number }): Hotspot[] => {
  if (route.length < 3) return route;

  let improved = true;
  let bestRoute = [...route];

  while (improved) {
    improved = false;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        const newRoute = [...bestRoute];
        const segment = newRoute.splice(i, j - i + 1);
        segment.reverse();
        newRoute.splice(i, 0, ...segment);

        const oldDist = calculateRouteDistance(bestRoute, station);
        const newDist = calculateRouteDistance(newRoute, station);

        if (newDist < oldDist * 0.99) {
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
};

const calculateRouteDistance = (route: Hotspot[], station: { lat: number; lng: number }): number => {
  let distance = 0;
  let current = station;

  for (const point of route) {
    distance += calculateDistance(current.lat, current.lng, point.latitude, point.longitude);
    current = { lat: point.latitude, lng: point.longitude };
  }

  distance += calculateDistance(current.lat, current.lng, station.lat, station.lng);
  return distance;
};

const estimateDuration = (distanceKm: number): number => {
  const avgSpeedKmh = 30;
  const timeHours = distanceKm / avgSpeedKmh;
  const stopTimeMinutes = 10;
  return Math.round(timeHours * 60 + stopTimeMinutes);
};

export const generatePatrolRoute = async (
  station: { latitude: number; longitude: number; name: string },
  hotspots: Hotspot[]
): Promise<Omit<PatrolRoute, 'id' | 'created_at' | 'updated_at'>> => {
  const sortedHotspots = sortByRisk(hotspots);
  const optimizedOrder = nearestNeighborTSP(station, sortedHotspots);
  const improvedOrder = twoOptImprove(optimizedOrder, station);

  const totalDistance = calculateRouteDistance(improvedOrder, station);
  const estimatedDurationVal = estimateDuration(totalDistance);

  const waypoints: Waypoint[] = improvedOrder.map((h, index) => ({
    latitude: h.latitude,
    longitude: h.longitude,
    order: index + 1,
  }));

  waypoints.unshift({
    latitude: station.latitude,
    longitude: station.longitude,
    order: 0,
  });

  waypoints.push({
    latitude: station.latitude,
    longitude: station.longitude,
    order: improvedOrder.length + 1,
  });

  return {
    name: `Patrol Route - ${station.name}`,
    station_latitude: station.latitude,
    station_longitude: station.longitude,
    station_name: station.name,
    hotspots: improvedOrder,
    waypoints,
    total_distance: Math.round(totalDistance * 100) / 100,
    estimated_duration: estimatedDurationVal,
    status: 'active',
    assigned_officer_id: null,
  };
};

export const saveRoute = async (route: Omit<PatrolRoute, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase.from('patrol_routes').insert(route).select().single();

  if (error) throw error;
  return data;
};

export const getRoutes = async () => {
  const { data, error } = await supabase.from('patrol_routes').select('*, assigned_officer:users(name)').order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getRouteById = async (id: string) => {
  const { data, error } = await supabase.from('patrol_routes').select('*, assigned_officer:users(name)').eq('id', id).single();

  if (error) throw error;
  return data;
};

export const updateRoute = async (id: string, updates: Partial<PatrolRoute>) => {
  const { data, error } = await supabase
    .from('patrol_routes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRoute = async (id: string) => {
  const { error } = await supabase.from('patrol_routes').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const assignOfficer = async (routeId: string, officerId: string) => {
  const { data, error } = await supabase.from('patrol_routes').update({ assigned_officer_id: officerId }).eq('id', routeId).select().single();

  if (error) throw error;
  return data;
};
