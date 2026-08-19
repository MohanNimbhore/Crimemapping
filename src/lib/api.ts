import { supabase, isSupabaseConfigured } from './supabase';
import { mockStore } from './mockStore';
import type { Crime, Hotspot, Prediction, PatrolRoute, Alert, User, DashboardStats, CrimeTrend } from '../types';

export const api = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isSupabaseConfigured) {
      return mockStore.getDashboardStats();
    }
    try {
      const { count: totalCrimes } = await supabase.from('crimes').select('*', { count: 'exact', head: true });
      const { count: totalHotspots } = await supabase.from('hotspots').select('*', { count: 'exact', head: true });
      const { count: activeAlerts } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false);
      const { data: highRiskAreas } = await supabase.from('predictions').select('*').gte('risk_score', 70).limit(10);
      const { data: crimeData } = await supabase.from('crimes').select('crime_type, severity, crime_date');

      if (!totalCrimes && !crimeData?.length) {
        return mockStore.getDashboardStats();
      }

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
    } catch {
      return mockStore.getDashboardStats();
    }
  },

  async getCrimes(filters?: {
    type?: string; severity?: string; city?: string; area?: string;
    startDate?: string; endDate?: string; limit?: number; offset?: number;
  }): Promise<{ data: Crime[]; count: number }> {
    if (!isSupabaseConfigured) {
      let data = mockStore.getCrimes();
      if (filters?.type) data = data.filter((c) => c.crime_type === filters.type);
      if (filters?.severity) data = data.filter((c) => c.severity === filters.severity);
      if (filters?.city) data = data.filter((c) => c.city === filters.city);
      if (filters?.area) data = data.filter((c) => c.area_name.toLowerCase().includes(filters.area!.toLowerCase()));
      if (filters?.startDate) data = data.filter((c) => c.crime_date >= filters.startDate!);
      if (filters?.endDate) data = data.filter((c) => c.crime_date <= filters.endDate!);
      const total = data.length;
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 50;
      return { data: data.slice(offset, offset + limit), count: total };
    }
    try {
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
    } catch {
      return this.getCrimes({ ...filters, limit: filters?.limit || 50 });
    }
  },

  async createCrime(crime: Partial<Crime>): Promise<Crime> {
    if (!isSupabaseConfigured) {
      return mockStore.addCrime(crime);
    }
    try {
      const { data, error } = await supabase.from('crimes').insert({ ...crime, status: 'open' }).select().single();
      if (error) throw error;
      return data;
    } catch {
      return mockStore.addCrime(crime);
    }
  },

  async updateCrime(id: string, updates: Partial<Crime>): Promise<Crime> {
    if (!isSupabaseConfigured) {
      return mockStore.updateCrime(id, updates);
    }
    try {
      const { data, error } = await supabase.from('crimes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch {
      return mockStore.updateCrime(id, updates);
    }
  },

  async deleteCrime(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      mockStore.deleteCrime(id);
      return;
    }
    try {
      const { error } = await supabase.from('crimes').delete().eq('id', id);
      if (error) throw error;
    } catch {
      mockStore.deleteCrime(id);
    }
  },

  async searchCrimes(searchTerm: string): Promise<Crime[]> {
    if (!isSupabaseConfigured) {
      const term = searchTerm.toLowerCase();
      return mockStore.getCrimes().filter((c) =>
        c.area_name.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.crime_type.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      ).slice(0, 20);
    }
    try {
      const { data, error } = await supabase
        .from('crimes').select('*')
        .or(`area_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,crime_type.ilike.%${searchTerm}%`)
        .order('crime_date', { ascending: false }).limit(20);
      if (error) throw error;
      return data || [];
    } catch {
      return mockStore.getCrimes().slice(0, 20);
    }
  },

  async getHotspots(): Promise<Hotspot[]> {
    if (!isSupabaseConfigured) {
      return mockStore.getHotspots();
    }
    try {
      const { data, error } = await supabase.from('hotspots').select('*').order('crime_count', { ascending: false });
      if (error || !data?.length) return mockStore.getHotspots();
      return data;
    } catch {
      return mockStore.getHotspots();
    }
  },

  async saveHotspots(hotspots: Partial<Hotspot>[]): Promise<Hotspot[]> {
    if (!isSupabaseConfigured) {
      return mockStore.saveHotspots(hotspots);
    }
    try {
      const { data, error } = await supabase.from('hotspots').insert(hotspots).select();
      if (error) throw error;
      return data || [];
    } catch {
      return mockStore.saveHotspots(hotspots);
    }
  },

  async deleteHotspot(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.from('hotspots').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // ignore
    }
  },

  async clearHotspots(): Promise<void> {
    if (!isSupabaseConfigured) {
      mockStore.setHotspots([]);
      return;
    }
    try {
      const { error } = await supabase.from('hotspots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    } catch {
      mockStore.setHotspots([]);
    }
  },

  async getPredictions(): Promise<Prediction[]> {
    if (!isSupabaseConfigured) {
      return mockStore.getPredictions();
    }
    try {
      const { data, error } = await supabase.from('predictions').select('*').order('risk_score', { ascending: false });
      if (error || !data?.length) return mockStore.getPredictions();
      return data;
    } catch {
      return mockStore.getPredictions();
    }
  },

  async savePredictions(predictions: Partial<Prediction>[]): Promise<Prediction[]> {
    if (!isSupabaseConfigured) {
      return mockStore.savePredictions(predictions);
    }
    try {
      const { data, error } = await supabase.from('predictions').insert(predictions).select();
      if (error) throw error;
      return data || [];
    } catch {
      return mockStore.savePredictions(predictions);
    }
  },

  async clearPredictions(): Promise<void> {
    if (!isSupabaseConfigured) {
      mockStore.setPredictions([]);
      return;
    }
    try {
      const { error } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    } catch {
      mockStore.setPredictions([]);
    }
  },

  async getRoutes(): Promise<PatrolRoute[]> {
    if (!isSupabaseConfigured) {
      return mockStore.getRoutes();
    }
    try {
      const { data, error } = await supabase.from('patrol_routes').select('*').order('created_at', { ascending: false });
      if (error || !data?.length) return mockStore.getRoutes();
      return data;
    } catch {
      return mockStore.getRoutes();
    }
  },

  async saveRoute(route: Partial<PatrolRoute>): Promise<PatrolRoute> {
    if (!isSupabaseConfigured) {
      return mockStore.createRoute(route);
    }
    try {
      const { data, error } = await supabase.from('patrol_routes').insert(route).select().single();
      if (error) throw error;
      return data;
    } catch {
      return mockStore.createRoute(route);
    }
  },

  async deleteRoute(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.from('patrol_routes').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // ignore
    }
  },

  async getAlerts(filters?: { unreadOnly?: boolean; severity?: string }): Promise<Alert[]> {
    if (!isSupabaseConfigured) {
      let alerts = mockStore.getAlerts();
      if (filters?.unreadOnly) alerts = alerts.filter((a) => !a.is_read);
      if (filters?.severity) alerts = alerts.filter((a) => a.severity === filters.severity);
      return alerts;
    }
    try {
      let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });
      if (filters?.unreadOnly) query = query.eq('is_read', false);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      const { data, error } = await query;
      if (error || !data?.length) return mockStore.getAlerts();
      return data;
    } catch {
      return mockStore.getAlerts();
    }
  },

  async markAlertAsRead(id: string): Promise<Alert> {
    if (!isSupabaseConfigured) {
      return mockStore.markAlertRead(id);
    }
    try {
      const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch {
      return mockStore.markAlertRead(id);
    }
  },

  async markAllAlertsAsRead(): Promise<void> {
    if (!isSupabaseConfigured) {
      const alerts = mockStore.getAlerts().map((a) => ({ ...a, is_read: true }));
      mockStore.setAlerts(alerts);
      return;
    }
    try {
      const { error } = await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
      if (error) throw error;
    } catch {
      const alerts = mockStore.getAlerts().map((a) => ({ ...a, is_read: true }));
      mockStore.setAlerts(alerts);
    }
  },

  async deleteAlert(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const alerts = mockStore.getAlerts().filter((a) => a.id !== id);
      mockStore.setAlerts(alerts);
      return;
    }
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
    } catch {
      const alerts = mockStore.getAlerts().filter((a) => a.id !== id);
      mockStore.setAlerts(alerts);
    }
  },

  async getUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) {
      return mockStore.getUsers();
    }
    try {
      const { data, error } = await supabase.from('users').select('id, name, email, role, created_at, updated_at').order('created_at', { ascending: false });
      if (error || !data?.length) return mockStore.getUsers();
      return data;
    } catch {
      return mockStore.getUsers();
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const users = mockStore.getUsers().filter((u) => u.id !== id);
      mockStore.setUsers(users);
      return;
    }
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    } catch {
      const users = mockStore.getUsers().filter((u) => u.id !== id);
      mockStore.setUsers(users);
    }
  },

  async getCrimeTrends(): Promise<CrimeTrend[]> {
    const crimes = isSupabaseConfigured ? (await this.getCrimes({ limit: 1000 })).data : mockStore.getCrimes();
    const trends: Record<string, { total: number; byType: Record<string, number> }> = {};
    crimes.forEach((crime) => {
      const month = (crime.crime_date || '').substring(0, 7) || '2024-01';
      if (!trends[month]) trends[month] = { total: 0, byType: {} };
      trends[month].total++;
      trends[month].byType[crime.crime_type] = (trends[month].byType[crime.crime_type] || 0) + 1;
    });
    return Object.entries(trends).map(([date, d]) => ({ date, total: d.total, byType: d.byType })).sort((a, b) => a.date.localeCompare(b.date));
  },
};

export default api;
