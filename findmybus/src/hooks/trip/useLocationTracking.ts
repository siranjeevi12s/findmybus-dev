import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useTripStore } from '../../store/tripStore';
import { requestLocationPermissions } from '../../services/locationService';
import { haversineDistance } from '../../utils/distance';

export function useLocationTracking() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState<boolean | null>(null);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [distanceCoveredKm, setDistanceCoveredKm] = useState<number>(0);
  const trackingStatus = useTripStore((state) => state.trackingStatus);
  const lastPointRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    (async () => {
      // Only *read* the current status here. Prompting is driven by the driver
      // pressing "Start Trip" (see ensurePermissions) so the system dialog is
      // tied to a deliberate action rather than appearing on mount.
      const [fg, bg] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);
      setHasPermission(fg.status === 'granted');
      setHasBackgroundPermission(bg.status === 'granted');
    })();
  }, []);

  // Foreground location watch — drives speed/distance display on the driver dashboard.
  useEffect(() => {
    const isActive = trackingStatus === 'active';
    let subscription: Location.LocationSubscription | null = null;

    if (!isActive) {
      lastPointRef.current = null;
      distanceRef.current = 0;
      setCurrentSpeedKmh(0);
      setDistanceCoveredKm(0);
      return;
    }

    (async () => {
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5,
            timeInterval: 1000,
          },
          (loc) => {
            const { latitude, longitude, speed } = loc.coords;
            const speedKmh = speed != null ? Math.max(0, speed * 3.6) : 0;
            setCurrentSpeedKmh(speedKmh);

            const prev = lastPointRef.current;
            if (prev) {
              const distKm = haversineDistance(prev.latitude, prev.longitude, latitude, longitude);
              distanceRef.current += distKm;
              setDistanceCoveredKm(distanceRef.current);
            }
            lastPointRef.current = { latitude, longitude };
          }
        );
      } catch (e) {
        console.warn('[Driver] watchPosition failed:', e instanceof Error ? e.message : e);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [trackingStatus]);

  const ensurePermissions = useCallback(async () => {
    const result = await requestLocationPermissions();
    setHasPermission(result.foreground);
    setHasBackgroundPermission(result.background);
    return result;
  }, []);

  return {
    hasPermission,
    hasBackgroundPermission,
    ensurePermissions,
    isActive: trackingStatus === 'active',
    currentSpeedKmh,
    distanceCoveredKm,
  };
}
