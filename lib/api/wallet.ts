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

/**
 * Purposes the **user** transaction list can be filtered by.
 * The backend validates `?purpose=` against exactly this set
 * (`walletController.getUserTransactions`) and silently ignores anything else —
 * notably `withdrawal`, which is tasker-side only.
 */
export type WalletTransactionPurpose =
  | 'wallet_funding'
  | 'escrow_hold'
  | 'escrow_release'
  | 'escrow_refund'
  | 'platform_fee';

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  /** Wider than `WalletTransactionPurpose` — reads can return `withdrawal`, `refund`, `other`. */
  paymentPurpose?: string;
  createdAt: string;
  previousBalance?: number;
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
  params: { page?: number; limit?: number; purpose?: WalletTransactionPurpose } = {},
  signal?: AbortSignal,
) {
  const usp = new URLSearchParams();
  if (params.page) usp.append('page', String(params.page));
  if (params.limit) usp.append('limit', String(params.limit));
  if (params.purpose) usp.append('purpose', params.purpose);
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

// ---- Payout bank account (TASKER side) ----
//
// Withdrawals are tasker-only at the data-model level: `Withdrawal.tasker`,
// `Tasker.bankAccount`, and every controller resolves `Tasker.findById(...)`.
// A client account calling these gets a 404 ("Tasker not found") or a 400 — not
// a 401 — because the whole wallet router is `protectAny`. There is no
// user-side bank account anywhere in the backend.

export interface Bank {
  name: string;
  code: string;
}

export interface BanksResponse {
  status: string;
  data: Bank[];
}

/** Bank list from the active payment gateway (Flutterwave or Paystack). */
export function getBanks(signal?: AbortSignal) {
  return api.get<BanksResponse>('/api/wallet/banks', { signal });
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

/** `data` is `null` when no account has been saved yet. */
export interface BankAccountResponse {
  status: string;
  data: BankAccount | null;
}

/**
 * The tasker's saved payout account. **Exactly one** — `Tasker.bankAccount` is a
 * single embedded object, so saving again replaces it. There is no delete
 * endpoint.
 */
export function getTaskerBankAccount(signal?: AbortSignal) {
  return api.get<BankAccountResponse>('/api/wallet/tasker/bank-account', { signal });
}

export interface SetBankAccountPayload {
  /** Exactly 10 digits — the backend rejects anything else. */
  accountNumber: string;
  /** `code` from `getBanks`, not the display name. */
  bankCode: string;
}

export interface SetBankAccountResponse {
  status: string;
  message: string;
  data: BankAccount;
}

/**
 * Save (or replace) the payout account.
 *
 * The account **name is not supplied by the client** — the backend resolves it
 * with the payment gateway from the number + bank code, which is also how the
 * details get validated. A wrong number surfaces as a 400 ("Could not verify
 * bank account details") rather than saving something unverified.
 */
export function setTaskerBankAccount(payload: SetBankAccountPayload) {
  return api.post<SetBankAccountResponse>('/api/wallet/tasker/bank-account', payload);
}

// ---- Withdrawals (TASKER side) ----
//
// No screen calls these yet — there is no withdrawal UI. They're bound so the
// contracts are recorded in one place when that screen gets built.

export type PayoutMethod = 'bank_transfer' | 'stellar_crypto';

export interface WithdrawalPayload {
  /** Naira. Minimum ₦500, and cannot exceed the tasker's wallet balance. */
  amount: number;
  /** Defaults to `bank_transfer` server-side. */
  payoutMethod?: PayoutMethod;
  /** Required when `payoutMethod` is `stellar_crypto`. */
  stellarAddress?: string;
}

export interface WithdrawalResponse {
  status: string;
  message: string;
  data: {
    withdrawalId: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bankDetails?: BankAccount;
  };
}

/**
 * Request a payout. Debits the wallet immediately and creates a **pending**
 * withdrawal for an admin to approve — money does not move until then.
 *
 * Rejections to expect: under ₦500, more than the balance, an existing
 * pending/approved withdrawal (only one at a time), or `bank_transfer` with no
 * saved bank account.
 *
 * ⚠️ Note: this endpoint does **not** verify the transaction PIN — see
 * `setupTransactionPin`. A bearer token alone authorizes a payout request.
 */
export function requestWithdrawal(payload: WithdrawalPayload) {
  return api.post<WithdrawalResponse>('/api/wallet/withdraw', payload);
}

export interface SetupPinPayload {
  /** Exactly 4 digits. */
  pin: string;
  /** The account password — re-authentication for setting the PIN. */
  password: string;
}

/**
 * Set the tasker's 4-digit transaction PIN.
 *
 * ⚠️ The stored PIN is currently **never checked by anything**: `transactionPin`
 * is written here and read nowhere in the backend, and `requestWithdrawal` does
 * not ask for it — despite this endpoint's success message implying it gates
 * withdrawals. Treat the PIN as non-functional until the backend enforces it.
 */
export function setupTransactionPin(payload: SetupPinPayload) {
  return api.post<{ status: string; message: string }>('/api/wallet/tasker/pin/setup', payload);
}

export interface StellarDepositInfoResponse {
  status: string;
  data: unknown;
}

/** XLM deposit address for the non-custodial funding bridge. No screen shows this. */
export function getStellarDepositInfo(signal?: AbortSignal) {
  return api.get<StellarDepositInfoResponse>('/api/wallet/stellar/deposit-info', { signal });
}

// ---- View mappers ----

const TX_COLORS = {
  success: '#12b76a',
  warning: '#d97706',
  error: '#ef4444',
  info: '#2563eb',
};

/**
 * Row status pill. Reads `status` first (a failed/pending transaction is that,
 * whatever it was for), then falls back to the escrow purpose so a held vs
 * released vs refunded escrow reads differently on the row.
 */
export function transactionStatus(tx: WalletTransaction): { label: string; color: string } {
  if (tx.status === 'failed') return { label: 'Failed', color: TX_COLORS.error };
  if (tx.status === 'pending') return { label: 'Pending', color: TX_COLORS.warning };

  switch (tx.paymentPurpose) {
    case 'escrow_hold':
      return { label: 'In Escrow', color: TX_COLORS.info };
    case 'escrow_release':
      return { label: 'Released', color: TX_COLORS.success };
    case 'escrow_refund':
    case 'refund':
      return { label: 'Refunded', color: TX_COLORS.success };
    case 'withdrawal':
      return { label: 'Withdrawn', color: TX_COLORS.success };
    default:
      return { label: 'Success', color: TX_COLORS.success };
  }
}

/** Ionicons glyph + colours for the row's leading icon box. */
export function transactionIcon(tx: WalletTransaction): {
  name: 'close-outline' | 'arrow-down-outline' | 'arrow-up-outline' | 'wallet-outline';
  color: string;
  bg: string;
} {
  if (tx.status === 'failed') {
    return { name: 'close-outline', color: TX_COLORS.error, bg: '#fff1f1' };
  }
  if (tx.paymentPurpose === 'escrow_hold') {
    return { name: 'wallet-outline', color: TX_COLORS.warning, bg: '#fffbeb' };
  }
  if (tx.type === 'credit') {
    return { name: 'arrow-down-outline', color: TX_COLORS.success, bg: '#edfaf3' };
  }
  return { name: 'arrow-up-outline', color: TX_COLORS.warning, bg: '#fffbeb' };
}

const PURPOSE_LABELS: Record<string, string> = {
  wallet_funding: 'Wallet funded',
  escrow_hold: 'Escrow hold',
  escrow_release: 'Escrow released',
  escrow_refund: 'Refund',
  refund: 'Refund',
  platform_fee: 'Platform fee',
  withdrawal: 'Withdrawal',
};

/** The backend always sets `description`; the purpose label is the fallback. */
export function transactionTitle(tx: WalletTransaction): string {
  return tx.description || PURPOSE_LABELS[tx.paymentPurpose ?? ''] || 'Transaction';
}
