// Identity verification (KYC).
//
// The live path is **Didit's hosted flow**: `createDiditKycSession` asks the
// backend to create a session (API key stays server-side) and returns a `url`
// the app opens in a browser. Didit does the ID/selfie capture on that page
// and reports the decision to the backend webhook, which flips the account's
// KYC flag. No vendor SDK in the app is needed.
//
// The QoreID bindings below are a dormant alternative: `POST
// /api/v1/nin/verify-nin` does NOT take a NIN — it returns credentials for the
// QoreID capture SDK, which is not installed in this app. Calling
// `initiateNinKyc` has a real side effect (it upserts a `pending`
// KYCVerification row that shows up on the admin dashboard), so don't call it
// speculatively — only if that SDK is ever added to continue the flow.
//
// For "is this account verified?", prefer `getVerificationStatus` in
// `lib/auth/auth-api.ts`: it reads the account flag and is provider-agnostic.
// `getKycStatus` below only ever sees Didit records.

import { api } from './client';

/** Credentials for the QoreID frontend SDK. Useless without that SDK. */
export interface NinKycSession {
  accessToken: string;
  clientId: string;
  /** Correlates this attempt; echo it back on failure via `reportKycFailure`. */
  clientReference: string;
  flowId: string;
}

export interface NinKycSessionResponse {
  status: string;
  message: string;
  data: NinKycSession;
}

/**
 * Open a QoreID verification session.
 *
 * Side effect: upserts a `pending` KYC record server-side. Only call this when
 * the QoreID SDK is present and will immediately continue the flow, otherwise
 * it leaves an orphaned pending record for admins to chase.
 *
 * Also reachable as `POST /api/nin/submit-nin` — the two routes share one
 * controller. This binding uses the `/api/v1/nin` pair so it sits alongside
 * `reportKycFailure`.
 */
export function initiateNinKyc() {
  return api.post<NinKycSessionResponse>('/api/v1/nin/verify-nin');
}

/** Mark a started QoreID attempt as failed (SDK crash, user abandoned). */
export function reportKycFailure(clientReference: string, errorReason?: string) {
  return api.post<{ message: string }>('/api/v1/nin/kyc-failure', {
    clientReference,
    errorReason,
  });
}

/** Hand the backend a Didit session id so its webhook can resolve the user. */
export function registerDiditSession(sessionId: string) {
  return api.post<{ success: boolean; message: string }>('/api/v1/kyc/register-session', {
    sessionId,
  });
}

/**
 * Create a Didit verification session (tasker-only). The backend calls Didit
 * with its server-side API key and registers the session → user mapping, so
 * the app only has to open the returned hosted-flow `url` in a browser.
 * 503 means Didit isn't configured on the server; 409 means already verified.
 */
export function createDiditKycSession() {
  return api.post<{ success: boolean; data: { sessionId: string; url: string } }>(
    '/api/v1/kyc/create-session',
  );
}

export type KycRecordStatus = 'pending' | 'approved' | 'rejected' | 'Not Started';

/**
 * Detail of the latest **Didit** KYC record.
 *
 * Two traps: it uses a `{ success, data }` envelope rather than the API-wide
 * `{ status, ... }` one, and it filters on `provider: 'didit'` — so an account
 * verified through QoreID reads back as `Not Started` here despite being
 * verified. Use it for rejection reasons and masked NIN, never as the source of
 * truth for whether the account is verified.
 */
export interface KycStatusResponse {
  success: boolean;
  data: {
    status: KycRecordStatus;
    isVerified: boolean;
    maskedNin?: string;
    verifiedAt?: string;
    rejectionReasons?: string[];
    updatedAt?: string;
  };
}

export function getKycStatus(signal?: AbortSignal) {
  return api.get<KycStatusResponse>('/api/v1/kyc/verification-status', { signal });
}
