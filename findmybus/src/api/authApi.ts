import axiosClient from './axiosClient';
import type { ApiResponse, AuthTokens, DriverProfile, ParentProfile } from '../types';

export interface SendOtpResponse { email: string; role: string; }
export interface VerifyOtpResponse extends AuthTokens {
  userId: string;
  role: 'driver' | 'parent';
  email: string;
}

export const authApi = {
  sendOtp: (email: string) =>
    axiosClient.post<ApiResponse<SendOtpResponse>>('/mobile/auth/send-otp', { email }),

  verifyOtp: (email: string, otp: string) =>
    axiosClient.post<ApiResponse<VerifyOtpResponse>>('/mobile/auth/verify-otp', { email, otp }),

  resendOtp: (email: string) =>
    axiosClient.post<ApiResponse<SendOtpResponse>>('/mobile/auth/resend-otp', { email }),

  getMe: () =>
    axiosClient.get<ApiResponse<DriverProfile | ParentProfile>>('/mobile/auth/me'),

  logout: (refreshToken: string) =>
    axiosClient.post<ApiResponse<null>>('/mobile/auth/logout', { token: refreshToken }),

  refreshToken: (token: string) =>
    axiosClient.post<ApiResponse<{ accessToken: string }>>('/mobile/auth/refresh-token', { token }),
};
