export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'officer';
  created_at: string;
  updated_at: string;
}

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
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  crime_count: number;
  risk_level: 'low' | 'medium' | 'high';
  area_name: string;
  crime_types: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  area_name: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  prediction_date: string;
  confidence_score: number | null;
  factors: Record<string, unknown> | null;
  created_at: string;
}

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
  status: 'active' | 'inactive' | 'completed';
  assigned_officer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_type: string;
  area_name: string;
  latitude: number | null;
  longitude: number | null;
  risk_score: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_read: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalCrimes: number;
  totalHotspots: number;
  activeAlerts: number;
  highRiskAreas: number;
  crimeDistribution: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byMonth: Record<string, number>;
  };
}

export interface CrimeTrend {
  date: string;
  total: number;
  byType: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export const CRIME_TYPES = [
  'Theft',
  'Robbery',
  'Assault',
  'Vehicle Theft',
  'Cyber Crime',
  'Burglary',
  'Vandalism',
  'Drug Offense',
  'Fraud',
  'Harassment',
  'Domestic Violence',
  'Homicide',
] as const;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

export const ALERT_TYPES = [
  'High Crime Alert',
  'Theft Alert',
  'Assault Alert',
  'Emergency Alert',
  'Vehicle Theft Alert',
  'Drug Activity Alert',
] as const;

// India cities with coordinates
export const CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Chennai',
  'Kolkata',
];

export const CITIES_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
};

// Gujarat cities (subset for Gujarat-specific views)
export const GUJARAT_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
];

export const GUJARAT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Rajkot: { lat: 22.3039, lng: 70.8022 },
  Gandhinagar: { lat: 23.2156, lng: 72.6369 },
};

export const AREA_NAMES = [
  'Maninagar',
  'Navrangpura',
  'Satellite',
  'Bopal',
  'Paldi',
  'Vastrapur',
  'Thaltej',
  'Nikol',
  'Chandkheda',
  'Bapunagar',
  'Isanpur',
  'Gota',
  'Odhav',
  'Sarkhej',
  'Vasna',
  'Adajan',
  'Varachha',
  'Katargam',
  'Vesu',
  'City Light',
  'Alkapuri',
  'Fatehgunj',
  'Sayajigunj',
  'Waghodia',
  'Kalawad Road',
  'Kotecha Chowk',
  'Race Course',
  'University Road',
  'Sector 7',
  'Sector 11',
  'Sector 16',
  'Sector 21',
  'Infocity',
  'Chandlodiya',
  'Kankaria',
  'Lal Darwaja',
  'Ellis Bridge',
  'Ashram Road',
  'C.G. Road',
  'S.G. Highway',
];

export const COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
  critical: '#dc2626',
};
