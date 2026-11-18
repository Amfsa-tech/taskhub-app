import type { AccountType, AuthUser, LoginPayload } from './types';

type PendingLogin = { emailAddress: string; type: AccountType; signup: boolean } & (
  { password: string; authenticate?: never } |
  { password?: never; authenticate: () => Promise<AuthUser | null> }
);
let pending: PendingLogin | undefined;

export function setPendingEmailLogin(type: AccountType, payload: LoginPayload, signup = false) {
  pending = { ...payload, type, signup };
}

export function setPendingBiometricLogin(type: AccountType, emailAddress: string, authenticate: () => Promise<AuthUser | null>) {
  pending = { type, emailAddress, authenticate, signup: false };
}

export function takePendingEmailLogin(type: AccountType, email: string) {
  const login = pending;
  pending = undefined;
  return login?.type === type && login.emailAddress.toLowerCase() === email.toLowerCase() ? login : undefined;
}
