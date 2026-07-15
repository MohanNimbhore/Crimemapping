import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-400 bg-red-950/50 border-red-500/50';
    case 'high': return 'text-orange-400 bg-orange-950/50 border-orange-500/50';
    case 'medium': return 'text-yellow-400 bg-yellow-950/50 border-yellow-500/50';
    case 'low': return 'text-green-400 bg-green-950/50 border-green-500/50';
    default: return 'text-gray-400 bg-gray-950/50 border-gray-500/50';
  }
}

export function getRiskLevelColor(level: string): string {
  switch (level) {
    case 'high': return 'text-red-400 bg-red-950/50 border-red-500/50';
    case 'medium': return 'text-orange-400 bg-orange-950/50 border-orange-500/50';
    case 'low': return 'text-green-400 bg-green-950/50 border-green-500/50';
    default: return 'text-gray-400 bg-gray-950/50 border-gray-500/50';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'closed':
    case 'resolved': return 'text-green-400 bg-green-950/50 border-green-500/50';
    case 'investigating': return 'text-blue-400 bg-blue-950/50 border-blue-500/50';
    case 'open':
    default: return 'text-yellow-400 bg-yellow-950/50 border-yellow-500/50';
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
