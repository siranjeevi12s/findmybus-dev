/**
 * Dev-only logging helpers for the structured debug traces
 * ([SOCKET][...], [GPS][...], [MAP][...], [NAVIGATION][...]).
 *
 * In production builds (__DEV__ === false) these are silent, so end users
 * never see tracking output or coordinate telemetry. Genuine failure paths
 * (catch blocks / breakage) should keep using console.warn/console.error
 * directly, with messages that never include lat/lng.
 */
export const devLog = (...args: unknown[]) => {
  if (__DEV__) console.log(...args);
};

export const devWarn = (...args: unknown[]) => {
  if (__DEV__) console.warn(...args);
};
