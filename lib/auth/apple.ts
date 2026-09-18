import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import type { AppleProfile } from './types';

export interface AppleCredentialPayload {
  identityToken: string;
  authorizationCode: string;
  nonce: string;
  fullName: string;
  givenName: string;
  familyName: string;
}

export class AppleSignInUnavailableError extends Error {
  constructor(message = 'Sign in with Apple is available on supported Apple devices.') {
    super(message);
    this.name = 'AppleSignInUnavailableError';
  }
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync();
}

const randomValue = () => `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');

export async function getAppleCredential(): Promise<AppleCredentialPayload> {
  if (!(await isAppleSignInAvailable())) throw new AppleSignInUnavailableError();
  const nonce = randomValue();
  const state = randomValue();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce,
  );
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
    state,
  });
  if (credential.state !== state) throw new Error('Apple sign-in state validation failed.');
  if (!credential.identityToken || !credential.authorizationCode) {
    throw new Error('Apple sign-in did not return the required credentials.');
  }
  const givenName = credential.fullName?.givenName?.trim() || '';
  const familyName = credential.fullName?.familyName?.trim() || '';
  const formattedName = credential.fullName
    ? AppleAuthentication.formatFullName(credential.fullName, 'default').trim()
    : '';
  return {
    identityToken: credential.identityToken,
    authorizationCode: credential.authorizationCode,
    nonce,
    givenName,
    familyName,
    fullName: formattedName || [givenName, familyName].filter(Boolean).join(' '),
  };
}

let pending: { signupToken: string; profile: AppleProfile } | null = null;

export function setPendingAppleSignup(value: { signupToken: string; profile: AppleProfile }): void {
  pending = value;
}

export function getPendingAppleSignup(): { signupToken: string; profile: AppleProfile } | null {
  return pending;
}

export function clearPendingAppleSignup(): void {
  pending = null;
}
