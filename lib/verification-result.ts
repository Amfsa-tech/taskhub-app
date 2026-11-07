import type { VerificationDecision } from './verification-status';

export const VERIFICATION_CHECKING_MESSAGE = 'Verification submitted. Checking your result…';
export const VERIFICATION_PROCESSING_MESSAGE = 'Your verification is still processing. You can refresh this page later.';
export const VERIFICATION_RESULT_TIMEOUT_MS = 90000;
export const VERIFICATION_RESULT_INTERVAL_MS = 4000;

export interface VerificationResult extends VerificationDecision {
  status: string;
  isVerified: boolean;
}

/** One bounded, cancellable check after capture closes. Never infers a decision. */
export function pollVerificationResult<T extends VerificationResult>({
  fetchStatus, onStatus, onSettled,
}: {
  fetchStatus: (signal: AbortSignal) => Promise<T>;
  onStatus: (status: T) => void;
  onSettled: (status: T | null) => void;
}) {
  const controller = new AbortController();
  let stopped = false;
  const expiresAt = Date.now() + VERIFICATION_RESULT_TIMEOUT_MS;
  let next: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    stopped = true;
    clearTimeout(next);
    clearTimeout(deadline);
    controller.abort();
  };
  const settle = (status: T | null) => {
    if (stopped) return;
    cancel();
    onSettled(status);
  };
  const check = async () => {
    if (stopped) return;
    if (Date.now() >= expiresAt) { settle(null); return; }
    try {
      const status = await fetchStatus(controller.signal);
      if (stopped) return;
      if (Date.now() >= expiresAt) { settle(null); return; }
      onStatus(status);
      if (stopped) return;
      if (['approved', 'rejected', 'under_review'].includes(status.status)) {
        settle(status);
      } else {
        next = setTimeout(() => { void check(); }, VERIFICATION_RESULT_INTERVAL_MS);
      }
    } catch {
      // A timeout/transport error is not a KYC rejection or approval.
      settle(null);
    }
  };
  const deadline = setTimeout(() => settle(null), VERIFICATION_RESULT_TIMEOUT_MS);
  void check();
  return cancel;
}
