// Identity verification (KYC).
//
// ⚠️ Read this before wiring a "verify me" button to anything here.
//
// Neither KYC provider accepts identity data from our own UI. Both expect a
// **vendor SDK running inside the app** to capture the ID document and selfie:
//
//   QoreID — `POST /api/v1/nin/verify-nin` does NOT take a NIN. It opens a
//   session and returns SDK credentials (`accessToken`, `clientId`,
//   `clientReference`, `flowId`). The QoreID SDK performs the capture and
//   reports back out-of-band; the backend flips the account's KYC flag from a
//   webhook. A screen that collects an 11-digit NIN has nowhere to send it.
//
//   Didit — the app is expected to create the session with Didit *first* (their
//   SDK or hosted flow), then hand us the `sessionId` via
//   `POST /api/v1/kyc/register-session` so the webhook can resolve the user.
//   There is no "create session" endpoint on our backend.
//
// Neither SDK is installed in this app (check `package.json`), so verification
// cannot currently be *completed* from here — only observed. Calling
// `initiateNinKyc` has a real side effect: it upserts a `pending`
// KYCVerification row that shows up on the admin dashboard. Don't call it
// speculatively — only when an SDK is actually there to continue the flow.
//
// For "is this account verified?", prefer `getVerificationStatus` in
// `lib/auth/auth-api.ts`: it reads the account flag and is provider-agnostic.
// The endpoint below only ever sees Didit records.

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
