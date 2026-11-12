import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { startLocationTracking } from '../../services/locationService';

export function useCurrentTrip() {
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setTrackingStatus = useTripStore((state) => state.setTrackingStatus);
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: ['currentTrip', userId],
    queryFn: async () => {
      const { data } = await driverApi.getCurrentTrip();
      if (!data.success) throw new Error(data.message);
      
      const trip = data.data;
      setCurrentTrip(trip);
      if (trip && trip.status === 'active') {
        setTrackingStatus('active');
        // Auto-resume native location tracking if app was restarted mid-trip.
        void startLocationTracking(trip._id);
      } else {
        setTrackingStatus('idle');
      }
      
      return trip;
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
}
