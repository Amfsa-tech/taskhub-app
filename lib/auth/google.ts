// Isolated wrapper around the native Google Sign-In SDK.
//
// `@react-native-google-signin/google-signin` is a native module: it resolves in
// a development/production build, but never in Expo Go. It's referenced here
// through an OPTIONAL (try/catch) require, which Metro is told to allow via
// `resolver.allowOptionalDependencies` (see metro.config.js). So the app still
// bundles and runs in Expo Go; pressing "Continue with Google" there surfaces a
// clear `GoogleSignInUnavailableError` instead of crashing.
//
// Run the app with `npx expo run:ios` / `run:android` to get the native flow.
// EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must equal the backend's GOOGLE_CLIENT_ID —
// the token's audience must match, or the server rejects the sign-in.

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@/lib/config';
import type { GoogleProfile } from './types';

export class GoogleSignInUnavailableError extends Error {
  constructor(
    message = 'Google Sign-In needs a development build — it is not available in Expo Go yet.',
  ) {
    super(message);
    this.name = 'GoogleSignInUnavailableError';
  }
}

// Optional native dependency: resolves only in a dev/production build.
let nativeModule: any = null;
try {
  // @ts-ignore -- module is absent in Expo Go; require is optional (see metro.config.js).
  nativeModule = require('@react-native-google-signin/google-signin');
} catch {
  nativeModule = null;
}

let configured = false;

/** Whether the native SDK is present (i.e. running in a build that bundled it). */
export function isGoogleSignInAvailable(): boolean {
  return Boolean(nativeModule?.GoogleSignin);
}

/** Launch the native Google account chooser and return a verified ID token. */
export async function getGoogleIdToken(): Promise<string> {
  if (!nativeModule?.GoogleSignin) {
    throw new GoogleSignInUnavailableError();
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new GoogleSignInUnavailableError(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — set it to the backend GOOGLE_CLIENT_ID.',
    );
  }

  const { GoogleSignin } = nativeModule;
  if (!configured) {
    // `webClientId` sets the ID token's audience (must match the backend's
    // GOOGLE_CLIENT_ID). `iosClientId` initializes the native iOS SDK — required
    // here because there's no GoogleService-Info.plist to read it from.
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    });
    configured = true;
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  // Support both the current ({ data: { idToken } }) and legacy ({ idToken }) shapes.
  const idToken: string | null = result?.data?.idToken ?? result?.idToken ?? null;
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }
  return idToken;
}

// --- Pending hand-off to the completion screen (Phase 2) ---
// When Phase 1 reports "no account yet", we stash the verified idToken + profile
// so the "Enter Name" screen can complete signup without re-authenticating.
// Not cleared on read (avoids StrictMode double-invoke surprises); the completion
// screen calls clearPendingGoogleSignup() once signup succeeds.
let pending: { idToken: string; profile: GoogleProfile } | null = null;

export function setPendingGoogleSignup(value: { idToken: string; profile: GoogleProfile }): void {
  pending = value;
}

export function getPendingGoogleSignup(): { idToken: string; profile: GoogleProfile } | null {
  return pending;
}

export function clearPendingGoogleSignup(): void {
  pending = null;
}
