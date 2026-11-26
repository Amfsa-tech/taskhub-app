import { useEffect, useState } from 'react';
import { taskDeadlineAt } from '@/lib/task-deadline';
import { isUrgent, type UrgentTask } from '@/lib/task-urgency';
/** Update a visible badge at the urgency boundary, without waiting for a network refresh. */
export function useTaskUrgency(task: UrgentTask): boolean {
  const [version, refresh] = useState(0);
  useEffect(() => {
    if (['closed', 'cancelled', 'completed'].includes(task.status || '')) return;
    const due = taskDeadlineAt(task.deadline), now = Date.now();
    const changes = [due - 72 * 60 * 60 * 1000, due].filter((at) => Number.isFinite(at) && at > now);
    if (!changes.length) return;
    const timer = setTimeout(() => refresh((value) => value + 1), Math.min(Math.min(...changes) - now + 20, 2_147_483_647));
    return () => clearTimeout(timer);
  }, [task.deadline, task.status, version]);
  return isUrgent(task);
}
