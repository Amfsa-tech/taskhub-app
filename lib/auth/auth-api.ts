// Auth endpoint bindings. All paths are relative to `/api/auth`.

import { api } from '@/lib/api/client';
import type {
  AccountType,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  ProfileResponse,
  RegisterResponse,
  ResendVerificationPayload,
  ResetPasswordPayload,
  TaskerRegisterPayload,
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

/** Fetch the authenticated profile. Requires a valid bearer token. */
export function getProfile(type: AccountType) {
  const path = type === 'tasker' ? `${BASE}/tasker` : `${BASE}/user`;
  return api.get<ProfileResponse>(path);
}

export function logout() {
  return api.post<MessageResponse>(`${BASE}/logout`);
}
