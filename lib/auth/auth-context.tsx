// Auth session provider: the single source of truth for the logged-in account.
//
// - Bootstraps the persisted session from SecureStore on launch.
// - Keeps the API client's bearer token in sync.
// - Exposes `signIn` / `signOut` / `refreshProfile`; screens wrap these in
//   React Query mutations for per-screen pending/error UI.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { ApiError, setApiToken, setAuthRefreshHandler } from '@/lib/api/client';
import { watchPushSubscriptionId } from '@/lib/push';
import { queryClient } from '@/lib/query-client';
import {
  appleAuth,
  completeSocialSignup,
  createLinkedRole,
  getProfile,
  googleAuth,
  googleCompleteSignup,
  login,
  linkAccountAndSwitch,
  logout as logoutRequest,
  refreshSessionToken,
  removeNotificationId,
  switchAccountMode,
  updateNotificationId,
} from './auth-api';
import { getAppleCredential } from './apple';
import { getGoogleIdToken } from './google';
import {
  clearSession,
  loadRefreshToken,
  loadSession,
  saveSession,
  saveTokens,
  saveUser,
} from './storage';
import type { AccountType, AppleProfile, AuthUser, GoogleCompleteSignupPayload, GoogleProfile, LinkedRolePayload, LoginPayload, SocialCompleteSignupPayload } from './types';
import type { SwitchModeResponse } from './auth-api';
import { acceptCreatedRole } from './role-session';

/** Result of a Google sign-in attempt: either signed in, or needs Phase-2 completion. */
export type GoogleSignInOutcome =
  | { kind: 'signed-in'; user: AuthUser; accountType: AccountType; roleFallback: boolean }
  | { kind: 'needs-signup'; idToken: string; profile: GoogleProfile };

export type AppleSignInOutcome =
  | { kind: 'signed-in'; user: AuthUser; accountType: AccountType; roleFallback: boolean }
  | { kind: 'needs-signup'; signupToken: string; profile: AppleProfile };

export type SwitchModeOutcome = {
  kind: 'switched' | 'onboarding-required' | 'role-creation-required';
  accountType: AccountType;
  accountId?: string;
  user: AuthUser | null;
  missingFields: string[];
  profileUnavailable: boolean;
};

interface AuthContextValue {
  /** True until the persisted session has been read on launch. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  accountType: AccountType | null;
  /** Authenticate and persist the session. Returns the signed-in user. */
  signIn: (type: AccountType, payload: LoginPayload) => Promise<AuthUser>;
  /**
   * Native Google sign-in. Establishes a session for existing/linked accounts,
   * or returns a `needs-signup` outcome (with the verified idToken + profile)
   * when no account exists yet, so the caller can open the completion screen.
   */
  signInWithGoogle: (type: AccountType) => Promise<GoogleSignInOutcome>;
  signInWithApple: (type: AccountType) => Promise<AppleSignInOutcome>;
  /** Finish a Google signup (Phase 2) with the collected fields, then sign in. */
  completeGoogleSignup: (args: Omit<GoogleCompleteSignupPayload, 'user_type'> & { type: AccountType }) => Promise<AuthUser>;
  completeAppleSignup: (args: Omit<SocialCompleteSignupPayload, 'user_type'> & { type: AccountType }) => Promise<AuthUser>;
  /** Adopt a session obtained elsewhere (e.g. right after verify-email). */
  setSession: (type: AccountType, token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetch the full profile for the current account. */
  refreshProfile: () => Promise<void>;
  /** Switch to the linked counterpart account without asking for credentials again. */
  switchMode: () => Promise<SwitchModeOutcome>;
  /** Prove ownership of an existing opposite-role profile and switch to it. */
  linkRoleAndSwitch: (email: string, password: string) => Promise<AuthUser>;
  createRoleAndSwitch: (payload: LinkedRolePayload) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Guards a background profile refresh from racing a sign-out.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;
  const accountTypeRef = useRef<AccountType | null>(null);
  accountTypeRef.current = accountType;

  // Apple can revoke an app credential outside Taskhub. Clear the local
  // session immediately; the server notification endpoint revokes server
  // sessions and provider linkage independently.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const subscription = AppleAuthentication.addRevokeListener(() => {
      clearSession().finally(() => {
        setApiToken(null);
        setToken(null);
        setAccountType(null);
        setUser(null);
        queryClient.removeQueries();
      });
    });
    return () => subscription.remove();
  }, []);

  // Whenever a session is active, hand the device's OneSignal subscription id
  // to the backend (it may arrive late — first grant of the permission prompt —
  // hence the watcher rather than a one-shot read). Covers every sign-in path
  // plus the bootstrap restore.
  useEffect(() => {
    if (!token || !accountType) return;
    const stop = watchPushSubscriptionId((id) => {
      updateNotificationId(accountType, id).catch(() => {
        // Non-blocking: a failed registration never interrupts the session;
        // the next launch retries.
      });
    });
    return stop;
  }, [token, accountType]);

  const applySession = useCallback(
    (nextType: AccountType, nextToken: string, nextUser: AuthUser | null) => {
      setApiToken(nextToken);
      setToken(nextToken);
      setAccountType(nextType);
      setUser(nextUser);
    },
    [],
  );

  const renewAccessToken = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = await loadRefreshToken();
    if (!storedRefreshToken) return null;
    try {
      const refreshed = await refreshSessionToken(storedRefreshToken);
      setApiToken(refreshed.token);
      setToken(refreshed.token);
      await saveTokens(refreshed.token, refreshed.refreshToken);
      return refreshed.token;
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        await clearSession();
        setApiToken(null);
        setToken(null);
        setAccountType(null);
        setUser(null);
        queryClient.removeQueries();
        return null;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    setAuthRefreshHandler(renewAccessToken);
    return () => setAuthRefreshHandler(null);
  }, [renewAccessToken]);

  // Bootstrap persisted session once on launch.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await loadSession();
        if (cancelled || !session) return;
        applySession(session.accountType, session.token, session.user);

        // Refresh the full profile in the background; ignore transient failures.
        try {
          const { user: fresh } = await getProfile(session.accountType);
          if (!cancelled && tokenRef.current === session.token) {
            setUser(fresh);
            await saveUser(fresh);
          }
        } catch (err) {
          // A 401 means the stored token is no longer valid — clear it.
          if (err instanceof ApiError && err.isUnauthorized && !err.afterSuccessfulRefresh && !cancelled) {
            await clearSession();
            setApiToken(null);
            setToken(null);
            setAccountType(null);
            setUser(null);
          }
        }

      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const signIn = useCallback(
    async (type: AccountType, payload: LoginPayload) => {
      // The login endpoint returns only a token (+ metadata) — never the user —
      // so we set the token, then fetch the full profile ourselves.
      const res = await login(type, payload);
      const accountType = res.user_type ?? type;

      setApiToken(res.token);
      try {
        const { user } = await getProfile(accountType);
        applySession(accountType, res.token, user);
        await saveSession({
          token: res.token,
          refreshToken: res.refreshToken,
          accountType,
          user,
        });
        return user;
      } catch (error) {
        setApiToken(null);
        throw error;
      }
    },
    [applySession],
  );

  const signInWithGoogle = useCallback(
    async (type: AccountType): Promise<GoogleSignInOutcome> => {
      // 1. Get a verified Google ID token from the native SDK.
      const idToken = await getGoogleIdToken();
      try {
        // 2. Phase 1: sign in / link an existing account.
        const res = await googleAuth({ idToken, user_type: type });
        const nextType = res.user_type ?? type;
        setApiToken(res.token);
        const { user } = await getProfile(nextType);
        applySession(nextType, res.token, user);
        await saveSession({ token: res.token, refreshToken: res.refreshToken, accountType: nextType, user });
        return { kind: 'signed-in', user, accountType: nextType, roleFallback: Boolean(res.roleFallback) };
      } catch (err) {
        // 404 + `account_not_found` means there's no account yet — hand the
        // caller the idToken + profile so it can run the completion screen.
        if (err instanceof ApiError && err.status === 404) {
          const body = err.body as { code?: string; googleProfile?: GoogleProfile } | undefined;
          if (body?.code === 'account_not_found' && body.googleProfile) {
            return { kind: 'needs-signup', idToken, profile: body.googleProfile };
          }
        }
        throw err;
      }
    },
    [applySession],
  );

  const signInWithApple = useCallback(
    async (type: AccountType): Promise<AppleSignInOutcome> => {
      const credential = await getAppleCredential();
      try {
        const res = await appleAuth({ ...credential, user_type: type });
        const nextType = res.user_type ?? type;
        setApiToken(res.token);
        const { user } = await getProfile(nextType);
        applySession(nextType, res.token, user);
        await saveSession({ token: res.token, refreshToken: res.refreshToken, accountType: nextType, user });
        return { kind: 'signed-in', user, accountType: nextType, roleFallback: Boolean(res.roleFallback) };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          const body = err.body as { code?: string; signupToken?: string; appleProfile?: AppleProfile } | undefined;
          if (body?.code === 'account_not_found' && body.signupToken && body.appleProfile) {
            return { kind: 'needs-signup', signupToken: body.signupToken, profile: body.appleProfile };
          }
        }
        throw err;
      }
    },
    [applySession],
  );

  const completeGoogleSignup = useCallback(
    async ({ type, ...fields }: Omit<GoogleCompleteSignupPayload, 'user_type'> & { type: AccountType }): Promise<AuthUser> => {
      const res = await googleCompleteSignup({ ...fields, user_type: type });
      const nextType = res.user_type ?? type;
      setApiToken(res.token);
      const { user } = await getProfile(nextType);
      applySession(nextType, res.token, user);
      await saveSession({ token: res.token, refreshToken: res.refreshToken, accountType: nextType, user });
      return user;
    },
    [applySession],
  );

  const completeAppleSignup = useCallback(
    async ({ type, ...fields }: Omit<SocialCompleteSignupPayload, 'user_type'> & { type: AccountType }): Promise<AuthUser> => {
      const res = await completeSocialSignup({ ...fields, user_type: type });
      const nextType = res.user_type ?? type;
      setApiToken(res.token);
      const { user } = await getProfile(nextType);
      applySession(nextType, res.token, user);
      await saveSession({ token: res.token, refreshToken: res.refreshToken, accountType: nextType, user });
      return user;
    },
    [applySession],
  );

  const setSession = useCallback(
    async (type: AccountType, nextToken: string, nextUser: AuthUser) => {
      applySession(type, nextToken, nextUser);
      await saveSession({ token: nextToken, accountType: type, user: nextUser });
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    // Best-effort server logout. Local credentials are cleared regardless.
    try {
      // Detach this device from push first, while the token still works —
      // otherwise notifications keep arriving for the signed-out account.
      if (tokenRef.current && accountTypeRef.current) {
        await removeNotificationId(accountTypeRef.current);
      }
    } catch {
      // ignore — push detach is best-effort
    }
    try {
      if (tokenRef.current) await logoutRequest();
    } catch {
      // ignore — proceed with local clear regardless
    }
    await clearSession();
    setApiToken(null);
    setToken(null);
    setAccountType(null);
    setUser(null);
    queryClient.removeQueries();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accountType) return;
    const { user: fresh } = await getProfile(accountType);
    setUser(fresh);
    await saveUser(fresh);
  }, [accountType]);

  const switchMode = useCallback(async (): Promise<SwitchModeOutcome> => {
    let res: SwitchModeResponse;
    await queryClient.cancelQueries();
    try {
      res = await switchAccountMode();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === 'counterpart_not_found' && accountTypeRef.current === 'user') {
        const { user: currentUser } = await getProfile('user');
        if (!Array.isArray(currentUser.roleCreation?.missingFields)) throw new Error('Could not load Tasker setup requirements. Please try again.');
        setUser(currentUser);
        await saveUser(currentUser);
        return { kind: 'role-creation-required', accountType: 'tasker', user: currentUser, missingFields: currentUser.roleCreation.missingFields, profileUnavailable: false };
      }
      // During rollout, some backends return onboarding as non-2xx while still
      // including the destination-role credentials in the response body.
      const body = error instanceof ApiError ? error.body as SwitchModeResponse | undefined : undefined;
      const onboarding = Boolean(
        body && (
          body.status === 'onboarding_required' ||
          body.code === 'onboarding_required' ||
          body.onboarding_required ||
          body.onboardingRequired
        )
      );
      if (!onboarding || !body) throw error;
      res = body;
    }

    const onboardingRequired = Boolean(
      res.status === 'onboarding_required' ||
      res.code === 'onboarding_required' ||
      res.onboarding_required ||
      res.onboardingRequired
    );
    const fallbackType: AccountType = accountTypeRef.current === 'user' ? 'tasker' : 'user';
    const returnedType = String(res.user_type ?? res.role ?? '').toLowerCase();
    const nextType: AccountType =
      returnedType === 'user' || returnedType === 'tasker' ? returnedType : fallbackType;

    res.token = res.accessToken || res.token;
    if (!res.token) {
      throw new Error(
        onboardingRequired
          ? 'The server requested onboarding without issuing the new role token. Please update the backend and try again.'
          : 'The server did not return a token for the selected role.',
      );
    }

    // Save the rotated credentials before the first destination-role request.
    // A process kill or profile fetch failure can no longer restore the old JWT.
    try {
      await saveSession({
        token: res.token,
        refreshToken: res.refreshToken,
        accountType: nextType,
        user: null,
      });
    } catch {
      await clearSession().catch(() => undefined);
      setApiToken(null);
      setToken(null);
      setAccountType(null);
      setUser(null);
      queryClient.removeQueries();
      throw new Error('The new role was authorized, but this device could not save it. Please sign in again.');
    }

    applySession(nextType, res.token, null);
    queryClient.removeQueries();

    let nextUser: AuthUser | null = null;
    let profileUnavailable = false;
    try {
      const profile = await getProfile(nextType);
      nextUser = profile.user;
      applySession(nextType, res.token, nextUser);
      await saveUser(nextUser);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized && !error.afterSuccessfulRefresh) {
        await clearSession().catch(() => undefined);
        setApiToken(null);
        setToken(null);
        setAccountType(null);
        setUser(null);
        queryClient.removeQueries();
        throw new Error('The new role token could not be verified. Please sign in again.');
      }
      // The role handoff is already complete and durable. Never restore the old
      // role token merely because profile hydration had a transient failure.
      profileUnavailable = true;
    }

    return {
      kind: onboardingRequired ? 'onboarding-required' : 'switched',
      accountType: nextType,
      accountId: res.accountId,
      user: nextUser,
      missingFields: Array.isArray(res.missingFields) ? res.missingFields : [],
      profileUnavailable,
    };
  }, [applySession]);

  const linkRoleAndSwitch = useCallback(async (email: string, password: string) => {
    const res = await linkAccountAndSwitch(email.trim().toLowerCase(), password);
    setApiToken(res.token);
    const { user: nextUser } = await getProfile(res.user_type);
    applySession(res.user_type, res.token, nextUser);
    await saveSession({ token: res.token, refreshToken: res.refreshToken, accountType: res.user_type, user: nextUser });
    queryClient.removeQueries();
    return nextUser;
  }, [applySession]);

  const createRoleAndSwitch = useCallback(async (payload: LinkedRolePayload) => {
    await queryClient.cancelQueries();
    const res = await createLinkedRole(payload);
    return acceptCreatedRole(res, payload.user_type, {
      persist: async (session) => {
        try { await saveSession(session); }
        catch {
          await clearSession().catch(() => undefined);
          setApiToken(null); setToken(null); setAccountType(null); setUser(null);
          queryClient.removeQueries();
          throw new Error('The new role was authorized, but this device could not save it. Please sign in again.');
        }
      },
      activate: applySession,
      discardRoleCache: () => queryClient.removeQueries(),
      fetchProfile: getProfile,
      persistUser: saveUser,
    });
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(token),
      user,
      token,
      accountType,
      signIn,
      signInWithGoogle,
      signInWithApple,
      completeGoogleSignup,
      completeAppleSignup,
      setSession,
      signOut,
      refreshProfile,
      switchMode,
      linkRoleAndSwitch,
      createRoleAndSwitch,
    }),
    [
      isBootstrapping,
      token,
      user,
      accountType,
      signIn,
      signInWithGoogle,
      signInWithApple,
      completeGoogleSignup,
      completeAppleSignup,
      setSession,
      signOut,
      refreshProfile,
      switchMode,
      linkRoleAndSwitch,
      createRoleAndSwitch,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
