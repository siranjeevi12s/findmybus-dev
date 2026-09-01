import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useTripStore } from '../../store/tripStore';

export function useCurrentTrip() {
  const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);
  const setTrackingStatus = useTripStore((state) => state.setTrackingStatus);

  return useQuery({
    queryKey: ['currentTrip'],
    queryFn: async () => {
      const { data } = await driverApi.getCurrentTrip();
      if (!data.success) throw new Error(data.message);
      
      const trip = data.data;
      setCurrentTrip(trip);
      if (trip && trip.status === 'active') {
        setTrackingStatus('active');
      } else {
        setTrackingStatus('idle');
      }
      
      return trip;
    },
    staleTime: 1 * 60 * 1000,
  });
}
