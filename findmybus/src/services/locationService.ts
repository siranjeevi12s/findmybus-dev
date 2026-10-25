import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { tripApi } from '../api/tripApi';
import { enqueueLocation, dequeueAll } from './locationQueue';
import { isAccurateLocation, shouldUpdateLocation } from '../utils/locationFilter';

export const BACKGROUND_LOCATION_TASK = 'FINDMYBUS_BACKGROUND_LOCATION';

/**
 * The background location task is executed in a *separate* JS context from the
 * UI (Android headless task). Module-level variables set while the app was in
 * the foreground are therefore NOT visible to it, so the active trip id and the
 * last reported point have to be persisted instead of held in memory.
 */
const ACTIVE_TRIP_KEY = 'findmybus_active_trip_id';
const LAST_POINT_KEY = 'findmybus_last_reported_point';

type Point = { latitude: number; longitude: number };

async function readActiveTripId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
  } catch {
    return null;
  }
}

async function writeActiveTripId(tripId: string | null): Promise<void> {
  try {
    if (tripId) await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);
    else await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
  } catch {}
}

async function readLastPoint(): Promise<Point | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_POINT_KEY);
    return raw ? (JSON.parse(raw) as Point) : null;
  } catch {
    return null;
  }
}

async function writeLastPoint(point: Point | null): Promise<void> {
  try {
    if (point) await AsyncStorage.setItem(LAST_POINT_KEY, JSON.stringify(point));
    else await AsyncStorage.removeItem(LAST_POINT_KEY);
  } catch {}
}

// Define the background task — must be at module top level
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
  if (error) {
    console.warn('[BG Location] Error:', error.message);
    return;
  }

  const activeTripId = await readActiveTripId();
  if (!data || !activeTripId) return;

  const { locations } = data;
  let lastLocation = await readLastPoint();

  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed, heading } = loc.coords;
    if (!isAccurateLocation(accuracy ?? undefined)) continue;
    if (!shouldUpdateLocation(lastLocation, { latitude, longitude })) continue;

    lastLocation = { latitude, longitude };
    await writeLastPoint(lastLocation);
    const payload = { latitude, longitude, accuracy: accuracy ?? undefined, speed: speed ?? undefined, heading: heading ?? undefined };

    try {
      await tripApi.updateLocation(activeTripId, payload);
      // Drain queue if there are pending items
      const queued = await dequeueAll();
      for (const item of queued) {
        try {
          await tripApi.updateLocation(item.tripId, { latitude: item.latitude, longitude: item.longitude, accuracy: item.accuracy, speed: item.speed, heading: item.heading });
        } catch {}
      }
    } catch {
      await enqueueLocation({ tripId: activeTripId, latitude, longitude, accuracy: accuracy ?? undefined, speed: speed ?? undefined, heading: heading ?? undefined, timestamp: loc.timestamp });
    }
  }
});

export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return { foreground: false, background: false };

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  return { foreground: true, background: bgStatus === 'granted' };
}

export async function startLocationTracking(tripId: string): Promise<void> {
  await writeActiveTripId(tripId);
  await writeLastPoint(null);

  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
  if (isRunning) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 10,         // metres
    timeInterval: 5000,            // 5 seconds
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'FindMyBus — Tracking Active',
      notificationBody: 'Your location is being shared with parents.',
      notificationColor: '#22C55E',
    },
    pausesUpdatesAutomatically: false,
  });
}

export async function stopLocationTracking(): Promise<void> {
  await writeActiveTripId(null);
  await writeLastPoint(null);
  const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}

export async function setActiveTripId(tripId: string | null): Promise<void> {
  await writeActiveTripId(tripId);
}
