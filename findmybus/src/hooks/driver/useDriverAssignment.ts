import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useAuthStore } from '../../store/authStore';

export function useDriverAssignment() {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: ['driverAssignment', userId],
    queryFn: async () => {
      const { data } = await driverApi.getAssignment();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
