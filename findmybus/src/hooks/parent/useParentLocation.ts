import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useParentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        // Emulator fused provider can briefly report "location unavailable"
        // (uncaught -> dev red error badge), so retry instead of throwing.
        // Emulator fused/network provider is often unavailable — High uses
        // GPS (works with `adb emu geo fix`), Balanced needs network.
        for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            if (!cancelled) setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            break;
          } catch (e) {
            if (attempt === 4) console.warn('[Parent] current location unavailable, watching for updates instead');
            else await new Promise((r) => setTimeout(r, 2000));
          }
        }

        if (!cancelled) {
          try {
            subscription = await Location.watchPositionAsync(
              { accuracy: Location.Accuracy.High, distanceInterval: 10 },
              (newLoc) => {
                setLocation({ latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude });
              }
            );
          } catch (e) {
            console.warn('[Parent] watchPosition failed:', e instanceof Error ? e.message : e);
          }
        }
      } catch (e) {
        console.warn('[Parent] location setup failed:', e instanceof Error ? e.message : e);
      }
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, []);

  return location;
}
