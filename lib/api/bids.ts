// Bids / hiring API bindings for the TaskHub backend.
//
// Two halves, split by who is authenticated:
//   • USER  — invite, hire-request, payment-summary, accept
//   • TASKER — create/update/delete a bid, list own bids, respond to a hire
//     request. Every tasker path is `protectTasker` and 401s for a user token.

import { api } from './client';
import type { Task } from './tasks';

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
export function inviteTasker(payload: InvitePayload) {
  return api.post<BidActionResponse>('/api/bids/invite', payload);
}

/** Send a direct hire request (offer) to a tasker. */
export function sendHireRequest(payload: HireRequestPayload) {
  return api.post<BidActionResponse>('/api/bids/hire-request', payload);
}

/**
 * Accept an existing bid. Assigns the task and holds the bid amount (+10% fee)
 * in escrow from the user's wallet — returns 402 when the balance is too low.
 *
 * This single call *is* the hire: there is no separate "send agreement" or
 * "pay" step on the backend. Accept = pay = assign, atomically.
 */
export function acceptBid(bidId: string) {
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
  /** `taskAmount + platformFee` — the whole sum is held in escrow. */
  total: number;
  currency: string;
  walletBalance: number;
  sufficientBalance: boolean;
}

export interface PaymentSummaryResponse {
  status: string;
  summary: PaymentSummary;
}

/** Owner-only cost breakdown for a bid, used before accepting it. */
export function getBidPaymentSummary(bidId: string, signal?: AbortSignal) {
  return api.get<PaymentSummaryResponse>(`/api/bids/${bidId}/payment-summary`, { signal });
}

/* ------------------------------------------------------------------ *
 * Tasker side — `protectTasker`
 * ------------------------------------------------------------------ */

export type BidStatus = 'pending' | 'accepted' | 'rejected';

/** A bid as returned by `GET /api/bids/tasker/bids` (task is partially populated). */
export interface TaskerBid {
  _id: string;
  task: Pick<Task, '_id' | 'title' | 'description' | 'budget' | 'status' | 'createdAt'> | null;
  amount: number;
  message?: string;
  status: BidStatus;
  bidType?: 'custom' | 'fixed';
  /** True when the client initiated this as a hire request rather than the tasker bidding. */
  invitedByUser?: boolean;
  /** Set once the tasker accepts a hire request; the client still has to pay. */
  taskerConfirmed?: boolean;
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
export function createBid(payload: CreateBidPayload) {
  return api.post<BidActionResponse>('/api/bids', payload);
}

/** Revise an existing pending bid. Only `amount` and `message` are editable. */
export function updateBid(bidId: string, payload: { amount?: number; message?: string }) {
  return api.put<BidActionResponse>(`/api/bids/${bidId}`, payload);
}

/** Withdraw a bid entirely. */
export function deleteBid(bidId: string) {
  return api.delete<BidActionResponse>(`/api/bids/${bidId}`);
}

/** The signed-in tasker's own bids, newest first. */
export function getTaskerBids(
  params: { page?: number; limit?: number; status?: BidStatus } = {},
  signal?: AbortSignal,
) {
  const usp = new URLSearchParams();
  if (params.page) usp.append('page', String(params.page));
  if (params.limit) usp.append('limit', String(params.limit));
  if (params.status) usp.append('status', params.status);
  const qs = usp.toString();
  return api.get<TaskerBidsResponse>(`/api/bids/tasker/bids${qs ? `?${qs}` : ''}`, { signal });
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
export function respondToHireRequest(bidId: string, action: 'accept' | 'decline') {
  return api.post<BidActionResponse>(`/api/bids/${bidId}/hire-response`, { action });
}
