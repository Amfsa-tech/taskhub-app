import { api } from './client';
import { parseMyReferrals } from '@/lib/referrals';

export async function getMyReferrals(signal?: AbortSignal) {
  return parseMyReferrals(await api.get<unknown>('/api/referrals/me', { signal }));
}
