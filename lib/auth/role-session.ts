import type { AccountType, AuthUser } from './types';

interface CreatedRoleSession {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user_type?: AccountType;
  role?: AccountType;
}

interface HandoffDependencies {
  persist: (session: { token: string; refreshToken?: string; accountType: AccountType; user: null }) => Promise<void>;
  activate: (role: AccountType, token: string, user: AuthUser | null) => void;
  discardRoleCache: () => void;
  fetchProfile: (role: AccountType) => Promise<{ user: AuthUser }>;
  persistUser: (user: AuthUser) => Promise<void>;
}

/** Never issue a destination-role request until its credentials are durable and active. */
export async function acceptCreatedRole(session: CreatedRoleSession, expectedRole: AccountType, dependencies: HandoffDependencies): Promise<AuthUser> {
  const token = session.accessToken || session.token;
  const role = session.user_type || session.role;
  if (typeof token !== 'string' || !token || role !== expectedRole) throw new Error('The server did not return a valid session for the new role.');
  await dependencies.persist({ token, refreshToken: session.refreshToken, accountType: role, user: null });
  dependencies.activate(role, token, null);
  dependencies.discardRoleCache();
  const { user } = await dependencies.fetchProfile(role);
  dependencies.activate(role, token, user);
  await dependencies.persistUser(user);
  return user;
}
