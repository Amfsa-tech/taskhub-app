import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth/auth-context';

/**
 * Entry route — the single decision point for a cold start:
 *   - restored session -> straight into the app shell
 *   - no session       -> splash -> onboarding -> login
 *
 * The native splash is held until the persisted session has been read (see
 * `_layout`), so `isBootstrapping` is effectively always false by the time this
 * renders. The guard is here so a slow SecureStore read can't flash the
 * onboarding intro at an already-signed-in user.
 */
export default function Index() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/home' : '/splash'} />;
}
