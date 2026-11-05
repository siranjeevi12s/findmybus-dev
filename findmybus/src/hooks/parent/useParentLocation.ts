import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useParentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        // Check current status without prompting
        const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(fgStatus);

        if (fgStatus !== 'granted') {
          // Only request if not already determined
          const { status: requested } = await Location.requestForegroundPermissionsAsync();
          setPermissionStatus(requested);
          if (requested !== 'granted') return;
        }

        const loc = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000 })
          ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
          (newLoc) => {
            setLocation({ latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude });
          }
        );
      } catch (e) {
        // Emulator / provider failures must not surface as unhandled rejections;
        // the map simply renders without the parent marker in that case.
        console.warn('[useParentLocation] Location unavailable:', (e as Error)?.message ?? e);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return { location, permissionStatus };
}
