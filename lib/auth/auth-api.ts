// Auth endpoint bindings. All paths are relative to `/api/auth`.

import { api } from '@/lib/api/client';
import type { PickedImage } from '@/lib/image-picker';
import type {
  AccountType,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  GoogleAuthPayload,
  GoogleAuthResponse,
  GoogleCompleteSignupPayload,
  Interest,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  ProfileResponse,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  SetPasswordPayload,
  TaskerRegisterPayload,
  UpdateInterestsResponse,
  UpdateProfilePayload,
  UpdateProfilePictureResponse,
  UpdateUserLocationPayload,
  UpdateUserLocationResponse,
  UserRegisterPayload,
  VerificationStatusResponse,
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

/**
 * Change the password of the signed-in account.
 *
 * A Google-only account has no stored password: the backend rejects with 400 and
 * `body.code === 'no_password_set'`, meaning the caller should offer
 * `setPassword` instead. Use `isNoPasswordSet` on the caught `ApiError`.
 */
export function changePassword(payload: ChangePasswordPayload) {
  return api.post<MessageResponse>(`${BASE}/change-password`, payload);
}

/** Set a first password on a Google-only account (no current password needed). */
export function setPassword(payload: SetPasswordPayload) {
  return api.post<MessageResponse>(`${BASE}/set-password`, payload);
}

/** Persist the onboarding purpose picks. User accounts only. */
export function updateInterests(interests: Interest[]) {
  return api.patch<UpdateInterestsResponse>(`${BASE}/interests`, { interests });
}

/** Persist the user's approximate location (+ optional resolved address). */
export function updateUserLocation(payload: UpdateUserLocationPayload) {
  return api.put<UpdateUserLocationResponse>(`${BASE}/user/location`, payload);
}

/** Whether the account has completed KYC. One flag covers face + NIN. */
export function getVerificationStatus(signal?: AbortSignal) {
  return api.get<VerificationStatusResponse>(`${BASE}/verification-status`, { signal });
}

/* ------------------------------------------------------------------ *
 * Tasker profile — `protectTasker`
 * ------------------------------------------------------------------ */

export interface PreviousWorkItem {
  url: string;
  publicId: string;
  _id?: string;
}

export interface PreviousWorkResponse {
  status: string;
  message: string;
  previousWork: PreviousWorkItem[];
}

/**
 * Append portfolio images (multipart, field name `images`).
 *
 * **Appends, never replaces** — and the backend caps the total at 10, rejecting
 * the whole batch with 400 if `existing + new > 10`. Check the current count
 * before offering a picker limit.
 */
export function uploadPreviousWork(images: PickedImage[]) {
  const form = new FormData();
  for (const image of images) {
    form.append('images', {
      uri: image.uri,
      name: image.name,
      type: image.type,
    } as unknown as Blob);
  }
  return api.post<PreviousWorkResponse>(`${BASE}/previous-work`, form);
}

/** Remove one portfolio image by its subdocument id. */
export function deletePreviousWork(id: string) {
  return api.delete<PreviousWorkResponse>(`${BASE}/previous-work/${id}`);
}

export interface UpdateTaskerCategoriesPayload {
  /** Both arrays are required, and every entry must be a valid active category id. */
  mainCategories: string[];
  subCategories: string[];
  university?: string;
}

/**
 * Set the services a tasker offers. This is what populates `GET
 * /api/tasks/tasker/feed` — a tasker with no `subCategories` gets an empty feed,
 * so this screen is a prerequisite for seeing any work at all.
 */
export function updateTaskerCategories(payload: UpdateTaskerCategoriesPayload) {
  return api.put<MessageResponse>(`${BASE}/categories`, payload);
}

/** The tasker's service-area centre. Also narrows the feed (default 200 miles). */
export function updateTaskerLocation(payload: UpdateUserLocationPayload) {
  return api.put<UpdateUserLocationResponse>(`${BASE}/location`, payload);
}

export function logout() {
  return api.post<MessageResponse>(`${BASE}/logout`);
}

/**
 * Register this device's OneSignal subscription id so the backend's push
 * pipeline (new tasks, bids, chat, withdrawals) can reach it. Role-scoped
 * paths — a user token 401s on the tasker route and vice versa.
 */
export function updateNotificationId(type: AccountType, notificationId: string) {
  const who = type === 'tasker' ? 'tasker' : 'user';
  return api.put<MessageResponse>(`${BASE}/${who}/notification-id`, { notificationId });
}

/** Detach the device on sign-out so pushes stop following a logged-out account. */
export function removeNotificationId(type: AccountType) {
  const who = type === 'tasker' ? 'tasker' : 'user';
  return api.delete<MessageResponse>(`${BASE}/${who}/notification-id`);
}
