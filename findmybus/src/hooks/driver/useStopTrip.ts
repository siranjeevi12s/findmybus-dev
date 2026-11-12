import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { stopLocationTracking } from '../../services/locationService';

export function useStopTrip() {
  const queryClient = useQueryClient();
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setTrackingStatus = useTripStore((state) => state.setTrackingStatus);
  const userId = useAuthStore((state) => state.userId);

  return useMutation({
    mutationFn: async (tripId: string) => {
      setTrackingStatus('stopping');
      const { data } = await driverApi.stopTrip(tripId);
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({ queryKey: ['currentTrip', userId] });
      const snapshot = queryClient.getQueryData(['currentTrip', userId]);
      // Optimistically clear before server round-trip.
      setCurrentTrip(null);
      setTrackingStatus('idle');
      queryClient.setQueryData(['currentTrip', userId], null);
      return { snapshot };
    },
    onSuccess: async (_trip) => {
      setCurrentTrip(null);
      setTrackingStatus('idle');
      queryClient.setQueryData(['currentTrip', userId], null);
      queryClient.invalidateQueries({ queryKey: ['currentTrip', userId] });
      // Stop native background tracking after UI reflects stopped state.
      void stopLocationTracking();
    },
    onError: (error, _tripId, context) => {
      setTrackingStatus('active'); // Revert back
      queryClient.setQueryData(['currentTrip', userId], context?.snapshot);
      queryClient.invalidateQueries({ queryKey: ['currentTrip', userId] });
      console.error('Failed to stop trip:', error);
    },
  });
}
