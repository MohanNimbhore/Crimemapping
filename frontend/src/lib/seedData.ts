import { supabase } from './supabase';

const CRIME_TYPES = ['Theft', 'Robbery', 'Assault', 'Vehicle Theft', 'Cyber Crime', 'Burglary', 'Vandalism', 'Drug Offense', 'Fraud', 'Harassment', 'Domestic Violence', 'Homicide'] as const;
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

const CITIES_COORDINATES: Record<string, { lat: number; lng: number }> = {
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

const CITIES = Object.keys(CITIES_COORDINATES);

const AREA_NAMES = [
  'Maninagar', 'Navrangpura', 'Satellite', 'Bopal', 'Paldi', 'Vastrapur',
  'Thaltej', 'Nikol', 'Chandkheda', 'Bapunagar', 'Isanpur', 'Gota',
  'Odhav', 'Sarkhej', 'Vasna', 'Adajan', 'Varachha', 'Katargam',
  'Vesu', 'City Light', 'Alkapuri', 'Fatehgunj', 'Sayajigunj',
  'Waghodia', 'Kalawad Road', 'Kotecha Chowk', 'Race Course',
  'University Road', 'Sector 7', 'Sector 11', 'Sector 16', 'Sector 21',
  'Infocity', 'Chandlodiya', 'Kankaria', 'Lal Darwaja', 'Ellis Bridge',
  'Ashram Road', 'C.G. Road', 'S.G. Highway',
];

const ALERT_TYPES = [
  'High Crime Alert', 'Theft Alert', 'Assault Alert',
  'Emergency Alert', 'Vehicle Theft Alert', 'Drug Activity Alert',
];

const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randFloat = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

function randomDate(monthsBack = 18): string {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * monthsBack * 30 * 24 * 60 * 60 * 1000);
  return past.toISOString().split('T')[0];
}

function randomTime(): string {
  return `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
}

function weightedSeverity(): typeof SEVERITY_LEVELS[number] {
  const r = Math.random();
  if (r < 0.3) return 'low';
  if (r < 0.7) return 'medium';
  if (r < 0.9) return 'high';
  return 'critical';
}

const DESCRIPTIONS: Record<string, string[]> = {
  Theft: ['Pickpocket at crowded market', 'Shoplifting from retail store', 'Phone snatched while walking'],
  Robbery: ['Armed robbery at convenience store', 'Street robbery with implied threat', 'ATM mugging'],
  Assault: ['Physical altercation outside bar', 'Domestic dispute', 'Gang-related fight'],
  'Vehicle Theft': ['Car stolen from residential area', 'Motorcycle theft', 'Carjacking incident'],
  'Cyber Crime': ['Phishing scam reported', 'Identity theft case', 'Ransomware attack on business'],
  Burglary: ['Residential break-in', 'Commercial burglary after hours', 'Garage theft'],
  Vandalism: ['Graffiti on public building', 'Vehicle vandalism', 'Property damage'],
  'Drug Offense': ['Possession arrest', 'Drug dealing reported', 'Suspicious activity near school'],
  Fraud: ['Investment fraud', 'Insurance fraud', 'Credit card fraud'],
  Harassment: ['Stalking complaint', 'Workplace harassment', 'Online harassment'],
  'Domestic Violence': ['Physical dispute at home', 'Restraining order violation', 'Child endangerment'],
  Homicide: ['Murder reported', 'Suspicious death investigation', 'Fatal stabbing'],
};

export async function autoSeedIfEmpty(): Promise<boolean> {
  const { count } = await supabase.from('crimes').select('*', { count: 'exact', head: true });
  if ((count || 0) > 0) return false; // already has data

  await seedCrimes(500);
  await seedAlerts(30);
  return true;
}

export async function seedCrimes(count = 500): Promise<void> {
  const crimes = [];
  for (let i = 0; i < count; i++) {
    const city = rand(CITIES);
    const base = CITIES_COORDINATES[city];
    const crimeType = rand(CRIME_TYPES);
    const descs = DESCRIPTIONS[crimeType] || ['Incident reported'];
    crimes.push({
      crime_type: crimeType,
      crime_date: randomDate(18),
      crime_time: randomTime(),
      latitude: randFloat(base.lat, 0.1),
      longitude: randFloat(base.lng, 0.1),
      area_name: rand(AREA_NAMES),
      city,
      description: rand(descs),
      severity: weightedSeverity(),
      status: rand(['open', 'investigating', 'resolved', 'closed'] as const),
    });
  }

  // Insert in batches of 100 to avoid payload limits
  for (let i = 0; i < crimes.length; i += 100) {
    const { error } = await supabase.from('crimes').insert(crimes.slice(i, i + 100));
    if (error) throw error;
  }
}

export async function seedAlerts(count = 30): Promise<void> {
  const alerts = [];
  for (let i = 0; i < count; i++) {
    const city = rand(CITIES);
    const base = CITIES_COORDINATES[city];
    const riskScore = Math.round(50 + Math.random() * 50);
    alerts.push({
      alert_type: rand(ALERT_TYPES),
      area_name: rand(AREA_NAMES),
      latitude: randFloat(base.lat, 0.05),
      longitude: randFloat(base.lng, 0.05),
      risk_score: riskScore,
      severity: riskScore >= 90 ? 'critical' : riskScore >= 70 ? 'high' : 'medium',
      message: `High risk area detected. Risk score: ${riskScore}%. Immediate patrol recommended.`,
      is_read: Math.random() > 0.6,
    });
  }
  const { error } = await supabase.from('alerts').insert(alerts);
  if (error) throw error;
}

export async function runSeeding(): Promise<void> {
  await seedCrimes(500);
  await seedAlerts(30);
}
