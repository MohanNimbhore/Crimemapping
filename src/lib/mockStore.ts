import type { Crime, Hotspot, Prediction, PatrolRoute, Alert, User, DashboardStats } from '../types';
import { CITIES, CITIES_COORDINATES, AREA_NAMES, CRIME_TYPES, ALERT_TYPES, SEVERITY_LEVELS } from '../types';

const rand = <T>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randFloat = (base: number, spread: number) => base + (Math.random() - 0.5) * spread;

function randomDate(monthsBack = 12): string {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * monthsBack * 30 * 24 * 60 * 60 * 1000);
  return past.toISOString().split('T')[0];
}

function randomTime(): string {
  return `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
}

function generateInitialCrimes(count = 250): Crime[] {
  const crimes: Crime[] = [];
  for (let i = 1; i <= count; i++) {
    const city = rand(CITIES);
    const coords = CITIES_COORDINATES[city] || { lat: 23.0225, lng: 72.5714 };
    const crimeType = rand(CRIME_TYPES);
    const severity = rand(SEVERITY_LEVELS);
    const area = rand(AREA_NAMES);
    const status = rand(['open', 'investigating', 'resolved', 'closed'] as const);

    crimes.push({
      id: `crime-${i}`,
      crime_type: crimeType,
      crime_date: randomDate(12),
      crime_time: randomTime(),
      latitude: Number((randFloat(coords.lat, 0.08)).toFixed(6)),
      longitude: Number((randFloat(coords.lng, 0.08)).toFixed(6)),
      area_name: area,
      city: city,
      description: `${crimeType} incident reported near ${area}, ${city}. Investigating officer assigned.`,
      severity: severity,
      status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return crimes;
}

function generateInitialAlerts(): Alert[] {
  const alerts: Alert[] = [];
  const city = 'Ahmedabad';
  const coords = CITIES_COORDINATES[city];
  for (let i = 1; i <= 15; i++) {
    const area = rand(AREA_NAMES);
    const score = Math.floor(65 + Math.random() * 32);
    alerts.push({
      id: `alert-${i}`,
      alert_type: rand(ALERT_TYPES),
      area_name: area,
      latitude: Number((randFloat(coords.lat, 0.06)).toFixed(6)),
      longitude: Number((randFloat(coords.lng, 0.06)).toFixed(6)),
      risk_score: score,
      severity: score >= 85 ? 'critical' : score >= 70 ? 'high' : 'medium',
      message: `Surge in incidents detected in ${area}. Risk score: ${score}%. Patrol intensification recommended.`,
      is_read: i > 5,
      acknowledged_at: i > 5 ? new Date().toISOString() : null,
      acknowledged_by: i > 5 ? 'Admin Officer' : null,
      created_at: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    });
  }
  return alerts;
}

function generateInitialHotspots(): Hotspot[] {
  const hotspots: Hotspot[] = [
    {
      id: 'hotspot-1',
      latitude: 23.0338,
      longitude: 72.5850,
      radius: 1200,
      crime_count: 38,
      risk_level: 'high',
      area_name: 'Navrangpura',
      crime_types: { Theft: 18, 'Vehicle Theft': 12, Robbery: 8 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'hotspot-2',
      latitude: 23.0035,
      longitude: 72.5975,
      radius: 950,
      crime_count: 29,
      risk_level: 'high',
      area_name: 'Maninagar',
      crime_types: { Theft: 14, Burglary: 9, Assault: 6 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'hotspot-3',
      latitude: 23.0270,
      longitude: 72.5074,
      radius: 800,
      crime_count: 22,
      risk_level: 'medium',
      area_name: 'Satellite',
      crime_types: { 'Vehicle Theft': 11, 'Cyber Crime': 7, Theft: 4 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'hotspot-4',
      latitude: 23.0380,
      longitude: 72.5290,
      radius: 1100,
      crime_count: 26,
      risk_level: 'high',
      area_name: 'Vastrapur',
      crime_types: { Theft: 12, 'Drug Offense': 8, Harassment: 6 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'hotspot-5',
      latitude: 21.1959,
      longitude: 72.8302,
      radius: 1000,
      crime_count: 31,
      risk_level: 'high',
      area_name: 'Varachha',
      crime_types: { Theft: 15, Robbery: 10, Assault: 6 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];
  return hotspots;
}

function generateInitialPredictions(): Prediction[] {
  return [
    {
      id: 'pred-1',
      area_name: 'Navrangpura',
      latitude: 23.0338,
      longitude: 72.5850,
      risk_score: 84,
      risk_level: 'high',
      prediction_date: new Date().toISOString().split('T')[0],
      confidence_score: 0.88,
      factors: { crime_density: 'Very High', recent_trend: '+18%', night_activity: 'Elevated' },
      created_at: new Date().toISOString(),
    },
    {
      id: 'pred-2',
      area_name: 'Maninagar',
      latitude: 23.0035,
      longitude: 72.5975,
      risk_score: 78,
      risk_level: 'high',
      prediction_date: new Date().toISOString().split('T')[0],
      confidence_score: 0.82,
      factors: { crime_density: 'High', recent_trend: '+12%', night_activity: 'Moderate' },
      created_at: new Date().toISOString(),
    },
    {
      id: 'pred-3',
      area_name: 'Satellite',
      latitude: 23.0270,
      longitude: 72.5074,
      risk_score: 62,
      risk_level: 'medium',
      prediction_date: new Date().toISOString().split('T')[0],
      confidence_score: 0.76,
      factors: { crime_density: 'Moderate', recent_trend: '-4%', night_activity: 'Low' },
      created_at: new Date().toISOString(),
    },
    {
      id: 'pred-4',
      area_name: 'Vastrapur Lake Area',
      latitude: 23.0380,
      longitude: 72.5290,
      risk_score: 72,
      risk_level: 'high',
      prediction_date: new Date().toISOString().split('T')[0],
      confidence_score: 0.79,
      factors: { crime_density: 'High', recent_trend: '+8%', night_activity: 'Elevated' },
      created_at: new Date().toISOString(),
    }
  ];
}

function generateInitialUsers(): User[] {
  return [
    {
      id: 'user-1',
      name: 'Inspector Vikram Patel',
      email: 'admin@crimemapper.com',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user-2',
      name: 'Officer Rajesh Sharma',
      email: 'officer@police.gov.in',
      role: 'officer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user-3',
      name: 'Officer Priya Desai',
      email: 'priya.desai@police.gov.in',
      role: 'officer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];
}

class MockStore {
  private get<T>(key: string, defaultFactory: () => T): T {
    try {
      const val = localStorage.getItem(`crimemapper_${key}`);
      if (val) return JSON.parse(val);
    } catch {
      // ignore
    }
    const def = defaultFactory();
    this.set(key, def);
    return def;
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(`crimemapper_${key}`, JSON.stringify(val));
    } catch {
      // ignore
    }
  }

  getCrimes(): Crime[] {
    return this.get<Crime[]>('crimes', () => generateInitialCrimes(250));
  }

  setCrimes(crimes: Crime[]): void {
    this.set('crimes', crimes);
  }

  addCrime(crime: Partial<Crime>): Crime {
    const crimes = this.getCrimes();
    const newCrime: Crime = {
      id: `crime-${Date.now()}`,
      crime_type: crime.crime_type || 'Theft',
      crime_date: crime.crime_date || new Date().toISOString().split('T')[0],
      crime_time: crime.crime_time || '12:00',
      latitude: Number(crime.latitude) || 23.0225,
      longitude: Number(crime.longitude) || 72.5714,
      area_name: crime.area_name || 'Navrangpura',
      city: crime.city || 'Ahmedabad',
      description: crime.description || 'Reported incident',
      severity: crime.severity || 'medium',
      status: crime.status || 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    crimes.unshift(newCrime);
    this.setCrimes(crimes);
    return newCrime;
  }

  updateCrime(id: string, updates: Partial<Crime>): Crime {
    const crimes = this.getCrimes();
    const index = crimes.findIndex((c) => c.id === id);
    if (index >= 0) {
      crimes[index] = { ...crimes[index], ...updates, updated_at: new Date().toISOString() };
      this.setCrimes(crimes);
      return crimes[index];
    }
    throw new Error('Crime not found');
  }

  deleteCrime(id: string): void {
    const crimes = this.getCrimes().filter((c) => c.id !== id);
    this.setCrimes(crimes);
  }

  getHotspots(): Hotspot[] {
    return this.get<Hotspot[]>('hotspots', () => generateInitialHotspots());
  }

  setHotspots(hotspots: Hotspot[]): void {
    this.set('hotspots', hotspots);
  }

  saveHotspots(newHotspots: Partial<Hotspot>[]): Hotspot[] {
    const created: Hotspot[] = newHotspots.map((h, i) => ({
      id: `hotspot-${Date.now()}-${i}`,
      latitude: h.latitude || 23.0225,
      longitude: h.longitude || 72.5714,
      radius: h.radius || 1000,
      crime_count: h.crime_count || 10,
      risk_level: h.risk_level || 'medium',
      area_name: h.area_name || 'Hotspot Area',
      crime_types: h.crime_types || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.setHotspots(created);
    return created;
  }

  getPredictions(): Prediction[] {
    return this.get<Prediction[]>('predictions', () => generateInitialPredictions());
  }

  setPredictions(preds: Prediction[]): void {
    this.set('predictions', preds);
  }

  savePredictions(newPreds: Partial<Prediction>[]): Prediction[] {
    const created: Prediction[] = newPreds.map((p, i) => ({
      id: `pred-${Date.now()}-${i}`,
      area_name: p.area_name || 'Prediction Area',
      latitude: p.latitude || 23.0225,
      longitude: p.longitude || 72.5714,
      risk_score: p.risk_score || 50,
      risk_level: p.risk_level || 'medium',
      prediction_date: p.prediction_date || new Date().toISOString().split('T')[0],
      confidence_score: p.confidence_score ?? 0.8,
      factors: p.factors || null,
      created_at: new Date().toISOString(),
    }));
    this.setPredictions(created);
    return created;
  }

  getAlerts(): Alert[] {
    return this.get<Alert[]>('alerts', () => generateInitialAlerts());
  }

  setAlerts(alerts: Alert[]): void {
    this.set('alerts', alerts);
  }

  markAlertRead(id: string): Alert {
    const alerts = this.getAlerts();
    const index = alerts.findIndex((a) => a.id === id);
    if (index >= 0) {
      alerts[index].is_read = true;
      alerts[index].acknowledged_at = new Date().toISOString();
      alerts[index].acknowledged_by = 'Admin Officer';
      this.setAlerts(alerts);
      return alerts[index];
    }
    throw new Error('Alert not found');
  }

  createAlert(alert: Partial<Alert>): Alert {
    const alerts = this.getAlerts();
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      alert_type: alert.alert_type || 'High Crime Alert',
      area_name: alert.area_name || 'Area',
      latitude: alert.latitude ?? null,
      longitude: alert.longitude ?? null,
      risk_score: alert.risk_score ?? 75,
      severity: alert.severity || 'high',
      message: alert.message || 'Alert notification',
      is_read: false,
      acknowledged_at: null,
      acknowledged_by: null,
      created_at: new Date().toISOString(),
    };
    alerts.unshift(newAlert);
    this.setAlerts(alerts);
    return newAlert;
  }

  getRoutes(): PatrolRoute[] {
    return this.get<PatrolRoute[]>('routes', () => [
      {
        id: 'route-1',
        name: 'Ahmedabad West Patrol Alpha',
        station_latitude: 23.0338,
        station_longitude: 72.5850,
        station_name: 'Navrangpura Police Station',
        hotspots: [
          { latitude: 23.0338, longitude: 72.5850, risk_level: 'high', area_name: 'Navrangpura' },
          { latitude: 23.0380, longitude: 72.5290, risk_level: 'high', area_name: 'Vastrapur' },
          { latitude: 23.0270, longitude: 72.5074, risk_level: 'medium', area_name: 'Satellite' },
        ],
        waypoints: [
          { latitude: 23.0338, longitude: 72.5850, order: 1 },
          { latitude: 23.0380, longitude: 72.5290, order: 2 },
          { latitude: 23.0270, longitude: 72.5074, order: 3 },
          { latitude: 23.0338, longitude: 72.5850, order: 4 },
        ],
        total_distance: 14.8,
        estimated_duration: 35,
        status: 'active',
        assigned_officer_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]);
  }

  setRoutes(routes: PatrolRoute[]): void {
    this.set('routes', routes);
  }

  createRoute(route: Partial<PatrolRoute>): PatrolRoute {
    const routes = this.getRoutes();
    const newRoute: PatrolRoute = {
      id: `route-${Date.now()}`,
      name: route.name || 'Optimized Patrol Route',
      station_latitude: route.station_latitude || 23.0225,
      station_longitude: route.station_longitude || 72.5714,
      station_name: route.station_name || 'Central Police Station',
      hotspots: route.hotspots || [],
      waypoints: route.waypoints || [],
      total_distance: route.total_distance ?? 12.5,
      estimated_duration: route.estimated_duration ?? 30,
      status: route.status || 'active',
      assigned_officer_id: route.assigned_officer_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    routes.unshift(newRoute);
    this.setRoutes(routes);
    return newRoute;
  }

  getUsers(): User[] {
    return this.get<User[]>('users', () => generateInitialUsers());
  }

  setUsers(users: User[]): void {
    this.set('users', users);
  }

  getDashboardStats(): DashboardStats {
    const crimes = this.getCrimes();
    const hotspots = this.getHotspots();
    const alerts = this.getAlerts();
    const predictions = this.getPredictions();

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    crimes.forEach((crime) => {
      byType[crime.crime_type] = (byType[crime.crime_type] || 0) + 1;
      bySeverity[crime.severity] = (bySeverity[crime.severity] || 0) + 1;
      const month = (crime.crime_date || '').substring(0, 7) || '2024-01';
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    const highRiskAreas = predictions.filter((p) => p.risk_score >= 70).length;

    return {
      totalCrimes: crimes.length,
      totalHotspots: hotspots.length,
      activeAlerts: alerts.filter((a) => !a.is_read).length,
      highRiskAreas,
      crimeDistribution: { byType, bySeverity, byMonth },
    };
  }
}

export const mockStore = new MockStore();
