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

export const STATUS = {
  open: 'open',
  investigating: 'investigating',
  resolved: 'resolved',
  closed: 'closed',
};
