import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useTripStore } from '../../store/tripStore';
import { requestLocationPermissions } from '../../services/locationService';

export function useLocationTracking() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState<boolean | null>(null);
  const trackingStatus = useTripStore((state) => state.trackingStatus);

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
  };
}
