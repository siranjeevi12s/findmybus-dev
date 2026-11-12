import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

export function useSendOtp() {
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role?: string }) => {
      const { data } = await authApi.sendOtp(email, role);
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onError: (error: AxiosError<ApiResponse>) => {
      console.error('Send OTP Error:', error.response?.data?.message || error.message);
    },
  });
}
