import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { NativeModules, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

import { api, ApiError } from '@/lib/api/client';
import type { AccountType, LoginResponse } from './types';

const base = '/api/auth/biometrics';
const credentialKey = 'taskhub-biometric-credential';
const deviceKey = 'taskhub-biometric-device';

export type BiometricCredential = {
  credentialId: string;
  accountId: string;
  accountType: AccountType;
  label: string;
};

export function biometricBridgeAvailable() {
  return (Platform.OS === 'ios' || Platform.OS === 'android') && !!NativeModules.ReactNativeBiometrics;
}

export async function readBiometricCredential(): Promise<BiometricCredential | null> {
  if (!biometricBridgeAvailable()) return null;
  const raw = await SecureStore.getItemAsync(credentialKey);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as BiometricCredential;
    return value?.credentialId && value?.accountId && (value.accountType === 'user' || value.accountType === 'tasker') ? value : null;
  } catch {
    return null;
  }
}

async function getDeviceId() {
  const saved = await SecureStore.getItemAsync(deviceKey);
  if (saved) return saved;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(deviceKey, id, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return id;
}

export async function clearBiometricCredential() {
  await SecureStore.deleteItemAsync(credentialKey);
  if (biometricBridgeAvailable()) await new ReactNativeBiometrics().deleteKeys();
}

export async function getDeviceBiometricStatus() {
  if (!biometricBridgeAvailable()) return null;
  const [sensor, local] = await Promise.all([
    new ReactNativeBiometrics().isSensorAvailable(),
    readBiometricCredential(),
  ]);
  const label = sensor.biometryType === 'FaceID' ? 'Face ID' : sensor.biometryType === 'TouchID' ? 'Touch ID' : 'fingerprint';
  return { ...sensor, label, local };
}

export function getBiometricStatus() {
  return api.get<{ data: { enabled: boolean; deviceCount: number; devices: { credentialId: string }[] } }>(base);
}

/** Local confirmation only. Payment authorization remains with the payment provider. */
async function confirmWalletBiometrics(accountId: string, accountType: AccountType, promptMessage: string) {
  const local = await readBiometricCredential();
  if (!local || local.accountId !== accountId || local.accountType !== accountType) return true;

  // Match Settings: enrollment must belong to this profile and still be active
  // on this device. A failed status request must never bypass confirmation.
  const { data } = await getBiometricStatus();
  if (!data.devices.some(({ credentialId }) => credentialId === local.credentialId)) return true;

  const native = new ReactNativeBiometrics({ allowDeviceCredentials: false });
  const { available } = await native.isSensorAvailable();
  if (!available) throw new Error('Biometrics is unavailable. Check your device settings and try again.');
  const { success } = await native.simplePrompt({
    promptMessage,
    cancelButtonText: 'Cancel',
  });
  return success;
}

export function confirmWalletFundingBiometrics(accountId: string, accountType: AccountType) {
  return confirmWalletBiometrics(accountId, accountType, 'Confirm wallet funding');
}

export function confirmWalletWithdrawalBiometrics(accountId: string, accountType: AccountType) {
  return confirmWalletBiometrics(accountId, accountType, 'Confirm withdrawal');
}

export async function startBiometricEnrollment() {
  const sensor = await getDeviceBiometricStatus();
  if (!sensor?.available) throw new Error('Set up Face ID or a fingerprint in your device settings first.');
  const deviceId = await getDeviceId();
  const native = new ReactNativeBiometrics();
  const { keysExist } = await native.biometricKeysExist();
  // The library has one key per installation. Never replace an active credential
  // from another profile as a side effect of enrollment.
  if (sensor.local) throw new Error('Turn off biometric sign-in for the profile that enabled it on this device first.');
  if (keysExist) await native.deleteKeys();
  const { publicKey } = await native.createKeys();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const { data } = await api.post<{ data: { challengeId: string } }>(`${base}/enroll`, {
    publicKey,
    deviceId,
    deviceName: Platform.OS === 'ios' ? (Platform.isPad ? 'iPad' : 'iPhone') : 'Android device',
    platform,
    biometryType: sensor.biometryType === 'FaceID' ? 'face_id' : sensor.biometryType === 'TouchID' ? 'touch_id' : 'fingerprint',
  });
  if (!data?.challengeId) throw new Error('Could not start biometric setup. Please try again.');
  return { challengeId: data.challengeId, label: sensor.label };
}

export async function confirmBiometricEnrollment(challengeId: string, code: string, profile: Omit<BiometricCredential, 'credentialId'>) {
  const { data } = await api.post<{ data: { credentialId: string } }>(`${base}/enroll/verify`, { challengeId, code });
  if (!data?.credentialId) throw new Error('Could not finish biometric setup. Please try again.');
  const credential = { ...profile, credentialId: data.credentialId };
  try {
    await SecureStore.setItemAsync(credentialKey, JSON.stringify(credential), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  } catch (error) {
    await api.delete(`${base}/${encodeURIComponent(credential.credentialId)}`).catch(() => {});
    throw error;
  }
  return credential;
}

export async function disableBiometrics(credentialId: string) {
  try {
    await api.delete(`${base}/${encodeURIComponent(credentialId)}`);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }
  await clearBiometricCredential();
}

export async function loginWithBiometrics() {
  const local = await readBiometricCredential();
  if (!local) throw new Error('Sign in with your password and set up biometrics again.');
  const native = new ReactNativeBiometrics();
  const { keysExist } = await native.biometricKeysExist();
  if (!keysExist) {
    await clearBiometricCredential();
    throw new Error('Biometric sign-in needs to be set up again. Sign in with your password.');
  }
  try {
    const { data } = await api.post<{ data: { challengeId: string; challenge: string } }>(
      `${base}/challenge`, { credentialId: local.credentialId }, { auth: false },
    );
    if (!data?.challengeId || !data.challenge) throw new Error('Could not start biometric sign-in. Please try again.');
    const result = await native.createSignature({ promptMessage: 'Sign in to TaskHub', payload: data.challenge });
    if (!result.success || !result.signature) return null;
    return await api.post<LoginResponse>(`${base}/login`, {
      credentialId: local.credentialId,
      challengeId: data.challengeId,
      signature: result.signature,
    }, { auth: false });
  } catch (error) {
    if (error instanceof ApiError && error.code === 'BIOMETRIC_NOT_AVAILABLE') await clearBiometricCredential();
    throw error;
  }
}
