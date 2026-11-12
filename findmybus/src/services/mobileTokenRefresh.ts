import * as SecureStore from 'expo-secure-store';
import env from '../env';

const ACCESS_TOKEN_KEY = 'findmybus_access_token';
const REFRESH_TOKEN_KEY = 'findmybus_refresh_token';

let refreshPromise: Promise<string> | null = null;

export const refreshMobileAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      const error = new Error('Refresh token is invalid or expired. Please log in again.');
      error.name = 'InvalidRefreshTokenError';
      throw error;
    }

    const response = await fetch(`${env.API_BASE_URL}/mobile/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken }),
    });
    const json = await response.json() as {
      success?: boolean;
      data?: { accessToken?: string; refreshToken?: string };
      message?: string;
    };

    if (!response.ok || !json.success || !json.data?.accessToken) {
      const error = new Error(json.message || 'Refresh token is invalid or expired. Please log in again.');
      error.name = 'InvalidRefreshTokenError';
      throw error;
    }

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, json.data.accessToken);
    if (json.data.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, json.data.refreshToken);
    }
    return json.data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};
