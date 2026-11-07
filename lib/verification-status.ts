export interface VerificationDecision {
  decisionCode?: string;
  message?: string;
  isDuplicate?: boolean;
  isFraudFlagged?: boolean;
  resubmissionAllowed?: boolean;
}

export const DUPLICATE_IDENTITY_MESSAGE = 'This identity appears to already be linked to another Tasker account. If you believe this is a mistake, contact support.';

export function isDuplicateIdentity(status?: VerificationDecision | null) {
  return status?.decisionCode === 'duplicate_identity' || status?.isDuplicate === true;
}

export function verificationRetryBlocked(status?: (VerificationDecision & { status?: string }) | null) {
  if (isDuplicateIdentity(status)) return true;
  if (['approved', 'under_review', 'in_progress', 'pending'].includes(status?.status || '')) return true;
  return (status?.status === 'rejected' || status?.isFraudFlagged === true) && status?.resubmissionAllowed !== true;
}

export function verificationMessage(status?: VerificationDecision | null) {
  return status?.message || (isDuplicateIdentity(status) ? DUPLICATE_IDENTITY_MESSAGE : 'Your verification was not approved. Contact support for help.');
}

export function verificationPollInterval(status?: VerificationDecision & { status?: string }) {
  if (isDuplicateIdentity(status) || status?.isFraudFlagged) return false;
  return status?.status === 'pending' || status?.status === 'in_progress' ? 4000 : false;
}
