/**
 * OTA update bootstrap for production builds.
 *
 * WHY the lazy require: expo-updates' NATIVE module only exists in builds
 * created after it was added. The installed dev client (and any older APK)
 * would crash on a top-level `import`. We therefore load the module only in
 * release builds, inside a try/catch.
 *
 * WHY the __DEV__ guard: dev clients (expo-dev-client, Metro-served bundles)
 * must NEVER apply or reload OTA bundles — doing so would silently swap the
 * JS runtime underneath a debugging session and is unsupported by
 * expo-updates (its JS API rejects in development). All update logic below
 * therefore runs only in release builds.
 *
 * Note on configuration: SDK 58's expo-updates has no runtime `configure()`
 * (verified against node_modules/expo-updates/build/Updates.d.ts). Cold-start
 * behaviour is driven natively by the app.json `updates.checkAutomatically`
 * setting; the default is ON_LOAD, i.e. the update check already happens on
 * every cold start before JS runs. This service only verifies state and
 * provides a manual fallback when automatic checks are disabled.
 */
type UpdatesModule = typeof import('expo-updates');

let initialized = false;

export function initUpdates(): void {
  if (__DEV__ || initialized) return;
  initialized = true;

  let Updates: UpdatesModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Updates = require('expo-updates');
  } catch {
    // Native module not compiled into this build (e.g. APK predating OTA
    // support): embedded build keeps working, nothing to check.
    return;
  }

  // Not configured in this build (missing updates URL/runtimeVersion, or
  // expo-updates disabled): nothing to do.
  if (!Updates.isEnabled) return;

  if (Updates.checkAutomatically === Updates.UpdatesCheckAutomaticallyValue.NEVER) {
    // Automatic cold-start checks are off in this build, so emulate one
    // manually. Downloaded updates are applied on the NEXT cold start; we do
    // not call reloadAsync() mid-session to avoid interrupting live tracking.
    void checkAndFetchOnce(Updates);
  } else {
    console.log(
      `[UPDATES] running=${Updates.isEmbeddedLaunch ? 'embedded' : 'ota'} ` +
        `updateId=${Updates.updateId ?? 'n/a'} check=${Updates.checkAutomatically ?? 'n/a'}`
    );
  }
}

async function checkAndFetchOnce(Updates: UpdatesModule): Promise<void> {
  try {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (!isAvailable) return;
    // SDK 58 note: fetch result flag is `isNew` (older docs call it `isNewUpdate`).
    const { isNew } = await Updates.fetchUpdateAsync();
    if (isNew) {
      console.log('[UPDATES] new update downloaded; will apply on next cold start');
    }
  } catch (error) {
    // Update failures must never break the app; the embedded build keeps working.
    console.warn('[UPDATES] cold-start check failed:', (error as Error)?.message);
  }
}
