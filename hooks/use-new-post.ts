import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { usePostTask } from '@/context/PostTaskContext';
import type { Category } from '@/lib/api/categories';

/**
 * Starts a fresh post: clears any previous draft, then opens category
 * selection, or services when a category shortcut supplies its selection. Every "post a task" entry point goes through this — post-category
 * itself must NOT reset on mount, because the flow navigates back to it
 * mid-draft (e.g. from post-service).
 */
export function useNewPost() {
  const router = useRouter();
  const { reset, setMainCategory } = usePostTask();

  return useCallback(
    (options?: { replace?: boolean; mainCategory?: Category }) => {
      reset();
      if (options?.mainCategory) setMainCategory(options.mainCategory);
      const destination = options?.mainCategory ? '/post-service' : '/post-category';
      if (options?.replace) {
        router.replace(destination);
      } else {
        router.push(destination);
      }
    },
    [reset, setMainCategory, router],
  );
}
