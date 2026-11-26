import type { StoreUpdate } from './store-updates';
import { newerVersion } from './store-update-utils';
export const storeName = 'App Store';
export async function checkStoreUpdate(): Promise<StoreUpdate> {
  const DeviceInfo = require('react-native-device-info').default as typeof import('react-native-device-info').default;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const bundleId = DeviceInfo.getBundleId();
    const response = await fetch(`https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=ng`, { signal: controller.signal });
    if (!response.ok) throw new Error('The App Store could not be reached.');
    const data = await response.json();
    const app = data.results?.find((item: { bundleId?: string }) => item.bundleId === bundleId);
    if (!app?.version || !/^https:\/\/apps\.apple\.com\//.test(app.trackViewUrl || '')) {
      throw new Error('The app listing is not available in the App Store yet. Please try again later.');
    }
    return { available: newerVersion(app.version, DeviceInfo.getVersion()), storeUrl: app.trackViewUrl, version: app.version };
  } finally { clearTimeout(timer); }
}
