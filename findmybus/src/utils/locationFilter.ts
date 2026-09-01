import { haversineDistance } from './distance';

const MAX_ACCURACY_METRES = 100;
const MIN_DISTANCE_KM = 0.01; // 10 metres
const MAX_JUMP_KM = 0.5;      // 500 metres — if larger, snap instead of animate

export function isAccurateLocation(accuracy?: number): boolean {
  if (accuracy == null) return true;
  return accuracy <= MAX_ACCURACY_METRES;
}

export function shouldUpdateLocation(
  prev: { latitude: number; longitude: number } | null,
  next: { latitude: number; longitude: number }
): boolean {
  if (!prev) return true;
  const dist = haversineDistance(prev.latitude, prev.longitude, next.latitude, next.longitude);
  return dist >= MIN_DISTANCE_KM;
}

export function isLargeJump(
  prev: { latitude: number; longitude: number } | null,
  next: { latitude: number; longitude: number }
): boolean {
  if (!prev) return false;
  const dist = haversineDistance(prev.latitude, prev.longitude, next.latitude, next.longitude);
  return dist > MAX_JUMP_KM;
}
