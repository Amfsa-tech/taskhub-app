import { useSyncExternalStore } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { buildSupportMessage, currentSupportIssue, getSupportSnapshot, getServerSupportSnapshot, subscribeSupport, supportIdentity, supportScope, supportTopic, type SupportIssue } from '@/lib/support-context';

export function useSupportMessage(issue?: SupportIssue, topic?: string) {
  const { user, isAuthenticated, isBootstrapping, refreshProfile } = useAuth();
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribeSupport, getSupportSnapshot, getServerSupportSnapshot);
  const currentScope = supportScope(user?._id, pathname);
  const explicitIssue = issue?.scope && issue.scope !== currentScope ? undefined : issue;
  const activeIssue = explicitIssue || (pathname === '/home' ? undefined : currentSupportIssue(snapshot, currentScope));
  return {
    isLoadingIdentity: Boolean(isBootstrapping && !user),
    async resolveMessage() {
      const { name, email } = supportIdentity(user);
      const fresh = isAuthenticated && (!name || !email) ? await refreshProfile() : null;
      return buildSupportMessage(fresh ? { ...user, ...fresh } : user, activeIssue, topic || supportTopic(pathname));
    },
  };
}
