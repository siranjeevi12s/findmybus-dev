import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../api/parentApi';

export function useStudentBus() {
  return useQuery({
    queryKey: ['studentBus'],
    queryFn: async () => {
      const { data } = await parentApi.getBus();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
