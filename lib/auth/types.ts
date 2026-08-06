// Auth domain types mirroring the TaskHub backend auth endpoints.

export type AccountType = 'user' | 'tasker';

/**
 * Authenticated account. The backend uses `fullName` for users and
 * `firstName`/`lastName` for taskers, so both are optional here.
 * Extra profile fields are allowed through the index signature.
 */
export interface AuthUser {
  _id: string;
  emailAddress: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  wallet?: number;
  isEmailVerified?: boolean;
  isKYCVerified?: boolean;
  /** Profile stats, returned by `GET /api/auth/user`. Counted server-side. */
  tasksPostedCount?: number;
  /** Reviews this user has left on their completed tasks. */
  reviewsGivenCount?: number;
  savedTaskersCount?: number;
  // ── Tasker-only, returned by `GET /api/auth/tasker` ──
  bio?: string;
  averageRating?: number;
  location?: { latitude: number; longitude: number; address?: string } | null;
  /** Populated category refs — these drive `GET /api/tasks/tasker/feed`. */
  mainCategories?: { _id: string; name?: string; displayName?: string }[];
  subCategories?: { _id: string; name?: string; displayName?: string }[];
  previousWork?: { url: string; publicId: string; _id?: string }[];
  [key: string]: unknown;
}

/**
 * `/user-login` and `/tasker-login` return only the token plus metadata —
 * NOT the user object. The full profile is fetched separately via `getProfile`.
 * Note: login succeeds even when the email isn't verified; check
 * `isEmailVerified` and route to the OTP screen when it's false.
 */
export interface LoginResponse {
  status: string;
  token: string;
  user_type: AccountType;
  isEmailVerified: boolean;
  expiresIn: string;
}

/**
 * Registration does not return a token or user — the account must verify its
 * email first, then log in. `emailToken` is only present outside production
 * (handy for local/dev OTP testing).
 */
export interface RegisterResponse {
  status: string;
  message: string;
  emailVerificationRequired: boolean;
  emailToken?: string;
}

export interface MessageResponse {
  status: string;
  message: string;
}

export interface ProfileResponse {
  status: string;
  message?: string;
  user: AuthUser;
}

// ---- Request payloads ----

export interface LoginPayload {
  emailAddress: string;
  password: string;
}

/**
 * User signup. The backend only requires `fullName`, `emailAddress`, and
 * `password` — phone, DOB, country, state, and address are collected later
 * (profile / KYC), so they're optional here.
 */
export interface UserRegisterPayload {
  fullName: string;
  emailAddress: string;
  password: string;
  phoneNumber?: string;
  country?: string;
  residentState?: string;
  address?: string;
  dateOfBirth?: string; // ISO date (YYYY-MM-DD)
  originState?: string;
}

/** Fields the backend requires for `POST /api/auth/tasker-register`. */
export interface TaskerRegisterPayload {
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  password: string;
  country: string;
  residentState: string;
  originState: string;
  address: string;
  dateOfBirth: string;
}

// ---- Google auth ----

export interface GoogleAuthPayload {
  idToken: string;
  user_type: AccountType;
}

/** Google identity the backend echoes back when no account exists yet (Phase 2 trigger). */
export interface GoogleProfile {
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  picture: string;
}

/**
 * Both Google endpoints return the same session envelope as login on success.
 * `linkedNow` (Phase 1) is true when an existing local account was just linked
 * to Google; `created` (Phase 2) is true when a brand-new account was created.
 */
export interface GoogleAuthResponse {
  status: string;
  token: string;
  user_type: AccountType;
  isEmailVerified: boolean;
  expiresIn: string;
  linkedNow?: boolean;
  created?: boolean;
}

/**
 * Phase 2 — finish creating a brand-new Google account. After the backend
 * relaxation a `user` only needs `fullName` (+ `country`); the remaining fields
 * stay optional and are collected later during onboarding / profile.
 */
export interface GoogleCompleteSignupPayload {
  idToken: string;
  user_type: AccountType;
  fullName?: string;
  country?: string;
  phoneNumber?: string;
  residentState?: string;
  address?: string;
  dateOfBirth?: string;
  // tasker-only
  firstName?: string;
  lastName?: string;
  originState?: string;
}

/**
 * Fields `PUT /api/auth/profile` accepts. Every field is optional — the backend
 * only applies the keys actually present, so send just what changed.
 * The picked "Location" is persisted as `address`.
 */
export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  /** Max 500 characters — the backend rejects longer. */
  bio?: string;
  address?: string;
  country?: string;
  residentState?: string;
  /** Accepts a University id or name; the backend resolves it to an id. */
  university?: string;
}

/** `PUT /api/auth/profile-picture` echoes back the new Cloudinary URL. */
export interface UpdateProfilePictureResponse {
  status: string;
  message: string;
  profilePicture: string;
}

export interface VerifyEmailPayload {
  code: string;
  emailAddress: string;
  type: AccountType;
}

export interface ResendVerificationPayload {
  emailAddress: string;
  type: AccountType;
}

export interface ForgotPasswordPayload {
  emailAddress: string;
  type: AccountType;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
  emailAddress: string;
  type: AccountType;
}

/**
 * `POST /api/auth/change-password` (authenticated). The backend enforces a
 * 6-character minimum on `newPassword`.
 *
 * Google-only accounts have no stored password: the backend answers 400 with
 * `code: 'no_password_set'` and expects `setPassword` instead.
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** `POST /api/auth/set-password` — first password for a Google-only account. */
export interface SetPasswordPayload {
  newPassword: string;
}

/**
 * Onboarding purposes. These slugs are a fixed backend enum
 * (`utils/onboardingUtils.js` → `ALLOWED_INTERESTS`); anything else is a 400.
 */
export type Interest = 'campus' | 'local_services' | 'errands' | 'digital';

export const ALLOWED_INTERESTS: Interest[] = [
  'campus',
  'local_services',
  'errands',
  'digital',
];

export interface UpdateInterestsResponse {
  status: string;
  message: string;
  interests: Interest[];
}

/**
 * `PUT /api/auth/user/location` — user-only (a tasker token gets a 403).
 * Latitude/longitude must be **numbers**, not strings; `address` is optional and
 * is persisted onto the profile's `address` field when non-empty.
 */
export interface UpdateUserLocationPayload {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UpdateUserLocationResponse {
  status: string;
  message: string;
  location: { latitude: number; longitude: number; lastUpdated: string };
  address?: string;
}

/**
 * `GET /api/auth/verification-status`. One KYC flag covers the whole account —
 * the backend reads `isKYCVerified` (users) or `verifyIdentity` (taskers).
 * There is no separate per-method (face vs NIN) status.
 */
export interface VerificationStatusResponse {
  status: string;
  data: {
    accountId: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    role: 'User' | 'Tasker';
  };
}
