import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';
import { startLocationTracking, stopLocationTracking } from '../../services/locationService';
import { devLog } from '../../utils/log';

export function useStartTrip() {
  const queryClient = useQueryClient();
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setTrackingStatus = useTripStore((state) => state.setTrackingStatus);

  return useMutation({
    mutationFn: async () => {
      setTrackingStatus('starting');
      const { data } = await driverApi.startTrip();
      if (!data.success) throw new Error(data.message);
      const trip = data.data;
      devLog(`[SOCKET][DRIVER] trip started via REST tripId=${trip._id}`);

      // Start background tracking as part of starting the trip, so that a
      // tracking failure (e.g. background location permission missing) reaches
      // the mutation's error path instead of being swallowed inside onSuccess.
      await startLocationTracking(trip._id);

      // Post the current position immediately: the background task only
      // delivers after its distance/time thresholds, and parents should see
      // the bus the moment the trip starts, not minutes later.
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        await driverApi.updateLocation(trip._id, {
          latitude,
          longitude,
          accuracy: accuracy ?? undefined,
          speed: speed ?? undefined,
          heading: heading ?? undefined,
        });
        devLog(
          `[GPS][DRIVER] initial fix posted tripId=${trip._id} lat=${latitude.toFixed(3)} lng=${longitude.toFixed(3)}`,
        );
      } catch (e) {
        // Non-fatal: background tracking will still deliver fixes later.
        console.warn(
          '[GPS][DRIVER] initial fix failed (background task will retry):',
          (e as Error)?.message ?? e,
        );
      }
      return trip;
    },
    onSuccess: (trip) => {
      setCurrentTrip(trip);
      setTrackingStatus('active');
      queryClient.setQueryData(['currentTrip'], trip);
    },
    onError: async (error) => {
      setTrackingStatus('error');
      // Tracking may have partially started — make sure nothing is left running.
      await stopLocationTracking().catch(() => {});
      // The server may still hold an active trip; refetching reconciles the UI.
      queryClient.invalidateQueries({ queryKey: ['currentTrip'] });
      console.error('Failed to start trip:', error);
    },
  });
}
