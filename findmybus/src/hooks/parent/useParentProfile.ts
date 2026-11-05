import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';
import { useAuthStore } from '../../store/authStore';

export function useParentProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['parentProfile'],
    queryFn: async () => {
      const { data } = await parentApi.getProfile();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}
