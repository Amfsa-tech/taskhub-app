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

import { ApiError, setApiToken } from '@/lib/api/client';
import {
  getProfile,
  googleAuth,
  googleCompleteSignup,
  login,
  logout as logoutRequest,
} from './auth-api';
import { getGoogleIdToken } from './google';
import {
  clearSession,
  loadSession,
  saveSession,
  saveUser,
} from './storage';
import type { AccountType, AuthUser, GoogleProfile, LoginPayload } from './types';

/** Result of a Google sign-in attempt: either signed in, or needs Phase-2 completion. */
export type GoogleSignInOutcome =
  | { kind: 'signed-in'; user: AuthUser }
  | { kind: 'needs-signup'; idToken: string; profile: GoogleProfile };

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
  /** Finish a Google signup (Phase 2) with the collected fields, then sign in. */
  completeGoogleSignup: (args: {
    idToken: string;
    type: AccountType;
    fullName: string;
    country: string;
  }) => Promise<AuthUser>;
  /** Adopt a session obtained elsewhere (e.g. right after verify-email). */
  setSession: (type: AccountType, token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-fetch the full profile for the current account. */
  refreshProfile: () => Promise<void>;
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

  const applySession = useCallback(
    (nextType: AccountType, nextToken: string, nextUser: AuthUser | null) => {
      setApiToken(nextToken);
      setToken(nextToken);
      setAccountType(nextType);
      setUser(nextUser);
    },
    [],
  );

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
          if (err instanceof ApiError && err.isUnauthorized && !cancelled) {
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

      // Login succeeds even for unverified accounts. Don't establish a session;
      // surface a verification error so the screen can route to the OTP flow.
      if (!res.isEmailVerified) {
        setApiToken(null);
        throw new ApiError('Please verify your email to continue.', 403, {
          emailVerificationRequired: true,
        });
      }

      setApiToken(res.token);
      const { user } = await getProfile(accountType);
      applySession(accountType, res.token, user);
      await saveSession({ token: res.token, accountType, user });
      return user;
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
        await saveSession({ token: res.token, accountType: nextType, user });
        return { kind: 'signed-in', user };
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

  const completeGoogleSignup = useCallback(
    async ({
      idToken,
      type,
      fullName,
      country,
    }: {
      idToken: string;
      type: AccountType;
      fullName: string;
      country: string;
    }): Promise<AuthUser> => {
      const res = await googleCompleteSignup({ idToken, user_type: type, fullName, country });
      const nextType = res.user_type ?? type;
      setApiToken(res.token);
      const { user } = await getProfile(nextType);
      applySession(nextType, res.token, user);
      await saveSession({ token: res.token, accountType: nextType, user });
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
    // Best-effort server logout; the token never expires server-side, so the
    // important part is clearing it locally.
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
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accountType) return;
    const { user: fresh } = await getProfile(accountType);
    setUser(fresh);
    await saveUser(fresh);
  }, [accountType]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(token),
      user,
      token,
      accountType,
      signIn,
      signInWithGoogle,
      completeGoogleSignup,
      setSession,
      signOut,
      refreshProfile,
    }),
    [
      isBootstrapping,
      token,
      user,
      accountType,
      signIn,
      signInWithGoogle,
      completeGoogleSignup,
      setSession,
      signOut,
      refreshProfile,
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
