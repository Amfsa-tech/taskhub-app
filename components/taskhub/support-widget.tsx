import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/auth-context';
import { SupportContactButton } from './support-contact';

const TAB_ROUTES = ['/home', '/discover', '/tasks', '/profile'];
const SUPPORT_ROUTES = [...TAB_ROUTES, '/wallet', '/transaction-history', '/help-support'];

export function SupportWidget() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  if (!user || !SUPPORT_ROUTES.includes(pathname)) return null;
  return <SupportContactButton key={pathname} label="Need help?" style={{ position: 'absolute', right: 16, bottom: insets.bottom + (TAB_ROUTES.includes(pathname) ? 96 : 24), borderRadius: 24, borderColor: '#15803d' }} />;
}
