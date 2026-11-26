import type { AndroidNeedsUpdateResponse, CheckOptions } from 'sp-react-native-in-app-updates';
import type { StoreUpdate } from './store-updates';
export const storeName = 'Play Store';
type Checker = { checkNeedsUpdate: (options: CheckOptions) => Promise<AndroidNeedsUpdateResponse> };
let checker: Checker | undefined;
export async function checkStoreUpdate(): Promise<StoreUpdate> {
  // Load on demand so Expo Go and older binaries can still open Settings.
  const DeviceInfo = require('react-native-device-info').default as typeof import('react-native-device-info').default;
  const InAppUpdates = require('sp-react-native-in-app-updates/src/InAppUpdates.android').default as new () => Checker;
  checker ??= new InAppUpdates();
  const result = await checker.checkNeedsUpdate({
    curVersion: DeviceInfo.getVersion(),
    // Play Core has already compared versionCode against the installed build.
    // Its numeric build code must never be compared with a marketing version.
    customVersionComparator: () => 1,
  });
  const availability = result.other?.updateAvailability;
  if (![1, 2, 3].includes(availability)) throw new Error('Google Play could not confirm update availability.');
  return {
    available: availability === 2 || availability === 3,
    storeUrl: `https://play.google.com/store/apps/details?id=${encodeURIComponent(DeviceInfo.getBundleId())}`,
  };
}
