// Bids / hiring API bindings for the TaskHub backend.

import { api } from './client';

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
