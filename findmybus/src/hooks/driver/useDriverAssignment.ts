import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';

export function useDriverAssignment() {
  return useQuery({
    queryKey: ['driverAssignment'],
    queryFn: async () => {
      const { data } = await driverApi.getAssignment();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
