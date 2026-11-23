import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { buildSupportMessage, currentSupportIssue, getSupportOrigin, getSupportSnapshot, supportIdentity, supportScope, supportTopic, type SupportIssue } from '@/lib/support-context';

export function useSupportMessage(issue?: SupportIssue, topic?: string) {
  const { user, accountType, isAuthenticated, isBootstrapping, refreshProfile } = useAuth();
  const pathname = usePathname();
  const currentScope = supportScope(user?._id, pathname);
  const latest = useRef({ currentScope, accountType, mounted: true });
  useLayoutEffect(() => {
    latest.current = { currentScope, accountType, mounted: true };
    return () => { latest.current.mounted = false; };
  }, [currentScope, accountType]);
  return {
    isLoadingIdentity: Boolean(isBootstrapping && !user),
    async resolveMessage() {
      const origin = pathname === '/help-support' ? getSupportOrigin(currentScope) : undefined;
      const explicitIssue = issue?.scope && issue.scope !== currentScope ? undefined : issue;
      const activeIssue = explicitIssue || origin?.issue || (pathname === '/home' ? undefined : currentSupportIssue(getSupportSnapshot(), currentScope));
      const { name, email } = supportIdentity(user);
      const fresh = isAuthenticated && (!name || !email) ? await refreshProfile() : null;
      if (!latest.current.mounted || latest.current.currentScope !== currentScope || latest.current.accountType !== accountType || (fresh?._id && fresh._id !== user?._id)) {
        throw new Error('Your account or screen changed. Please open support again.');
      }
      return buildSupportMessage(fresh ? { ...user, ...fresh } : user, activeIssue, topic || supportTopic(origin?.pathname || pathname));
    },
  };
}
