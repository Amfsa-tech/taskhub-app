import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getKycProviders } from '@/lib/api/kyc';
import { kycProviderEnabled, type KycProviderKey } from '@/lib/kyc-providers';

export function useKycProviders(enabled = true) {
  const query = useQuery({
    queryKey: ['kyc-providers'],
    queryFn: ({ signal }) => getKycProviders(signal),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: false,
    refetchInterval: false,
  });
  const { refetch } = query;
  const checkEnabled = useCallback(async (key: KycProviderKey) => {
    const latest = await refetch();
    if (latest.error) throw latest.error;
    if (!kycProviderEnabled(latest.data, key)) {
      throw new Error('This verification option is currently unavailable. Please choose another available option.');
    }
  }, [refetch]);
  return { ...query, data: enabled && !query.isError ? query.data : undefined, checkEnabled };
}
