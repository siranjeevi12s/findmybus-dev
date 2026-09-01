import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';

export function useDriverProfile() {
  return useQuery({
    queryKey: ['driverProfile'],
    queryFn: async () => {
      const { data } = await driverApi.getProfile();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
