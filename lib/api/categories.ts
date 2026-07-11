// Categories API bindings for the TaskHub backend.
//
// The category list is flat: a category with no `parentCategory` is a main
// category; one with a `parentCategory` is a subcategory of it. `groupCategories`
// reshapes the flat list into main categories each carrying their subcategories.

import { api } from './client';

export interface Category {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  minimumPrice?: number;
  suggestedPrice?: number;
  parentCategory?: { _id: string; name: string; displayName: string } | null;
}

export interface CategoriesResponse {
  status: string;
  count: number;
  categories: Category[];
}

/** Public — all active categories (main + sub) in one flat list. */
export function getCategories(signal?: AbortSignal) {
  return api.get<CategoriesResponse>('/api/categories', { signal, auth: false });
}

export interface MainCategoryGroup {
  main: Category;
  subs: Category[];
}

/** Group the flat list into main categories, each with its subcategories. */
export function groupCategories(categories: Category[]): MainCategoryGroup[] {
  const mains = categories.filter((c) => !c.parentCategory);
  const byParent = new Map<string, Category[]>();
  for (const c of categories) {
    const parentId = c.parentCategory?._id;
    if (parentId) {
      const arr = byParent.get(parentId) ?? [];
      arr.push(c);
      byParent.set(parentId, arr);
    }
  }
  return mains
    .map((main) => ({
      main,
      subs: (byParent.get(main._id) ?? []).sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    }))
    .sort((a, b) => a.main.displayName.localeCompare(b.main.displayName));
}

/** True when a main category requires a university (campus tasks). */
export function isCampusCategory(main: Category): boolean {
  return main.name.includes('campus');
}
