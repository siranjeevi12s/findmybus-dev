import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppEnvironment = 'development' | 'production';

const appEnvironment: AppEnvironment =
  process.env.EXPO_PUBLIC_APP_ENV === 'production' ||
  process.env.APP_ENV === 'production'
    ? 'production'
    : 'development';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const configuredSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const devServerOrigin =
  appEnvironment === 'development'
    ? Platform.OS === 'android' && !Constants.isDevice
      ? 'http://10.0.2.2:5001'
      : metroHost
        ? `http://${metroHost}:5001`
        : undefined
    : undefined;
const apiBaseUrl = devServerOrigin
  ? `${devServerOrigin}/api`
  : configuredApiBaseUrl;
const socketUrl = devServerOrigin ?? configuredSocketUrl;
const maptilerKey =
  process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim() ||
  (Constants.expoConfig?.extra as { maptilerApiKey?: string } | undefined)
    ?.maptilerApiKey?.trim() ||
  '';

if (!apiBaseUrl) {
  throw new Error(
    `EXPO_PUBLIC_API_BASE_URL is required for ${appEnvironment} builds`,
  );
}

if (!socketUrl) {
  throw new Error(
    `EXPO_PUBLIC_SOCKET_URL is required for ${appEnvironment} builds`,
  );
}

if (!maptilerKey) {
  throw new Error(
    `EXPO_PUBLIC_MAPTILER_KEY is required for ${appEnvironment} builds`,
  );
}

const mapStyleUrl =
  process.env.EXPO_PUBLIC_MAPTILER_STYLE_URL?.trim() ||
  `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(maptilerKey)}`;

export const env = {
  API_BASE_URL: apiBaseUrl,
  SOCKET_URL: socketUrl,
  MAPTILER_API_KEY: maptilerKey,
  MAPTILER_STYLE_URL: mapStyleUrl,
} as const;

export default env;
