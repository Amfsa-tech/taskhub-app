import { uniqueTaskerOffers } from '@/lib/task-lifecycle';
// Bids / hiring API bindings for the TaskHub backend.
//
// Two halves, split by who is authenticated:
//   • USER  — invite, hire-request, payment-summary, accept
//   • TASKER — create/update/delete a bid, list own bids, respond to a hire
//     request. Every tasker path is `protectTasker` and 401s for a user token.

import { api } from './client';
import { getTaskById, type Task } from './tasks';
import { requireAvailableTask, taskIsAvailable, canSelectOffer, requireSelectableOffer } from '@/lib/task-deadline';

async function mapPendingTasks<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = [];
  for (let index = 0; index < items.length; index += 4) {
    result.push(...await Promise.all(items.slice(index, index + 4).map(mapper)));
  }
  return result;
}
async function checkTask(taskId: string) { requireAvailableTask((await getTaskById(taskId)).task); }
async function checkBid(bidId: string) {
  const { bid } = await api.get<{ bid: { task: string | { _id: string } } }>(`/api/bids/${bidId}`);
  await checkTask(typeof bid.task === 'string' ? bid.task : bid.task._id);
}


export interface InvitePayload {
  taskId: string;
  taskerId: string;
}

export interface HireRequestPayload {
  taskId: string;
  taskerId: string;
  amount?: number;
  message?: string;
}

export interface BidActionResponse {
  status: string;
  message?: string;
  bid?: {
    _id: string;
    status: string;
    amount?: number;
    [key: string]: unknown;
  };
}

/** Invite a chosen tasker to bid on a task (also opens a conversation). */
export async function inviteTasker(payload: InvitePayload) {
  await checkTask(payload.taskId);
  return api.post<BidActionResponse>('/api/bids/invite', payload);
}

/** Send a direct hire request (offer) to a tasker. */
export async function sendHireRequest(payload: HireRequestPayload) {
  await checkTask(payload.taskId);
  return api.post<BidActionResponse>('/api/bids/hire-request', payload);
}

/**
 * Assign the task using existing escrow. Only an amount above the held balance
 * is charged to the wallet; a lower accepted amount refunds the difference.
 *
 * This single call *is* the hire: there is no separate "send agreement" or
 * "pay" step on the backend. Accept = pay = assign, atomically.
 */
export async function acceptBid(bidId: string) {
  const { bid } = await api.get<{ bid: { task: string | { _id: string } } }>(`/api/bids/${bidId}`);
  requireSelectableOffer((await getTaskById(typeof bid.task === 'string' ? bid.task : bid.task._id)).task);
  return api.post<BidActionResponse>(`/api/bids/${bidId}/accept`);
}

export interface PaymentSummaryTasker {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  averageRating?: number;
}

/**
 * What accepting a bid will cost. Computed server-side, so the fee shown to the
 * user is the fee actually charged — the client must not re-derive it.
 */
export interface PaymentSummary {
  taskId: string;
  bidId: string;
  taskTitle: string;
  tasker: PaymentSummaryTasker | null;
  taskAmount: number;
  platformFee: number;
  /** e.g. `0.1` for 10%. */
  feeRate: number;
  /** Total task cost; the platform fee is deducted from the tasker payout. */
  total: number;
  taskerReceives: number;
  alreadyHeld: number;
  additionalCharge: number;
  refundDue: number;
  canConfirm: boolean;
  blockingReason: string | null;
  currency: string;
  walletBalance: number;
  sufficientBalance: boolean;
}

export interface PaymentSummaryResponse {
  status: string;
  summary: PaymentSummary;
}

/** Owner-only cost breakdown for a bid, used before accepting it. */
export async function getBidPaymentSummary(bidId: string, signal?: AbortSignal) {
  const result = await api.get<PaymentSummaryResponse>(`/api/bids/${bidId}/payment-summary`, { signal });
  const { task } = await getTaskById(result.summary.taskId, signal);
  if (!canSelectOffer(task)) result.summary = { ...result.summary, canConfirm: false, blockingReason: 'This task is closed. Reopen it before hiring.' };
  return result;
}

/* ------------------------------------------------------------------ *
 * Tasker side — `protectTasker`
 * ------------------------------------------------------------------ */

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

/** A bid as returned by `GET /api/bids/tasker/bids` (task is partially populated). */
export interface TaskerBid {
  _id: string;
  task: Pick<Task, '_id' | 'title' | 'description' | 'budget' | 'status' | 'createdAt' | 'deadline' | 'mainCategory' | 'subCategory' | 'biddingClosed' | 'bidSelectionEndsAt'> | null;
  amount: number;
  message?: string;
  status: BidStatus;
  bidType?: 'custom' | 'fixed' | 'invitation' | 'invite';
  /** True when the client initiated this as a hire request rather than the tasker bidding. */
  invitedByUser?: boolean;
  /** Set once the tasker accepts a hire request; the client still has to pay. */
  taskerConfirmed?: boolean;
  closedReason?: string;
  createdAt: string;
}

export interface TaskerBidsResponse {
  status: string;
  count: number;
  totalPages: number;
  currentPage: number;
  bids: TaskerBid[];
}

export interface CreateBidPayload {
  taskId: string;
  /**
   * Required only when the task has `isBiddingEnabled`. For fixed-price tasks
   * the backend ignores whatever is sent and uses `task.budget`, so don't
   * collect a price for those — see `applicationInfo.priceEditable` on the feed.
   */
  amount?: number;
  message?: string;
}

/**
 * Place a bid / apply for a task.
 *
 * 400s on a second attempt ("You have already applied for this task") — there's
 * a unique index behind it, so treat duplicates as an update, not a retry.
 */
export async function createBid(payload: CreateBidPayload) {
  await checkTask(payload.taskId);
  return api.post<BidActionResponse>('/api/bids', payload);
}

/** Revise an existing pending bid. Only `amount` and `message` are editable. */
export async function updateBid(bidId: string, payload: { amount?: number; message?: string }) {
  await checkBid(bidId);
  return api.put<BidActionResponse>(`/api/bids/${bidId}`, payload);
}

/** Withdraw a bid entirely. */
export async function deleteBid(bidId: string) {
  await checkBid(bidId);
  return api.delete<BidActionResponse>(`/api/bids/${bidId}`);
}

/** The signed-in tasker's own bids, newest first. */
export async function getTaskerBids(
  params: { page?: number; limit?: number; status?: BidStatus } = {},
  signal?: AbortSignal,
) {
  const usp = new URLSearchParams();
  if (params.page) usp.append('page', String(params.page));
  if (params.limit) usp.append('limit', String(params.limit));
  if (params.status) usp.append('status', params.status);
  const qs = usp.toString();
  const result = await api.get<TaskerBidsResponse>(`/api/bids/tasker/bids${qs ? `?${qs}` : ''}`, { signal });
  if (!params.page) {
    for (let page = 2; page <= (result.totalPages || 1); page++) {
      const query = new URLSearchParams(usp); query.set('page', String(page));
      const next = await api.get<TaskerBidsResponse>(`/api/bids/tasker/bids?${query}`, { signal });
      result.bids.push(...next.bids);
    }
  }
  const bids = await mapPendingTasks(uniqueTaskerOffers(result.bids), async (bid) => {
    if (bid.status !== 'pending' && (params.status || bid.task?.mainCategory)) return bid;
    if (!bid.task?._id) return null;
    try {
      const { task } = await getTaskById(bid.task._id, signal);
      return !params.status || canSelectOffer(task) ? { ...bid, task } : null;
    } catch { return !params.status ? bid : null; }
  });
  return { ...result, bids: uniqueTaskerOffers(bids.filter((bid): bid is TaskerBid => bid !== null)) };

}

/**
 * Accept or decline a client's hire request.
 *
 * ⚠️ Accepting does **not** assign the task. It sets `taskerConfirmed` and posts
 * a system message telling the client to pay; the task is only assigned when
 * they call `POST /api/bids/:id/accept`. Don't tell the tasker they've got the
 * job — they've agreed to it.
 *
 * Only valid on a bid with `invitedByUser`, still `pending`, on an `open` task.
 */
export async function respondToHireRequest(bidId: string, action: 'accept' | 'decline') {
  await checkBid(bidId);
  return api.post<BidActionResponse>(`/api/bids/${bidId}/hire-response`, { action });
}
