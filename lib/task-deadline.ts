export type DeadlineTask = { status: string; deadline?: string | null; closedAt?: string | null; serverStatus?: string };

/** Date-only deadlines end at midnight in Nigeria, not the device timezone. */
export function taskDeadlineAt(value?: string | null): number {
  if (!value) return NaN;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999+01:00` : value).getTime();
}

export function taskDeadlinePassed(task: DeadlineTask, now = Date.now()): boolean {
  return Boolean(task.deadline) && (!Number.isFinite(taskDeadlineAt(task.deadline)) || taskDeadlineAt(task.deadline) <= now);
}

export function taskIsAvailable(task: DeadlineTask, now = Date.now()): boolean {
  return task.status === 'open' && !taskDeadlinePassed(task, now);
}

export function withTaskDeadline<T extends DeadlineTask>(task: T, now = Date.now()): T {
  return task.status === 'open' && taskDeadlinePassed(task, now)
    ? { ...task, serverStatus: task.serverStatus || 'open', status: 'closed' } : task;
}

export function canReopenTask(task: DeadlineTask, now = Date.now()): boolean {
  const closedAt = task.closedAt ? new Date(task.closedAt).getTime() : taskDeadlineAt(task.deadline);
  return withTaskDeadline(task, now).status === 'closed' && Number.isFinite(closedAt)
    && now >= closedAt && now < closedAt + 30 * 24 * 60 * 60 * 1000;
}

export function requireAvailableTask(task: DeadlineTask): void {
  if (!taskIsAvailable(task)) throw new Error('This task is closed. New bids, invitations and hiring are unavailable.');
}

/** Wake queries when the next visible task closes; avoid periodic polling. */
export function nextTaskExpiryDelay(data: unknown, now = Date.now()): number | false {
  let next = Infinity;
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (record.status === 'open' && typeof record.deadline === 'string') {
      const at = taskDeadlineAt(record.deadline);
      if (Number.isFinite(at)) next = Math.min(next, at > now ? at - now + 10 : 1000);
    }
    Object.values(record).forEach(visit);
  };
  visit(data);
  return Number.isFinite(next) ? Math.min(next, 2_147_483_647) : false;
}
