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

export function verificationRetryBlocked(status?: VerificationDecision | null) {
  return (isDuplicateIdentity(status) || status?.isFraudFlagged === true) && status?.resubmissionAllowed !== true;
}

export function verificationMessage(status?: VerificationDecision | null) {
  return status?.message || DUPLICATE_IDENTITY_MESSAGE;
}

export function verificationPollInterval(status?: VerificationDecision & { status?: string }) {
  if (isDuplicateIdentity(status) || status?.isFraudFlagged) return false;
  return status?.status === 'under_review' || status?.status === 'in_progress' ? 5000 : false;
}
