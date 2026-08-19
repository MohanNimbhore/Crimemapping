import { supabase, isSupabaseConfigured } from './supabase';
import { mockStore } from './mockStore';
import { CITIES, CITIES_COORDINATES, AREA_NAMES, CRIME_TYPES, ALERT_TYPES, SEVERITY_LEVELS } from '../types';

const rand = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
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
  if (!isSupabaseConfigured) {
    return false;
  }
  try {
    const { count } = await supabase.from('crimes').select('*', { count: 'exact', head: true });
    if ((count || 0) > 0) return false;
    await seedCrimes(500);
    await seedAlerts(30);
    return true;
  } catch {
    return false;
  }
}

export async function seedCrimes(count = 500): Promise<void> {
  const crimes = [];
  for (let i = 0; i < count; i++) {
    const city = rand(CITIES);
    const base = CITIES_COORDINATES[city] || { lat: 23.0225, lng: 72.5714 };
    const crimeType = rand(CRIME_TYPES);
    const descs = DESCRIPTIONS[crimeType] || ['Incident reported'];
    crimes.push({
      crime_type: crimeType,
      crime_date: randomDate(18),
      crime_time: randomTime(),
      latitude: Number(randFloat(base.lat, 0.1).toFixed(6)),
      longitude: Number(randFloat(base.lng, 0.1).toFixed(6)),
      area_name: rand(AREA_NAMES),
      city,
      description: rand(descs),
      severity: weightedSeverity(),
      status: rand(['open', 'investigating', 'resolved', 'closed'] as const),
    });
  }

  if (!isSupabaseConfigured) {
    mockStore.setCrimes(crimes.map((c, i) => ({
      ...c,
      id: `crime-seeded-${i}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })));
    return;
  }

  for (let i = 0; i < crimes.length; i += 100) {
    const { error } = await supabase.from('crimes').insert(crimes.slice(i, i + 100));
    if (error) throw error;
  }
}

export async function seedAlerts(count = 30): Promise<void> {
  const alerts = [];
  for (let i = 0; i < count; i++) {
    const city = rand(CITIES);
    const base = CITIES_COORDINATES[city] || { lat: 23.0225, lng: 72.5714 };
    const riskScore = Math.round(50 + Math.random() * 50);
    alerts.push({
      alert_type: rand(ALERT_TYPES),
      area_name: rand(AREA_NAMES),
      latitude: Number(randFloat(base.lat, 0.05).toFixed(6)),
      longitude: Number(randFloat(base.lng, 0.05).toFixed(6)),
      risk_score: riskScore,
      severity: (riskScore >= 90 ? 'critical' : riskScore >= 70 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
      message: `High risk area detected. Risk score: ${riskScore}%. Immediate patrol recommended.`,
      is_read: Math.random() > 0.6,
    });
  }

  if (!isSupabaseConfigured) {
    mockStore.setAlerts(alerts.map((a, i) => ({
      ...a,
      id: `alert-seeded-${i}`,
      acknowledged_at: a.is_read ? new Date().toISOString() : null,
      acknowledged_by: a.is_read ? 'Admin Officer' : null,
      created_at: new Date().toISOString(),
    })));
    return;
  }

  const { error } = await supabase.from('alerts').insert(alerts);
  if (error) throw error;
}

export async function runSeeding(): Promise<void> {
  await seedCrimes(500);
  await seedAlerts(30);
}
