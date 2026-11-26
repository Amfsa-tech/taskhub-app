export type TaskStage = { _id?: string; id?: string; status?: string; biddingClosed?: boolean; escrowStatus?: string; isEscrowHeld?: boolean };
export type OfferStage = { _id?: string; id?: string; status?: string; task?: TaskStage | string | null; taskerConfirmed?: boolean; invitedByUser?: boolean; bidType?: string; createdAt?: string; updatedAt?: string };
export const activeWorkStatuses = ['assigned', 'in-progress', 'awaiting-confirmation'];
export function isHireInvitation(offer: OfferStage): boolean {
  return Boolean(offer.invitedByUser || ['invitation', 'invite', 'direct'].includes(offer.bidType || ''));
}
export function invitationNeedsResponse(offer: OfferStage): boolean {
  return isHireInvitation(offer) && ['pending', 'invited'].includes(offer.status || '') && !offer.taskerConfirmed
    && typeof offer.task === 'object' && offer.task !== null && offer.task.status === 'open' && offer.task.biddingClosed !== true;
}
export function offerTaskId(offer: OfferStage): string {
  return typeof offer.task === 'string' ? offer.task : offer.task?._id || offer.task?.id || '';
}
/** The same offer can arrive through invitations, bids and task detail caches. */
export function uniqueTaskerOffers<T extends OfferStage>(offers: T[]): T[] {
  const byTask = new Map<string, T>();
  const score = (offer: T) => offer.status === 'accepted' ? 4 : offer.taskerConfirmed ? 3 : ['rejected', 'cancelled'].includes(offer.status || '') ? 0 : 1;
  for (const offer of offers) {
    const key = offerTaskId(offer) || offer._id || offer.id;
    if (!key) continue;
    const previous = byTask.get(key);
    if (!previous || score(offer) > score(previous) || (score(offer) === score(previous)
      && Date.parse(offer.updatedAt || offer.createdAt || '') > Date.parse(previous.updatedAt || previous.createdAt || ''))) byTask.set(key, offer);
  }
  return [...byTask.values()];
}
export function taskMilestones(task: TaskStage) {
  const rank = ['open', 'assigned', 'in-progress', 'awaiting-confirmation', 'completed'].indexOf(task.status || '');
  return {
    accepted: rank >= 1,
    secured: rank >= 1 || task.isEscrowHeld === true || ['held', 'release_requested', 'released'].includes(task.escrowStatus || ''),
    started: rank >= 2,
    submitted: rank >= 3,
    completed: rank >= 4,
  };
}

export function confirmHireInData(data: unknown, bidId: string, taskId?: string): unknown {
  if (Array.isArray(data)) return data.map((item) => confirmHireInData(item, bidId, taskId));
  if (!data || typeof data !== 'object') return data;
  const offer = data as OfferStage;
  const result = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, confirmHireInData(value, bidId, taskId)]));
  return offer._id === bidId || offer.id === bidId || (taskId && isHireInvitation(offer) && offerTaskId(offer) === taskId)
    ? { ...result, taskerConfirmed: true } : result;
}
