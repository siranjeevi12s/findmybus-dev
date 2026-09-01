import { haversineDistance } from './distance';

/** Estimated time of arrival in minutes (assumes avg bus speed of 20 km/h in city) */
export function estimateETA(
  busLat: number, busLon: number,
  parentLat: number, parentLon: number,
  avgSpeedKmh = 20
): number {
  const distKm = haversineDistance(busLat, busLon, parentLat, parentLon);
  return Math.round((distKm / avgSpeedKmh) * 60);
}

export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
