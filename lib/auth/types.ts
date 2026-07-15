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
