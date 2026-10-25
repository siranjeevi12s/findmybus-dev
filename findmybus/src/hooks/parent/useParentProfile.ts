import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';
import { useAuthStore } from '../../store/authStore';

export function useParentProfile() {
  const userId = useAuthStore((state) => state.userId);

  return useQuery({
    queryKey: ['parentProfile', userId],
    queryFn: async () => {
      const { data } = await parentApi.getProfile();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
