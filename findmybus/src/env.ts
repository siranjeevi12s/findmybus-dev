import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra as {
  releaseChannel?: string;
  apiBaseUrl?: string;
  socketUrl?: string;
  maptilerApiKey?: string;
} | undefined;

const releaseChannel = (extra?.releaseChannel as string) ?? 'development';

const maptilerKey =
  extra?.maptilerApiKey ??
  process.env.EXPO_PUBLIC_MAPTILER_KEY ??
  process.env.MAPTILER_API_KEY;
if (!maptilerKey && releaseChannel !== 'development') {
  throw new Error('MAPTILER_API_KEY is required for non-development builds');
}

// ---------------------------------------------------------------------------
// API / socket URL resolution
// ---------------------------------------------------------------------------
// Development (Metro connected):
//   - Android emulator: 10.0.2.2 always routes to the host machine's loopback,
//     so the server works without needing `adb reverse tcp:5001 tcp:5001`.
//   - Physical device: derive the dev machine's LAN IP from Metro's hostUri
//     (e.g. "10.66.204.145:8081"), so the app automatically follows the
//     laptop's Wi-Fi IP instead of a stale hardcoded address.
// Release builds (no Metro): prefer the EXPO_PUBLIC_* env var baked in from
//   .env.<environment>, then app.json extra, then a safe localhost fallback.
// ---------------------------------------------------------------------------
const isAndroidEmulator = Platform.OS === 'android' && !Constants.isDevice;
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];

const devServerOrigin = isAndroidEmulator
  ? 'http://10.0.2.2:5001'
  : metroHost
    ? `http://${metroHost}:5001`
    : null;

const apiBaseUrl =
  (devServerOrigin ? `${devServerOrigin}/api` : undefined) ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  extra?.apiBaseUrl ??
  (releaseChannel === 'development' ? 'http://127.0.0.1:5001/api' : undefined);

const socketUrl =
  devServerOrigin ??
  process.env.EXPO_PUBLIC_SOCKET_URL ??
  extra?.socketUrl ??
  (releaseChannel === 'development' ? 'http://127.0.0.1:5001' : undefined);

if (!apiBaseUrl && releaseChannel !== 'development') {
  throw new Error('apiBaseUrl is required for non-development builds');
}
if (!socketUrl && releaseChannel !== 'development') {
  throw new Error('socketUrl is required for non-development builds');
}

const ENV = {
  development: {
    API_BASE_URL: apiBaseUrl,
    SOCKET_URL: socketUrl,
    MAPTILER_API_KEY: maptilerKey ?? '',
    MAPTILER_STYLE_URL:
      'https://api.maptiler.com/maps/streets-v2/style.json?key=' +
      (maptilerKey ?? ''),
  },
  staging: {
    API_BASE_URL: apiBaseUrl,
    SOCKET_URL: socketUrl,
    MAPTILER_API_KEY: maptilerKey ?? '',
    MAPTILER_STYLE_URL:
      'https://api.maptiler.com/maps/streets-v2/style.json?key=' +
      (maptilerKey ?? ''),
  },
  production: {
    API_BASE_URL: apiBaseUrl,
    SOCKET_URL: socketUrl,
    MAPTILER_API_KEY: maptilerKey ?? '',
    MAPTILER_STYLE_URL:
      'https://api.maptiler.com/maps/streets-v2/style.json?key=' +
      (maptilerKey ?? ''),
  },
} as const;

type EnvKey = keyof typeof ENV;

const key: EnvKey =
  releaseChannel in ENV ? (releaseChannel as EnvKey) : 'development';

if (key !== 'development' && (!ENV[key].API_BASE_URL || !ENV[key].SOCKET_URL)) {
  throw new Error(
    `Missing required API_BASE_URL or SOCKET_URL for ${key} environment`,
  );
}

export const env = ENV[key];
export default ENV[key];
