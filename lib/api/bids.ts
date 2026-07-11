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
 */
export function acceptBid(bidId: string) {
  return api.post<BidActionResponse>(`/api/bids/${bidId}/accept`);
}
