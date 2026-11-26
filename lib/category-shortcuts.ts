import type { Category } from '@/lib/api/categories';
export interface MainCategoryGroup {
  main: Category;
  subs: Category[];
}

/** Group the flat list into main categories, each with its subcategories. */
export function groupCategories(categories: Category[]): MainCategoryGroup[] {
  const mains = categories.filter((c) => !c.parentCategory);
  const byParent = new Map<string, Category[]>();
  for (const c of categories) {
    const parentId = typeof c.parentCategory === 'string' ? c.parentCategory : c.parentCategory?._id;
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


export function categoryShortcut(categories: Category[], key: string): Category | undefined {
  const terms = key === 'remote' ? ['remote', 'digital', 'online'] : key === 'errands' ? ['errand', 'deliver'] : [key];
  return groupCategories(categories).find(({ main, subs }) => subs.length > 0 && terms.some((term) => `${main.name} ${main.displayName}`.toLowerCase().includes(term)))?.main;
}
