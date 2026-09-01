import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useParentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (newLoc) => {
          setLocation({ latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude });
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  return location;
}
