import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

export function useVerifyOtp() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      try {
        const { data } = await authApi.verifyOtp(email.trim().toLowerCase(), otp);
        if (!data.success) throw new Error(data.message);
        return data.data;
      } catch (error) {
        const message = (error as AxiosError<ApiResponse>).response?.data?.message;
        throw new Error(message || 'Unable to verify the code. Please try again.');
      }
    },
    onSuccess: async (data) => {
      await login({
        userId: data.userId,
        role: data.role,
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    onError: (error: AxiosError<ApiResponse>) => {
      console.error('Verify OTP Error:', error.response?.data?.message || error.message);
    },
  });
}
