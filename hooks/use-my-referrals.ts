import { useQuery } from '@tanstack/react-query';

import { getMyReferrals } from '@/lib/api/referrals';
import { useAuth } from '@/lib/auth/auth-context';

export function useMyReferrals() {
  const { user, accountType } = useAuth();
  const enabled = !!user?._id && !!accountType;
  const query = useQuery({
    queryKey: ['referrals', 'me', accountType, user?._id],
    queryFn: async ({ signal }) => {
      const result = await getMyReferrals(signal);
      if (result.accountType !== (accountType === 'tasker' ? 'Tasker' : 'User')) {
        throw new Error('Could not load referrals for this profile. Please try again.');
      }
      return result;
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  return { ...query, data: enabled ? query.data : undefined };
}
