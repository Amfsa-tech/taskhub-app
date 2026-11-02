import { useSyncExternalStore } from 'react';
import { usePathname } from 'expo-router';
import { useAuth } from '@/lib/auth/auth-context';
import { buildSupportMessage, currentSupportIssue, getSupportSnapshot, getServerSupportSnapshot, subscribeSupport, supportScope, supportTopic, type SupportIssue } from '@/lib/support-context';

export function useSupportMessage(issue?: SupportIssue, topic?: string) {
  const { user } = useAuth();
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribeSupport, getSupportSnapshot, getServerSupportSnapshot);
  const currentScope = supportScope(user?._id, pathname);
  const explicitIssue = issue?.scope && issue.scope !== currentScope ? undefined : issue;
  return buildSupportMessage(user, explicitIssue || currentSupportIssue(snapshot, currentScope), topic || supportTopic(pathname));
}
