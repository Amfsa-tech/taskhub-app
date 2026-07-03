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
  [key: string]: unknown;
}

export interface LoginResponse {
  status: string;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: AuthUser;
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

/** Full set of fields the backend requires for `POST /api/auth/user-register`. */
export interface UserRegisterPayload {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  password: string;
  country: string;
  residentState: string;
  address: string;
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
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
