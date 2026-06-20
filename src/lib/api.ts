import { supabase } from './supabase';
import type { Crime, Hotspot, Prediction, PatrolRoute, Alert, User, DashboardStats, CrimeTrend } from '../types';

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    const { count: totalCrimes } = await supabase.from('crimes').select('*', { count: 'exact', head: true });
    const { count: totalHotspots } = await supabase.from('hotspots').select('*', { count: 'exact', head: true });
    const { count: activeAlerts } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false);
    const { data: highRiskAreas } = await supabase.from('predictions').select('*').gte('risk_score', 70).limit(10);
    const { data: crimeData } = await supabase.from('crimes').select('crime_type, severity, crime_date');

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
      crimeDistribution: { byType, bySeverity, byMonth },
    };
  },

  async getCrimes(filters?: {
    type?: string;
    severity?: string;
    city?: string;
    area?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Crime[]; count: number }> {
    let query = supabase.from('crimes').select('*', { count: 'exact' });

    if (filters?.type) query = query.eq('crime_type', filters.type);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.city) query = query.eq('city', filters.city);
    if (filters?.area) query = query.ilike('area_name', `%${filters.area}%`);
    if (filters?.startDate) query = query.gte('crime_date', filters.startDate);
    if (filters?.endDate) query = query.lte('crime_date', filters.endDate);

    query = query.order('crime_date', { ascending: false });

    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getCrimeById(id: string): Promise<Crime> {
    const { data, error } = await supabase.from('crimes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createCrime(crime: Partial<Crime>): Promise<Crime> {
    const { data, error } = await supabase.from('crimes').insert({ ...crime, status: 'open' }).select().single();
    if (error) throw error;
    return data;
  },

  async updateCrime(id: string, updates: Partial<Crime>): Promise<Crime> {
    const { data, error } = await supabase
      .from('crimes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCrime(id: string): Promise<void> {
    const { error } = await supabase.from('crimes').delete().eq('id', id);
    if (error) throw error;
  },

  async searchCrimes(searchTerm: string): Promise<Crime[]> {
    const { data, error } = await supabase
      .from('crimes')
      .select('*')
      .or(`area_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,crime_type.ilike.%${searchTerm}%`)
      .order('crime_date', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async getHotspots(): Promise<Hotspot[]> {
    const { data, error } = await supabase.from('hotspots').select('*').order('crime_count', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async saveHotspots(hotspots: Partial<Hotspot>[]): Promise<Hotspot[]> {
    const { data, error } = await supabase.from('hotspots').insert(hotspots).select();
    if (error) throw error;
    return data || [];
  },

  async deleteHotspot(id: string): Promise<void> {
    const { error } = await supabase.from('hotspots').delete().eq('id', id);
    if (error) throw error;
  },

  async clearHotspots(): Promise<void> {
    const { error } = await supabase.from('hotspots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },

  async getPredictions(): Promise<Prediction[]> {
    const { data, error } = await supabase.from('predictions').select('*').order('risk_score', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async savePredictions(predictions: Partial<Prediction>[]): Promise<Prediction[]> {
    const { data, error } = await supabase.from('predictions').insert(predictions).select();
    if (error) throw error;
    return data || [];
  },

  async clearPredictions(): Promise<void> {
    const { error } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },

  async getRoutes(): Promise<PatrolRoute[]> {
    const { data, error } = await supabase.from('patrol_routes').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getRouteById(id: string): Promise<PatrolRoute> {
    const { data, error } = await supabase.from('patrol_routes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async saveRoute(route: Partial<PatrolRoute>): Promise<PatrolRoute> {
    const { data, error } = await supabase.from('patrol_routes').insert(route).select().single();
    if (error) throw error;
    return data;
  },

  async deleteRoute(id: string): Promise<void> {
    const { error } = await supabase.from('patrol_routes').delete().eq('id', id);
    if (error) throw error;
  },

  async getAlerts(filters?: { unreadOnly?: boolean; severity?: string }): Promise<Alert[]> {
    let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });
    if (filters?.unreadOnly) query = query.eq('is_read', false);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createAlert(alert: Partial<Alert>): Promise<Alert> {
    const { data, error } = await supabase.from('alerts').insert(alert).select().single();
    if (error) throw error;
    return data;
  },

  async markAlertAsRead(id: string): Promise<Alert> {
    const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async markAllAlertsAsRead(): Promise<void> {
    const { error } = await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
    if (error) throw error;
  },

  async deleteAlert(id: string): Promise<void> {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;
  },

  async clearAlerts(): Promise<void> {
    const { error } = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('id, name, email, role, created_at, updated_at').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createUser(user: Partial<User> & { password: string }): Promise<User> {
    const { data, error } = await supabase.from('users').insert(user).select('id, name, email, role, created_at, updated_at').single();
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, role, created_at, updated_at')
      .single();
    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async getCrimeTrends(): Promise<CrimeTrend[]> {
    const { data, error } = await supabase.from('crimes').select('crime_date, crime_type').order('crime_date', { ascending: true });
    if (error) throw error;

    const trends: Record<string, { total: number; byType: Record<string, number> }> = {};
    data?.forEach((crime) => {
      const month = crime.crime_date.substring(0, 7);
      if (!trends[month]) trends[month] = { total: 0, byType: {} };
      trends[month].total++;
      trends[month].byType[crime.crime_type] = (trends[month].byType[crime.crime_type] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, d]) => ({ date, total: d.total, byType: d.byType }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

export default api;
