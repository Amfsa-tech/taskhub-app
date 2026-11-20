import { useQuery } from '@tanstack/react-query';
import { getKycStatus } from '@/lib/api/kyc';
import { queryKeys } from '@/lib/api/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { getTaskerProfileProgress } from '@/lib/tasker-profile-progress';

export function useTaskerProfileProgress() {
  const { user, accountType } = useAuth();
  const verification = useQuery({
    queryKey: queryKeys.kycStatus(),
    queryFn: ({ signal }) => getKycStatus(signal),
    enabled: accountType === 'tasker' && !!user?._id,
    staleTime: 60_000,
    retry: false,
  });
  return getTaskerProfileProgress(user, accountType === 'tasker' ? verification.data?.data : undefined);
}
