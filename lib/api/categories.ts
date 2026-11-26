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
  parentCategory?: { _id: string; name: string; displayName: string } | string | null;
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

export { groupCategories, categoryShortcut, type MainCategoryGroup } from '@/lib/category-shortcuts';

/** True when a main category requires a university (campus tasks). */
export function isCampusCategory(main: Category): boolean {
  return main.name.includes('campus');
}
