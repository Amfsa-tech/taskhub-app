// Holds the in-progress "post a task" draft across the multi-step flow
// (post → post-category → post-service → post-details → post-review).
// Each expo-router screen is a separate component, so a shared context is the
// simplest way to carry the draft between them without threading route params.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Category } from '@/lib/api/categories';
import type { PickedImage } from '@/lib/image-picker';

export interface PostTaskDraft {
  mainCategory: Category | null;
  subCategories: Category[];
  title: string;
  description: string;
  budget: string; // raw text input
  location: string; // display only for now; the task uses the profile location
  images: PickedImage[];
}

const EMPTY: PostTaskDraft = {
  mainCategory: null,
  subCategories: [],
  title: '',
  description: '',
  budget: '',
  location: '',
  images: [],
};

interface PostTaskContextValue {
  draft: PostTaskDraft;
  setMainCategory: (category: Category) => void;
  toggleSubCategory: (category: Category) => void;
  patch: (partial: Partial<PostTaskDraft>) => void;
  reset: () => void;
}

const PostTaskContext = createContext<PostTaskContextValue | undefined>(undefined);

export function PostTaskProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PostTaskDraft>(EMPTY);

  const setMainCategory = useCallback((category: Category) => {
    setDraft((d) =>
      d.mainCategory?._id === category._id
        ? { ...d, mainCategory: category }
        : // Switching main category drops subcategories that no longer apply.
          { ...d, mainCategory: category, subCategories: [] },
    );
  }, []);

  const toggleSubCategory = useCallback((category: Category) => {
    setDraft((d) => {
      const exists = d.subCategories.some((s) => s._id === category._id);
      return {
        ...d,
        subCategories: exists
          ? d.subCategories.filter((s) => s._id !== category._id)
          : [...d.subCategories, category],
      };
    });
  }, []);

  const patch = useCallback((partial: Partial<PostTaskDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const reset = useCallback(() => setDraft(EMPTY), []);

  const value = useMemo<PostTaskContextValue>(
    () => ({ draft, setMainCategory, toggleSubCategory, patch, reset }),
    [draft, setMainCategory, toggleSubCategory, patch, reset],
  );

  return <PostTaskContext.Provider value={value}>{children}</PostTaskContext.Provider>;
}

export function usePostTask(): PostTaskContextValue {
  const ctx = useContext(PostTaskContext);
  if (!ctx) {
    throw new Error('usePostTask must be used within a <PostTaskProvider>');
  }
  return ctx;
}
