// Wallet API bindings for the TaskHub backend (USER side).
// All amounts are in NAIRA. Funding uses a hosted Paystack/Flutterwave checkout:
// initialize → open authorizationUrl in a browser → verify by reference
// (a gateway webhook also credits the wallet automatically).

import { api } from './client';

export interface WalletBalance {
  walletBalance: number;
  totalInEscrow: number;
  availableBalance: number;
}

export interface BalanceResponse {
  status: string;
  data: WalletBalance;
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  paymentPurpose?: string;
  createdAt: string;
  balanceAfter?: number;
}

export interface TransactionsResponse {
  status: string;
  results: number;
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  transactions: WalletTransaction[];
}

export interface InitFundingResponse {
  status: string;
  message: string;
  data: { authorizationUrl: string; reference: string; provider: string };
}

export interface VerifyFundingResponse {
  status: string;
  message: string;
  data: { reference: string; transactionStatus: 'success' | 'pending' | 'failed'; amount: number };
}

export function getWalletBalance(signal?: AbortSignal) {
  return api.get<BalanceResponse>('/api/wallet/user/balance', { signal });
}

export function getWalletTransactions(
  params: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
) {
  const usp = new URLSearchParams();
  if (params.page) usp.append('page', String(params.page));
  if (params.limit) usp.append('limit', String(params.limit));
  const qs = usp.toString();
  return api.get<TransactionsResponse>(
    `/api/wallet/user/transactions${qs ? `?${qs}` : ''}`,
    { signal },
  );
}

/** Start funding. Amount in naira (min ₦100). Returns the checkout URL + reference. */
export function initializeFunding(amount: number) {
  return api.post<InitFundingResponse>('/api/wallet/fund/initialize', { amount });
}

/** Confirm a funding payment by its reference (also credited async by webhook). */
export function verifyFunding(reference: string) {
  return api.get<VerifyFundingResponse>(
    `/api/wallet/fund/verify?reference=${encodeURIComponent(reference)}`,
  );
}
