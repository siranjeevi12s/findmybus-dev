import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await authApi.getMe();
      if (!data.success) throw new Error(data.message);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
