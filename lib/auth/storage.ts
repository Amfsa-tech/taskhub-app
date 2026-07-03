// Secure persistence for the auth session using expo-secure-store.
//
// Note: SecureStore values can be rejected above ~2KB on some iOS versions,
// so we persist only the JWT, the account type, and a *minimal* cached user
// (the small object returned by login) — never a full profile blob.

import * as SecureStore from 'expo-secure-store';

import type { AccountType, AuthUser } from './types';

const TOKEN_KEY = 'taskhub.auth.token';
const TYPE_KEY = 'taskhub.auth.type';
const USER_KEY = 'taskhub.auth.user';

export interface StoredSession {
  token: string;
  accountType: AccountType;
  user: AuthUser | null;
}

/** Keep only small, stable identity fields to stay well under SecureStore limits. */
function minimalUser(user: AuthUser): Partial<AuthUser> {
  return {
    _id: user._id,
    emailAddress: user.emailAddress,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    profilePicture: user.profilePicture,
    isEmailVerified: user.isEmailVerified,
  };
}

export async function saveSession(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    SecureStore.setItemAsync(TYPE_KEY, session.accountType),
    session.user
      ? SecureStore.setItemAsync(USER_KEY, JSON.stringify(minimalUser(session.user)))
      : SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

export async function saveUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(minimalUser(user)));
}

export async function loadSession(): Promise<StoredSession | null> {
  const [token, accountType, userJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(TYPE_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);

  if (!token || !accountType) return null;

  let user: AuthUser | null = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson) as AuthUser;
    } catch {
      user = null;
    }
  }

  return { token, accountType: accountType as AccountType, user };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(TYPE_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
