import { create as axiosCreate, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
// eslint-disable-next-line import/no-named-as-default
import env from '../env';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket, setSocketToken } from '../services/socketService';
import { useTripStore } from './../store/tripStore';

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

// Shorter timeout for location updates, standard for everything else
const LOCATION_TIMEOUT = 5000;
const DEFAULT_TIMEOUT = 15000;

const axiosClient = axiosCreate({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: DEFAULT_TIMEOUT,
});

// Attach access token to every request
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Shorter timeout for location update endpoints
    if (config.url?.includes('/location')) {
      config.timeout = LOCATION_TIMEOUT;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh on 401
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (r: unknown) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

const invalidateSession = async () => {
  isRefreshing = false;
  failedQueue = [];
  try {
    await useAuthStore.getState().invalidateSession();
  } catch (e) {
    console.error('[AxiosClient] Failed to invalidate session:', e);
  }
  try {
    disconnectSocket();
  } catch (e) {
    console.error('[AxiosClient] Failed to disconnect socket:', e);
  }
  useTripStore.getState().reset();
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
        await invalidateSession();
        return Promise.reject(error);
      }

      try {
        const res = await axiosClient.post(`${env.API_BASE_URL}/mobile/auth/refresh-token`, {
          token: refreshToken,
        });
        const newAccessToken = res.data.data.accessToken;
        await setAccessToken(newAccessToken);
        // Also refresh the socket token so live tracking keeps working
        try {
          setSocketToken(newAccessToken);
        } catch (e) {
          console.error('[AxiosClient] Failed to refresh socket token:', e);
        }
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        isRefreshing = false;
        return axiosClient(original);
      } catch (refreshError) {
        console.error('[AxiosClient] Token refresh failed:', refreshError);
        await invalidateSession();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

/**
 * Refresh the access token using the stored refresh token and hand the new
 * token to the socket layer. Used by socketService when the server rejects a
 * handshake with an expired access token (no HTTP request needed to trigger
 * the normal 401 interceptor path).
 */
export async function refreshSocketToken(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await invalidateSession();
    throw new Error('No refresh token available');
  }
  const res = await axiosClient.post(`${env.API_BASE_URL}/mobile/auth/refresh-token`, {
    token: refreshToken,
  });
  const newAccessToken = res.data?.data?.accessToken;
  if (!newAccessToken) {
    await invalidateSession();
    throw new Error('Refresh response missing accessToken');
  }
  await setAccessToken(newAccessToken);
  setSocketToken(newAccessToken);
}
