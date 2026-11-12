import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../api/driverApi';
import { useAuthStore } from '../../store/authStore';

export function useDriverProfile() {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: ['driverProfile', userId],
    queryFn: async () => {
      const { data } = await driverApi.getProfile();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
