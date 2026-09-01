import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

export function useSendOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await authApi.sendOtp(email);
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onError: (error: AxiosError<ApiResponse>) => {
      console.error('Send OTP Error:', error.response?.data?.message || error.message);
    },
  });
}
