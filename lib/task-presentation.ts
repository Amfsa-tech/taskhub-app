/** Read labels from task data without inventing a location, category or date. */
type Category = { name?: string; displayName?: string } | string | null;
type TaskSummary = {
  mainCategory?: Category; subCategory?: Category; categories?: Category[];
  location?: { address?: string; city?: string; state?: string; country?: string } | string | null;
};
function categoryText(category?: Category): string {
  const value = typeof category === 'string' ? category : category?.displayName || category?.name || '';
  return /^[a-f0-9]{24}$/i.test(value.trim()) ? '' : value.trim();
}
export function taskCategoryLabel(task?: TaskSummary): string {
  return categoryText(task?.subCategory) || categoryText(task?.mainCategory)
    || task?.categories?.map(categoryText).find(Boolean) || 'Category not provided';
}
export function taskLocationLabel(task: TaskSummary): string {
  const location = task.location;
  if (typeof location === 'string' && location.trim()) return location.trim();
  if (location && typeof location === 'object') {
    const parts: string[] = [];
    for (const value of [location.address, location.city, location.state, location.country]) {
      const part = value?.trim();
      if (part && !parts.join(', ').toLowerCase().includes(part.toLowerCase())) parts.push(part);
    }
    if (parts.length) return parts.join(', ');
  }
  const category = [categoryText(task.mainCategory), categoryText(task.subCategory)].join(' ');
  return /remote|digital|online/i.test(category) ? 'Remote' : 'Location not provided';
}
export function taskPostedDate(value?: string | null): string {
  if (!value) return 'Posting date unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Posting date unavailable';
  return `Posted ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
