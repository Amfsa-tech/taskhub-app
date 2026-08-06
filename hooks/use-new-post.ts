import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { usePostTask } from '@/context/PostTaskContext';

/**
 * Starts a fresh post: clears any previous draft, then opens category
 * selection. Every "post a task" entry point goes through this — post-category
 * itself must NOT reset on mount, because the flow navigates back to it
 * mid-draft (e.g. from post-service).
 */
export function useNewPost() {
  const router = useRouter();
  const { reset } = usePostTask();

  return useCallback(
    (options?: { replace?: boolean }) => {
      reset();
      if (options?.replace) {
        router.replace('/post-category');
      } else {
        router.push('/post-category');
      }
    },
    [reset, router],
  );
}
