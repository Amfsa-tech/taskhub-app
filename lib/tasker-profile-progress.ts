export type TaskerCompletionFactors = {
  profilePhoto: boolean;
  servicesSelected: boolean;
  portfolioAdded: boolean;
  identityVerified: boolean;
};

export type TaskerProfileCompletion = number | {
  score?: number;
  factors?: Partial<TaskerCompletionFactors>;
};

type IdentityStatus = {
  status?: string;
  isVerified?: boolean;
  decisionCode?: string;
  isDuplicate?: boolean;
  isFraudFlagged?: boolean;
};

const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;
const percentage = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

/** Match GET /api/auth/tasker's four factors on every completion surface. */
export function getTaskerProfileProgress(profile: unknown, verification?: IdentityStatus) {
  const user = (profile && typeof profile === 'object' ? profile : {}) as Record<string, unknown>;
  const completion = user.profileCompletion as TaskerProfileCompletion | undefined;
  const supplied = completion && typeof completion === 'object' ? completion.factors : undefined;
  const serverIdentity = supplied?.identityVerified ?? (user.verifyIdentity === true || user.isKYCVerified === true);
  const identityVerified = verification
    ? verification.status === 'approved' && verification.isVerified === true
      && verification.decisionCode !== 'duplicate_identity' && !verification.isDuplicate && !verification.isFraudFlagged
    : serverIdentity;
  const factors: TaskerCompletionFactors = {
    profilePhoto: supplied?.profilePhoto ?? (typeof user.profilePicture === 'string' && !!user.profilePicture.trim()),
    servicesSelected: supplied?.servicesSelected ?? (hasItems(user.mainCategories) && hasItems(user.subCategories)),
    portfolioAdded: supplied?.portfolioAdded ?? (hasItems(user.portfolio) || hasItems(user.previousWork)),
    identityVerified,
  };
  const serverScore = typeof completion === 'number' ? completion : completion?.score;
  // New KYC decisions can arrive before the cached profile is refreshed. Only
  // adjust its identity quarter; profile completeness never grants KYC access.
  const score = typeof serverScore === 'number' && Number.isFinite(serverScore)
    ? percentage(percentage(serverScore) + (Number(identityVerified) - Number(serverIdentity)) * 25)
    : Object.values(factors).filter(Boolean).length * 25;
  const next = !factors.profilePhoto ? { step: 'photo', label: 'Add profile photo' }
    : !factors.servicesSelected ? { step: 'services', label: 'Choose your services' }
    : !factors.portfolioAdded ? { step: 'portfolio', label: 'Add your portfolio' }
    : !factors.identityVerified ? { step: 'verification', label: 'Verify your identity' }
    : { step: 'profile', label: score === 100 ? 'Profile complete' : 'Finish your profile' };
  return { score, factors, identityVerified, next };
}
