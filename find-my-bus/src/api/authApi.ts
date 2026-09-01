import axiosClient from './axiosClient';

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface SchoolData {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  school: SchoolData;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const registerSchool = async (payload: RegisterPayload): Promise<ApiResponse<{ email: string }>> => {
  const response = await axiosClient.post('/auth/register', payload);
  return response.data;
};

export const verifyOtp = async (payload: VerifyOtpPayload): Promise<ApiResponse<AuthResponseData>> => {
  const response = await axiosClient.post('/auth/verify-otp', payload);
  return response.data;
};

export const resendOtp = async (email: string): Promise<ApiResponse<{ email: string }>> => {
  const response = await axiosClient.post('/auth/resend-otp', { email });
  return response.data;
};

export const loginSchool = async (payload: LoginPayload): Promise<ApiResponse<AuthResponseData>> => {
  const response = await axiosClient.post('/auth/login', payload);
  return response.data;
};

export const logoutSchool = async (token: string): Promise<ApiResponse<void>> => {
  const response = await axiosClient.post('/auth/logout', { token });
  return response.data;
};

export const getMe = async (): Promise<ApiResponse<{ school: SchoolData }>> => {
  const response = await axiosClient.get('/auth/me');
  return response.data;
};
