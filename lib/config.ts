// Central app configuration derived from environment variables.

const DEFAULT_API_URL = 'https://task-hub-backend.onrender.com';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!rawApiUrl && __DEV__) {
  console.warn(
    '[config] EXPO_PUBLIC_API_URL is not set — falling back to the deployed default. ' +
      'Create a .env file (see .env.example) to override.',
  );
}

// Normalize: strip any trailing slash so we can safely concatenate paths.
export const API_BASE_URL = (rawApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

// Google Sign-In: the OAuth *web* client ID. This MUST match the backend's
// GOOGLE_CLIENT_ID, since the backend verifies the ID token's audience against
// it. Empty until configured (native Google Sign-In needs a development build).
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
