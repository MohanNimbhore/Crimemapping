import { supabase } from '../config/supabase.js';
import { ALERT_TYPES } from '../config/constants.js';

export interface Alert {
  id: string;
  alert_type: string;
  area_name: string;
  latitude: number | null;
  longitude: number | null;
  risk_score: number | null;
  severity: string;
  message: string;
  is_read: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

interface AlertInput {
  alert_type: string;
  area_name: string;
  latitude?: number;
  longitude?: number;
  risk_score?: number;
  severity: string;
  message: string;
}

export const generateAlerts = async (threshold: number = 80): Promise<AlertInput[]> => {
  const { data: predictions, error } = await supabase.from('predictions').select('*').gte('risk_score', threshold).order('risk_score', { ascending: false });

  if (error) throw error;
  if (!predictions || predictions.length === 0) return [];

  const alerts: AlertInput[] = [];
  const now = new Date();

  predictions.forEach((pred) => {
    let alertType = 'High Crime Alert';
    if (pred.risk_score >= 90) {
      alertType = 'Emergency Alert';
    } else if (pred.factors?.crimeType === 'Theft') {
      alertType = 'Theft Alert';
    } else if (pred.factors?.crimeType === 'Assault') {
      alertType = 'Assault Alert';
    } else if (pred.factors?.crimeType === 'Vehicle Theft') {
      alertType = 'Vehicle Theft Alert';
    }

    const severity = pred.risk_score >= 90 ? 'critical' : pred.risk_score >= 80 ? 'high' : pred.risk_score >= 60 ? 'medium' : 'low';

    alerts.push({
      alert_type: alertType,
      area_name: pred.area_name,
      latitude: pred.latitude,
      longitude: pred.longitude,
      risk_score: pred.risk_score,
      severity,
      message: `High risk area detected in ${pred.area_name}. Risk score: ${pred.risk_score}%. Immediate patrol recommended.`,
    });
  });

  return alerts;
};

export const createAlert = async (alert: AlertInput) => {
  const { data, error } = await supabase.from('alerts').insert(alert).select().single();

  if (error) throw error;
  return data;
};

export const getAlerts = async (filters?: { unreadOnly?: boolean; severity?: string }) => {
  let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });

  if (filters?.unreadOnly) {
    query = query.eq('is_read', false);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const markAlertAsRead = async (id: string) => {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const acknowledgeAlert = async (id: string, officerId: string) => {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_read: true,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: officerId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAlert = async (id: string) => {
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) throw error;
  return true;
};

export const clearAllAlerts = async () => {
  const { error } = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  return true;
};

export const markAllAsRead = async () => {
  const { data, error } = await supabase.from('alerts').update({ is_read: true }).eq('is_read', false).select();

  if (error) throw error;
  return data;
};

export { ALERT_TYPES };
