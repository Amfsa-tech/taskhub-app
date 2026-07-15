// Auth endpoint bindings. All paths are relative to `/api/auth`.

import { api } from '@/lib/api/client';
import type { PickedImage } from '@/lib/image-picker';
import type {
  AccountType,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  GoogleAuthResponse,
  GoogleCompleteSignupPayload,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  ProfileResponse,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  TaskerRegisterPayload,
  UpdateProfilePayload,
  UpdateProfilePictureResponse,
  UserRegisterPayload,
  VerifyEmailPayload,
} from './types';

const BASE = '/api/auth';

export function loginUser(payload: LoginPayload) {
  return api.post<LoginResponse>(`${BASE}/user-login`, payload, { auth: false });
}

export function loginTasker(payload: LoginPayload) {
  return api.post<LoginResponse>(`${BASE}/tasker-login`, payload, { auth: false });
}

export function login(type: AccountType, payload: LoginPayload) {
  return type === 'tasker' ? loginTasker(payload) : loginUser(payload);
}

export function registerUser(payload: UserRegisterPayload) {
  return api.post<RegisterResponse>(`${BASE}/user-register`, payload, { auth: false });
}

export function registerTasker(payload: TaskerRegisterPayload) {
  return api.post<RegisterResponse>(`${BASE}/tasker-register`, payload, { auth: false });
}

export function verifyEmail(payload: VerifyEmailPayload) {
  return api.post<MessageResponse>(`${BASE}/verify-email`, payload, { auth: false });
}

export function resendVerification(payload: ResendVerificationPayload) {
  return api.post<MessageResponse>(`${BASE}/resend-verification`, payload, { auth: false });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return api.post<MessageResponse>(`${BASE}/forgot-password`, payload, { auth: false });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return api.post<MessageResponse>(`${BASE}/reset-password`, payload, { auth: false });
}

/** Phase 1 — verify a Google ID token and sign in / link an existing account. */
export function googleAuth(payload: GoogleAuthPayload) {
  return api.post<GoogleAuthResponse>(`${BASE}/google`, payload, { auth: false });
}

/** Phase 2 — create a brand-new account after collecting the completion fields. */
export function googleCompleteSignup(payload: GoogleCompleteSignupPayload) {
  return api.post<GoogleAuthResponse>(`${BASE}/google/complete-signup`, payload, { auth: false });
}

/** Fetch the authenticated profile. Requires a valid bearer token. */
export function getProfile(type: AccountType) {
  const path = type === 'tasker' ? `${BASE}/tasker` : `${BASE}/user`;
  return api.get<ProfileResponse>(path);
}

/**
 * Update the authenticated profile. Only the fields present in `payload` are
 * changed, so callers should send just what the user actually edited.
 */
export function updateProfile(payload: UpdateProfilePayload) {
  return api.put<ProfileResponse>(`${BASE}/profile`, payload);
}

/**
 * Replace the profile picture. Goes out as multipart/form-data under the
 * `profilePicture` field (what the backend's multer instance expects) and is
 * uploaded to Cloudinary server-side.
 */
export function updateProfilePicture(image: PickedImage) {
  const form = new FormData();
  form.append('profilePicture', {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);
  return api.put<UpdateProfilePictureResponse>(`${BASE}/profile-picture`, form);
}

export function logout() {
  return api.post<MessageResponse>(`${BASE}/logout`);
}
