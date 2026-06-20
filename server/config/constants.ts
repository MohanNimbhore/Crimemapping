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

export const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose',
];

export const CITIES_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New York': { lat: 40.7128, lng: -74.006 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Phoenix': { lat: 33.4484, lng: -112.074 },
  'Philadelphia': { lat: 39.9526, lng: -75.1652 },
  'San Antonio': { lat: 29.4241, lng: -98.4936 },
  'San Diego': { lat: 32.7157, lng: -117.1611 },
  'Dallas': { lat: 32.7767, lng: -96.797 },
  'San Jose': { lat: 37.3382, lng: -121.8863 },
};

export const AREA_NAMES = [
  'Downtown',
  'Midtown',
  'Uptown',
  'Financial District',
  'Arts District',
  'Industrial Zone',
  'Residential Area',
  'Commercial Hub',
  'University District',
  'Harbor Area',
  'Airport Zone',
  'Shopping Center',
  'Entertainment District',
  'Historic District',
  'Medical Center',
];

export const COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#22c55e',
  critical: '#dc2626',
};

export const STATUS = {
  open: 'open',
  investigating: 'investigating',
  resolved: 'resolved',
  closed: 'closed',
};
