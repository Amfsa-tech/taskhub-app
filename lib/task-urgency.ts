import { taskDeadlineAt } from '@/lib/task-deadline';
export type UrgentTask = { status?: string; biddingClosed?: boolean; deadline?: string | null; tags?: string[] };
/** Bidding deadlines become urgent during their final 72 hours. */
export function isUrgent(task: UrgentTask, now = Date.now()): boolean {
  if (task.biddingClosed === true) return false;
  if (['closed', 'cancelled', 'completed'].includes(task.status || '')) return false;
  if (task.status === 'open' && task.deadline && taskDeadlineAt(task.deadline) <= now) return false;
  if ((task.tags || []).some((tag) => tag.trim().toLowerCase() === 'urgent')) return true;
  const due = taskDeadlineAt(task.deadline);
  return task.status === 'open' && Number.isFinite(due) && due > now && due - now <= 72 * 60 * 60 * 1000;
}
