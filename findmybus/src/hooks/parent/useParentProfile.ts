import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';

export function useParentProfile() {
  return useQuery({
    queryKey: ['parentProfile'],
    queryFn: async () => {
      const { data } = await parentApi.getProfile();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
