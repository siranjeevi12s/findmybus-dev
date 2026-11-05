import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
// driverApi is imported lazily (dynamic import) to break the require cycle:
// authStore → locationService → driverApi → axiosClient → authStore
import { enqueueLocation, dequeueAndClear } from './locationQueue';
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
const BG_ERROR_KEY = 'findmybus_bg_location_error';

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
    // Persist error flag so the foreground app can detect background tracking failure
    try {
      await AsyncStorage.setItem(BG_ERROR_KEY, JSON.stringify({
        message: error.message,
        timestamp: Date.now(),
      }));
    } catch {}
    return;
  }

  // Clear any previous background error on successful task invocation
  try {
    await AsyncStorage.removeItem(BG_ERROR_KEY);
  } catch {}

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
    const payload = {
      latitude,
      longitude,
      accuracy: accuracy ?? undefined,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
      timestamp: loc.timestamp,
    };

      try {
        const { driverApi } = await import('../api/driverApi');
        await driverApi.updateLocation(activeTripId, payload);
        console.log(
          `[GPS][DRIVER] posted tripId=${activeTripId} lat=${latitude.toFixed(3)} lng=${longitude.toFixed(3)} acc=${accuracy ?? 'n/a'}`,
        );
        // Drain queue if there are pending items — send with original timestamps
        const queued = await dequeueAndClear();
        for (const item of queued) {
          try {
            const { driverApi: api } = await import('../api/driverApi');
            await api.updateLocation(item.tripId, {
              latitude: item.latitude,
              longitude: item.longitude,
              accuracy: item.accuracy,
              speed: item.speed,
              heading: item.heading,
              timestamp: item.timestamp, // preserve original capture time
            });
          } catch {
            // Re-queue any items that failed to send
            await enqueueLocation(item);
          }
        }
        // Only clear queue after all items successfully sent.
        // dequeueAndClear already removed them, so if allSent is true we're done.
        // If some failed, they were re-enqueued above.
      } catch {
      console.warn(`[GPS][DRIVER] POST failed, queued for retry tripId=${activeTripId}`);
      await enqueueLocation({
        tripId: activeTripId,
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
        speed: speed ?? undefined,
        heading: heading ?? undefined,
        timestamp: loc.timestamp,
      });
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
    accuracy: Location.Accuracy.High,
    distanceInterval: 10,        // metres — tighter for responsive parent maps
    timeInterval: 15000,         // 15 seconds — guarantees movement even when slow
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

export async function getBackgroundLocationError(): Promise<{ message: string; timestamp: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(BG_ERROR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { message: string; timestamp: number };
  } catch {
    return null;
  }
}

export async function clearBackgroundLocationError(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BG_ERROR_KEY);
  } catch {}
}
