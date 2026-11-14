import { Linking } from 'react-native';
import { api } from '@/lib/api/client';

type HandoffAction =
  | { action: 'identity-verification' }
  | { action: 'payment-verification'; reference: string };

export async function continueOnWebsite(action: HandoffAction) {
  const response = await api.post<{ data: { token: string } }>('/api/auth/mobile-web-handoff', action);
  const token = response.data?.token;
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token)) throw new Error('Could not open TaskHub on the web.');
  const website = 'https://www.ngtaskhub.com/mobile-handoff';
  await Linking.openURL(website + '#code=' + encodeURIComponent(token));
}
