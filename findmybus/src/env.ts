import Constants from 'expo-constants';

const REMOTE_ORIGIN = 'https://app-find-my-bus-gchga4hcdce2evdw.eastasia-01.azurewebsites.net';

const ENV = {
  development: {
    API_BASE_URL: `${REMOTE_ORIGIN}/api`,
    SOCKET_URL: REMOTE_ORIGIN,
    MAPTILER_API_KEY: 'avboMAhwkXpDoiOqq2oD',
    MAPTILER_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json?key=avboMAhwkXpDoiOqq2oD',
  },
  staging: {
    API_BASE_URL: `${REMOTE_ORIGIN}/api`,
    SOCKET_URL: REMOTE_ORIGIN,
    MAPTILER_API_KEY: 'avboMAhwkXpDoiOqq2oD',
    MAPTILER_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json?key=avboMAhwkXpDoiOqq2oD',
  },
  production: {
    API_BASE_URL: `${REMOTE_ORIGIN}/api`,
    SOCKET_URL: REMOTE_ORIGIN,
    MAPTILER_API_KEY: 'avboMAhwkXpDoiOqq2oD',
    MAPTILER_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json?key=avboMAhwkXpDoiOqq2oD',
  },
};

type EnvKey = keyof typeof ENV;

const getEnv = (): typeof ENV.development => {
  const releaseChannel = (Constants.expoConfig?.extra?.releaseChannel as string) ?? 'development';
  const key: EnvKey = (releaseChannel as EnvKey) in ENV ? (releaseChannel as EnvKey) : 'development';
  return ENV[key];
};

export const env = getEnv();
export default env;
