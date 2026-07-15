import { supabase } from '../config/supabase.js';
import { CRIME_TYPES, SEVERITY_LEVELS } from '../config/constants.js';

export interface Crime {
  id: string;
  crime_type: string;
  crime_date: string;
  crime_time: string;
  latitude: number;
  longitude: number;
  area_name: string;
  city: string;
  description: string | null;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CrimeInput {
  crime_type: string;
  crime_date: string;
  crime_time: string;
  latitude: number;
  longitude: number;
  area_name: string;
  city: string;
  description?: string;
  severity: string;
}

export const getCrimes = async (filters?: {
  type?: string;
  severity?: string;
  city?: string;
  area?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from('crimes').select('*', { count: 'exact' });

  if (filters?.type) {
    query = query.eq('crime_type', filters.type);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }
  if (filters?.area) {
    query = query.ilike('area_name', `%${filters.area}%`);
  }
  if (filters?.startDate) {
    query = query.gte('crime_date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('crime_date', filters.endDate);
  }

  query = query.order('crime_date', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data, count };
};

export const getCrimeById = async (id: string) => {
  const { data, error } = await supabase.from('crimes').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
};

export const createCrime = async (crime: CrimeInput) => {
  const { data, error } = await supabase
    .from('crimes')
    .insert({
      ...crime,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCrime = async (id: string, updates: Partial<CrimeInput>) => {
  const { data, error } = await supabase
    .from('crimes')
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

export const deleteCrime = async (id: string) => {
  const { error } = await supabase.from('crimes').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const getCrimeStats = async () => {
  const { data: crimes, error } = await supabase.from('crimes').select('crime_type, severity, crime_date');

  if (error) throw error;

  const typeCount: Record<string, number> = {};
  const severityCount: Record<string, number> = {};
  const monthlyCount: Record<string, number> = {};

  crimes?.forEach((crime) => {
    typeCount[crime.crime_type] = (typeCount[crime.crime_type] || 0) + 1;
    severityCount[crime.severity] = (severityCount[crime.severity] || 0) + 1;

    const month = crime.crime_date.substring(0, 7);
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;
  });

  return {
    total: crimes?.length || 0,
    byType: typeCount,
    bySeverity: severityCount,
    byMonth: monthlyCount,
  };
};

export const searchCrimes = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('crimes')
    .select('*')
    .or(`area_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,crime_type.ilike.%${searchTerm}%`)
    .order('crime_date', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
};

export { CRIME_TYPES, SEVERITY_LEVELS };
