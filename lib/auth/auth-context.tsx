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
import { getProfile, login, logout as logoutRequest } from './auth-api';
import {
  clearSession,
  loadSession,
  saveSession,
  saveUser,
} from './storage';
import type { AccountType, AuthUser, LoginPayload } from './types';

interface AuthContextValue {
  /** True until the persisted session has been read on launch. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  accountType: AccountType | null;
  /** Authenticate and persist the session. Returns the signed-in user. */
  signIn: (type: AccountType, payload: LoginPayload) => Promise<AuthUser>;
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
      const res = await login(type, payload);
      applySession(type, res.token, res.user);
      await saveSession({ token: res.token, accountType: type, user: res.user });
      return res.user;
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
      setSession,
      signOut,
      refreshProfile,
    }),
    [isBootstrapping, token, user, accountType, signIn, setSession, signOut, refreshProfile],
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
