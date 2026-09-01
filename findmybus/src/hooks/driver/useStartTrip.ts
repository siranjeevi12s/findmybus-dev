import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';
import { startLocationTracking, stopLocationTracking } from '../../services/locationService';

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

      // Start background tracking as part of starting the trip, so that a
      // tracking failure (e.g. background location permission missing) reaches
      // the mutation's error path instead of being swallowed inside onSuccess.
      await startLocationTracking(trip._id);
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
