import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';
import { stopLocationTracking } from '../../services/locationService';

export function useStopTrip() {
  const queryClient = useQueryClient();
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setTrackingStatus = useTripStore((state) => state.setTrackingStatus);

  return useMutation({
    mutationFn: async (tripId: string) => {
      setTrackingStatus('stopping');
      const { data } = await driverApi.stopTrip(tripId);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onSuccess: async (trip) => {
      setCurrentTrip(null);
      setTrackingStatus('idle');
      queryClient.setQueryData(['currentTrip'], null);
      
      // Stop background location updates
      await stopLocationTracking();
    },
    onError: (error) => {
      setTrackingStatus('active'); // Revert back
      console.error('Failed to stop trip:', error);
    },
  });
}
