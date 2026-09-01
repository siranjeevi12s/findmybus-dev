import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import env from '../env';

const SECURE_KEYS = {
  ACCESS_TOKEN: 'findmybus_access_token',
  REFRESH_TOKEN: 'findmybus_refresh_token',
};

export const getAccessToken = () => SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
export const setAccessToken = (token: string) => SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, token);
export const setRefreshToken = (token: string) => SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
};

const axiosClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token to every request
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (r: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return axiosClient(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        await clearTokens();
        // Event should be emitted to auth store if needed
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${env.API_BASE_URL}/mobile/auth/refresh-token`, {
          token: refreshToken,
        });
        const newAccessToken = res.data.data.accessToken;
        await setAccessToken(newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return axiosClient(original);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
