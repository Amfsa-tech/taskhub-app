import { taskDeadlinePassed } from '@/lib/task-deadline';
export type FilterOption = { value: string; label: string };
export type TaskFilters = { statuses: string[]; categories: string[]; types: string[]; from: string; to: string };
export const emptyTaskFilters = (): TaskFilters => ({ statuses: [], categories: [], types: [], from: '', to: '' });
export type FilterTask = {
  _id?: string; status?: string; createdAt?: string; deadline?: string | null; biddingClosed?: boolean; bidSelectionEndsAt?: string | null; closedReason?: string; mainCategory?: { _id?: string; name?: string; displayName?: string } | string | null;
  task?: unknown; bidType?: string; invitedByUser?: boolean; taskerConfirmed?: boolean;
};
export const HISTORY_STATUSES: FilterOption[] = [
  { value: 'completed', label: 'Completed' }, { value: 'closed', label: 'Closed' }, { value: 'cancelled', label: 'Cancelled' },
];
export const PENDING_TYPES: FilterOption[] = [{ value: 'invitation', label: 'Invitations' }, { value: 'bid', label: 'Bids sent' }];
export function filterTask(item: FilterTask): FilterTask {
  return item.task && typeof item.task === 'object' ? item.task as FilterTask : item;
}
export function historyStatus(item: FilterTask, now = Date.now()): string | null {
  const task = filterTask(item), offer = task !== item || !!item.bidType || item.invitedByUser;
  if (offer && item.status === 'rejected') return item.closedReason === 'bid_selection_expired' ? 'expired' : 'not-selected';
  if (offer && ['cancelled', 'canceled'].includes(item.status || '')) return 'cancelled';
  const status = typeof task.biddingClosed !== 'boolean' && task.status === 'open' && taskDeadlinePassed({ status: 'open', deadline: task.deadline }, now) ? 'closed' : task.status || '';
  if (['closed', 'cancelled', 'canceled'].includes(status)) return status === 'canceled' ? 'cancelled' : status;
  if (offer && item.status !== 'accepted' && ['assigned', 'in-progress', 'awaiting-confirmation', 'completed'].includes(status)) return 'not-selected';
  return status === 'completed' ? 'completed' : null;
}
export function pendingType(item: FilterTask): string {
  return item.invitedByUser || ['invite', 'invitation'].includes(item.bidType || '') ? 'invitation' : 'bid';
}
function category(item: FilterTask): FilterOption | null {
  const main = filterTask(item).mainCategory;
  if (!main) return null;
  const label = typeof main === 'string' ? main : main.displayName || main.name || '';
  if (!label || /^[a-f0-9]{24}$/i.test(label)) return null;
  return { value: typeof main === 'string' ? main : main._id || label, label };
}
export function taskCategoryOptions(items: FilterTask[]): FilterOption[] {
  const options = items.map(category).filter((value): value is FilterOption => !!value);
  return [...new Map(options.map(value => [value.value, value])).values()].sort((a,b) => a.label.localeCompare(b.label));
}
/** Date ranges use task posting dates in Nigeria, inclusive of both selected days. */
export function matchesTaskFilters(item: FilterTask, filters: TaskFilters): boolean {
  if (filters.statuses.length && !filters.statuses.includes(historyStatus(item) || '')) return false;
  const task = filterTask(item), main = task.mainCategory;
  const categoryValue = typeof main === 'string' ? main : main?._id || main?.displayName || main?.name;
  if (filters.categories.length && (!categoryValue || !filters.categories.includes(categoryValue))) return false;
  if (filters.types.length && !filters.types.includes(pendingType(item))) return false;
  if (filters.from || filters.to) {
    const value = task.createdAt;
    if (!value) return false;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return false;
    const day = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(time + 3600000).toISOString().slice(0,10);
    if (filters.from && day < filters.from || filters.to && day > filters.to) return false;
  }
  return true;
}
export function hasTaskFilters(filters: TaskFilters): boolean {
  return !!(filters.statuses.length || filters.categories.length || filters.types.length || filters.from || filters.to);
}
export function dateRangeError(filters: TaskFilters): string | null {
  return filters.from && filters.to && filters.from > filters.to ? 'The end date must be on or after the start date.' : null;
}
