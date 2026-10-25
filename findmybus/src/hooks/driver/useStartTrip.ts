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
      // Do not await native tracking inside mutation — fire-and-forget so
      // button responds immediately to API result. Failures are handled below.
      void startLocationTracking(trip._id);
      return trip;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['currentTrip'] });
      const snapshot = queryClient.getQueryData(['currentTrip']);
      // Optimistically mark active before server round-trip.
      setTrackingStatus('active');
      return { snapshot };
    },
    onSuccess: (trip) => {
      setCurrentTrip(trip);
      setTrackingStatus('active');
      queryClient.setQueryData(['currentTrip'], trip);
      queryClient.invalidateQueries({ queryKey: ['currentTrip'] });
    },
    onError: async (error, _trip, context) => {
      setTrackingStatus('error');
      queryClient.setQueryData(['currentTrip'], context?.snapshot);
      await stopLocationTracking().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['currentTrip'] });
      console.error('Failed to start trip:', error);
    },
  });
}
