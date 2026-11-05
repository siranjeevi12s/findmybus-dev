import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

export interface OtpError {
  type: 'network' | 'timeout' | 'validation' | 'auth' | 'not_found' | 'rate_limit' | 'server' | 'sms' | 'unknown';
  message: string;
  statusCode?: number;
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (email: string) => {
      try {
        const { data } = await authApi.sendOtp(email.trim().toLowerCase());
        if (!data.success) throw new Error(data.message);
        return data;
      } catch (error) {
        const otpError = classifyError(error as AxiosError<ApiResponse>);
        throw new Error(otpError.message);
      }
    },
    onError: (error: AxiosError<ApiResponse>) => {
      const otpError = classifyError(error);
      console.error('Send OTP Error:', otpError);
    },
  });
}

function classifyError(error: AxiosError<ApiResponse>): OtpError {
  // Network error: no response received at all
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Request timed out. Please check your connection and try again.',
      };
    }
    return {
      type: 'network',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  const { status } = error.response;
  const serverMessage = error.response.data?.message;

  switch (status) {
    case 400:
      return {
        type: 'validation',
        message: serverMessage || 'Invalid request. Please check your email address.',
        statusCode: 400,
      };
    case 401:
      return {
        type: 'auth',
        message: 'Authentication failed. Please try again.',
        statusCode: 401,
      };
    case 403:
      return {
        type: 'auth',
        message: 'Access forbidden. Please contact support.',
        statusCode: 403,
      };
    case 404:
      return {
        type: 'not_found',
        message: serverMessage || 'Email not registered. Contact your school administrator.',
        statusCode: 404,
      };
    case 429:
      return {
        type: 'rate_limit',
        message:
          'Too many requests. Please wait before requesting another code.',
        statusCode: 429,
      };
    case 500:
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        statusCode: 500,
      };
    default:
      if (status && status >= 500) {
        return {
          type: 'server',
          message: 'Server error. Please try again later.',
          statusCode: status,
        };
      }
      return {
        type: 'unknown',
        message: serverMessage || 'An unexpected error occurred. Please try again.',
        statusCode: status,
      };
  }
}
