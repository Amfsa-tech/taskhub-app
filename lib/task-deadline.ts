export type DeadlineTask = { status: string; deadline?: string | null; closedAt?: string | null; serverStatus?: string; biddingClosed?: boolean; bidSelectionEndsAt?: string | null };

/** Date-only deadlines end at midnight in Nigeria, not the device timezone. */
export function taskDeadlineAt(value?: string | null): number {
  if (!value) return NaN;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999+01:00` : value).getTime();
}

/** Display the server's Nigeria calendar date consistently on every device. */
export function taskDeadlineLabel(value?: string | null): string {
  const at = taskDeadlineAt(value);
  return Number.isFinite(at) ? new Date(at).toLocaleDateString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' }) : 'No bidding deadline';
}

export function taskDeadlinePassed(task: DeadlineTask, now = Date.now()): boolean {
  return Boolean(task.deadline) && (!Number.isFinite(taskDeadlineAt(task.deadline)) || taskDeadlineAt(task.deadline) <= now);
}

export function taskIsAvailable(task: DeadlineTask, now = Date.now()): boolean {
  return task.status === 'open' && task.biddingClosed !== true && !taskDeadlinePassed(task, now);
}

export function withTaskDeadline<T extends DeadlineTask>(task: T, now = Date.now()): T {
  return typeof task.biddingClosed !== 'boolean' && task.status === 'open' && taskDeadlinePassed(task, now)
    ? { ...task, serverStatus: task.serverStatus || 'open', status: 'closed' } : task;
}

export function canReopenTask(task: DeadlineTask, now = Date.now()): boolean {
  const closedAt = task.closedAt ? new Date(task.closedAt).getTime() : task.bidSelectionEndsAt ? new Date(task.bidSelectionEndsAt).getTime() : taskDeadlineAt(task.deadline);
  return withTaskDeadline(task, now).status === 'closed' && Number.isFinite(closedAt)
    && now >= closedAt && now < closedAt + 30 * 24 * 60 * 60 * 1000;
}

export function requireAvailableTask(task: DeadlineTask): void {
  if (!taskIsAvailable(task)) throw new Error('This task is closed. New bids, invitations and hiring are unavailable.');
}

/** Selecting an existing offer remains possible during the server's choice window. */
export function canSelectOffer(task: DeadlineTask, now = Date.now()): boolean {
  if (task.status !== 'open') return false;
  if (taskIsAvailable(task, now)) return true;
  return task.biddingClosed === true && !!task.bidSelectionEndsAt && new Date(task.bidSelectionEndsAt).getTime() > now;
}
export function requireSelectableOffer(task: DeadlineTask): void {
  if (typeof task.biddingClosed !== 'boolean') requireAvailableTask(task);
  if (canSelectOffer(task)) return;
  if (task.status === 'open' && task.biddingClosed === true && task.bidSelectionEndsAt && new Date(task.bidSelectionEndsAt).getTime() <= Date.now()) {
    throw Object.assign(new Error('The time to choose an offer has ended. Refresh the task and reopen it to receive new offers.'), { data: { code: 'BID_SELECTION_EXPIRED' } });
  }
  throw new Error('This task no longer accepts offer selections. Refresh the task to see its current status.');
}
/** Always send a calendar date. Never convert a selected local midnight to UTC. */
export function taskDeadlineDate(value?: string | null): string | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Choose a valid bidding deadline date.');
  return day;
}
export function biddingNotice(task: DeadlineTask, owner = false): string | null {
  if (task.status !== 'open' || !taskDeadlinePassed(task) && task.biddingClosed !== true) return null;
  const end = task.bidSelectionEndsAt && new Date(task.bidSelectionEndsAt);
  if (owner && end && Number.isFinite(end.getTime()) && end.getTime() <= Date.now()) return 'Offer selection ended. Refresh this task to check its closure before reopening.';
  if (owner && end && Number.isFinite(end.getTime())) return `Choose an offer by ${end.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} (Nigeria time).`;
  return 'Bidding ended';
}

/** Wake queries when the next visible task closes; avoid periodic polling. */
export function nextTaskExpiryDelay(data: unknown, now = Date.now()): number | false {
  let next = Infinity;
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (record.status === 'open' && typeof record.deadline === 'string') {
      const at = record.biddingClosed === true && typeof record.bidSelectionEndsAt === 'string' ? new Date(record.bidSelectionEndsAt).getTime() : record.biddingClosed === true ? NaN : taskDeadlineAt(record.deadline);
      if (Number.isFinite(at)) next = Math.min(next, at > now ? at - now + 10 : record.biddingClosed === true ? 5000 : 1000);
    }
    Object.values(record).forEach(visit);
  };
  visit(data);
  return Number.isFinite(next) ? Math.min(next, 2_147_483_647) : false;
}
