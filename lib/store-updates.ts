export type StoreUpdate = { available: boolean; storeUrl: string; version?: string };
export const storeName = 'app store';
export async function checkStoreUpdate(): Promise<StoreUpdate> {
  throw new Error('Store updates are available in the Android and iOS apps.');
}
