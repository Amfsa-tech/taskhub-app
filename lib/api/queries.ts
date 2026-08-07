// React Query hooks + query keys for the TaskHub API.

import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';

import { getCategories } from './categories';
import { getChatNotifications, getConversations, getMessages } from './chat';
import { getNotifications } from './notifications';
import { getBlockedUsers } from './blocks';
import { getSavedTaskers } from './saved-taskers';
import { getKycStatus } from './kyc';
import { getUniversities } from './universities';
import { getVerificationStatus } from '@/lib/auth/auth-api';
import {
  getBanks,
  getTaskerBalance,
  getTaskerBankAccount,
  getTaskerTransactions,
  getWalletBalance,
  getWalletTransactions,
  type WalletTransactionPurpose,
} from './wallet';
import { getBidPaymentSummary, getTaskerBids, type BidStatus } from './bids';
import {
  getCompletionCode,
  getNearbyTaskers,
  getReviewsAboutMe,
  getTaskById,
  getTaskerById,
  getTaskerReviews,
  getTaskMatches,
  getTasks,
  getTaskerFeed,
  getTaskerTasks,
  getUserTasks,
  type Task,
  type TaskListParams,
  type TaskStatus,
} from './tasks';

export const queryKeys = {
  userTasks: (params?: TaskListParams) => ['tasks', 'user', params ?? {}] as const,
  tasks: (params?: TaskListParams) => ['tasks', 'all', params ?? {}] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  taskMatches: (id: string) => ['tasks', 'matches', id] as const,
  nearbyTaskers: () => ['taskers', 'nearby'] as const,
  tasker: (id: string) => ['taskers', 'detail', id] as const,
  taskerReviews: (id: string) => ['taskers', 'reviews', id] as const,
  reviewsAboutMe: () => ['reviews', 'about-me'] as const,
  categories: () => ['categories'] as const,
  savedTaskers: () => ['saved-taskers'] as const,
  blockedUsers: () => ['blocked-users'] as const,
  notifications: () => ['notifications'] as const,
  conversations: () => ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  chatUnread: () => ['chat', 'unread'] as const,
  walletBalance: () => ['wallet', 'balance'] as const,
  walletTransactions: () => ['wallet', 'transactions'] as const,
  walletTransactionsPaged: (purpose?: WalletTransactionPurpose) =>
    ['wallet', 'transactions', 'paged', purpose ?? 'all'] as const,
  universities: () => ['universities'] as const,
  verificationStatus: () => ['verification-status'] as const,
  kycStatus: () => ['kyc', 'status'] as const,
  banks: () => ['wallet', 'banks'] as const,
  taskerBankAccount: () => ['wallet', 'tasker', 'bank-account'] as const,
  paymentSummary: (bidId: string) => ['bids', 'payment-summary', bidId] as const,
  completionCode: (taskId: string) => ['tasks', 'completion-code', taskId] as const,
  // Tasker side
  taskerFeed: () => ['tasks', 'tasker', 'feed'] as const,
  taskerTasks: (status?: TaskStatus) => ['tasks', 'tasker', 'assigned', status ?? 'all'] as const,
  taskerBids: (status?: BidStatus) => ['bids', 'tasker', status ?? 'all'] as const,
  taskerBalance: () => ['wallet', 'tasker', 'balance'] as const,
  taskerTransactions: () => ['wallet', 'tasker', 'transactions'] as const,
};

/** Tasks posted by the signed-in user. */
export function useUserTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: queryKeys.userTasks(params),
    queryFn: ({ signal }) => getUserTasks(params, signal),
  });
}

/**
 * User tasks across several statuses (e.g. the "In progress" tab spans
 * `assigned` + `in-progress`). Runs one query per status and merges the
 * first page of each. Returns combined loading/error flags.
 */
export function useUserTasksByStatuses(statuses: TaskStatus[]) {
  const results = useQueries({
    queries: statuses.map((status) => ({
      queryKey: queryKeys.userTasks({ status }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getUserTasks({ status }, signal),
    })),
  });

  const tasks: Task[] = results.flatMap((r) => r.data?.tasks ?? []);
  return {
    tasks,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    isRefetching: results.some((r) => r.isRefetching),
    refetch: () => results.forEach((r) => r.refetch()),
  };
}

/** Public list of open tasks. */
export function useTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: ({ signal }) => getTasks(params, signal),
  });
}

/** Single task detail (includes bids when the caller owns the task). */
export function useTask(id?: string) {
  return useQuery({
    queryKey: queryKeys.task(id ?? ''),
    queryFn: ({ signal }) => getTaskById(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Smart-match taskers for a task (owner-only). */
export function useTaskMatches(id?: string) {
  return useQuery({
    queryKey: queryKeys.taskMatches(id ?? ''),
    queryFn: ({ signal }) => getTaskMatches(id as string, signal),
    enabled: Boolean(id),
  });
}

/** A single tasker's public profile. */
export function useTasker(id?: string) {
  return useQuery({
    queryKey: queryKeys.tasker(id ?? ''),
    queryFn: ({ signal }) => getTaskerById(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Reviews clients left about a tasker. */
export function useTaskerReviews(id?: string) {
  return useQuery({
    queryKey: queryKeys.taskerReviews(id ?? ''),
    queryFn: ({ signal }) => getTaskerReviews(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Top taskers near the user (falls back to top-rated). Backs the home carousel. */
export function useNearbyTaskers() {
  return useQuery({
    queryKey: queryKeys.nearbyTaskers(),
    queryFn: ({ signal }) => getNearbyTaskers(undefined, signal),
    staleTime: 5 * 60 * 1000,
  });
}

/** Reviews taskers have left about the signed-in client (the "About you" tab). */
export function useReviewsAboutMe() {
  return useQuery({
    queryKey: queryKeys.reviewsAboutMe(),
    queryFn: ({ signal }) => getReviewsAboutMe(signal),
  });
}

/**
 * Cost breakdown for accepting a bid. Never cached across mounts: it embeds the
 * live wallet balance, and a stale `sufficientBalance` would show the user a
 * "Pay" button the backend then rejects.
 */
export function usePaymentSummary(bidId?: string) {
  return useQuery({
    queryKey: queryKeys.paymentSummary(bidId ?? ''),
    queryFn: ({ signal }) => getBidPaymentSummary(bidId as string, signal),
    enabled: Boolean(bidId),
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * The completion code for an in-progress task. The backend 400s for any other
 * status, so this only runs once the task is actually in progress.
 */
export function useCompletionCode(taskId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.completionCode(taskId ?? ''),
    queryFn: ({ signal }) => getCompletionCode(taskId as string, signal),
    enabled: Boolean(taskId) && enabled,
    retry: false,
  });
}

/** Every active university. Public, unpaginated, and effectively static. */
export function useUniversities() {
  return useQuery({
    queryKey: queryKeys.universities(),
    queryFn: ({ signal }) => getUniversities(signal),
    staleTime: 30 * 60 * 1000,
  });
}

/** KYC state for the signed-in account (one flag covers face + NIN). */
export function useVerificationStatus() {
  return useQuery({
    queryKey: queryKeys.verificationStatus(),
    queryFn: ({ signal }) => getVerificationStatus(signal),
    staleTime: 60 * 1000,
  });
}

/**
 * Detail of the latest Didit KYC record — rejection reasons, masked NIN.
 * Not a verification source of truth (it ignores QoreID records); pair it with
 * `useVerificationStatus`, which reads the account flag.
 */
export function useKycStatus() {
  return useQuery({
    queryKey: queryKeys.kycStatus(),
    queryFn: ({ signal }) => getKycStatus(signal),
    staleTime: 30 * 1000,
  });
}

/** Bank list from the payment gateway. Effectively static within a session. */
export function useBanks(enabled = true) {
  return useQuery({
    queryKey: queryKeys.banks(),
    queryFn: ({ signal }) => getBanks(signal),
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * The signed-in tasker's payout account (`null` when unset).
 * Tasker-only — pass `enabled: false` for client accounts, which get a 404.
 */
export function useTaskerBankAccount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskerBankAccount(),
    queryFn: ({ signal }) => getTaskerBankAccount(signal),
    enabled,
    retry: false,
  });
}

/** All categories (main + sub). Cached longer — they rarely change. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * The user's bookmarked taskers. Backs both the Saved Taskers screen and the
 * "Saved" tile on the profile, so it stays live across save/unsave mutations.
 */
export function useSavedTaskers() {
  return useQuery({
    queryKey: queryKeys.savedTaskers(),
    queryFn: ({ signal }) => getSavedTaskers(signal),
  });
}

/** Accounts the signed-in user has blocked. */
export function useBlockedUsers() {
  return useQuery({
    queryKey: queryKeys.blockedUsers(),
    queryFn: ({ signal }) => getBlockedUsers(signal),
  });
}

/** The signed-in account's notifications (+ unread count). */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ signal }) => getNotifications(signal),
  });
}

/** Conversation inbox. Polls lightly so the list stays fresh. */
export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: ({ signal }) => getConversations(signal),
    refetchInterval: 10_000,
  });
}

/** Messages in a conversation. Polls while the thread is open (near real-time). */
export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId ?? ''),
    queryFn: ({ signal }) => getMessages(conversationId as string, { limit: 50 }, signal),
    enabled: Boolean(conversationId),
    refetchInterval: 5_000,
  });
}

/** Total unread messages across conversations — drives the Messages tab badge. */
export function useChatUnreadCount(): number {
  const { data } = useQuery({
    queryKey: queryKeys.chatUnread(),
    queryFn: ({ signal }) => getChatNotifications(signal),
    refetchInterval: 15_000,
  });
  return data?.data?.unreadCount ?? 0;
}

/** The user's wallet balance (+ escrow). */
export function useWalletBalance(enabled = true) {
  return useQuery({
    queryKey: queryKeys.walletBalance(),
    queryFn: ({ signal }) => getWalletBalance(signal),
    enabled,
  });
}

/** The user's wallet transaction history. First page only — backs the wallet screen. */
export function useWalletTransactions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.walletTransactions(),
    queryFn: ({ signal }) => getWalletTransactions({ limit: 20 }, signal),
    enabled,
  });
}

/**
 * Paged transaction history for the dedicated history screen.
 *
 * `purpose` is applied **server-side**, so filtering stays correct across pages
 * — which client-side filtering of a single page would not be. The backend has
 * no `status` filter, so there's deliberately no "Failed"-only view here; the
 * per-row status pill carries that instead.
 */
export function useWalletTransactionsPaged(
  purpose?: WalletTransactionPurpose,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.walletTransactionsPaged(purpose),
    queryFn: ({ pageParam, signal }) =>
      getWalletTransactions({ page: pageParam, limit: 20, purpose }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.currentPage < last.totalPages ? last.currentPage + 1 : undefined,
    enabled,
  });
}

/* ------------------------------------------------------------------ *
 * Tasker side
 *
 * Every hook below hits a `protectTasker` route and 401s for a user token, so
 * each takes an `enabled` flag rather than guessing — callers pass
 * `accountType === 'tasker'`.
 * ------------------------------------------------------------------ */

/**
 * Open tasks matching the tasker's categories, paged by cursor.
 *
 * `hasNextPage` comes from the server rather than being inferred from page
 * length: distance filtering happens after the DB query, so a short page does
 * not mean the feed is exhausted.
 */
export function useTaskerFeed(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.taskerFeed(),
    queryFn: ({ pageParam, signal }) =>
      getTaskerFeed({ limit: 10, cursor: pageParam as string | undefined }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? (last.pagination.nextCursor ?? undefined) : undefined,
    enabled,
  });
}

/** Tasks assigned to the signed-in tasker, optionally filtered to one status. */
export function useTaskerTasks(status?: TaskStatus, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskerTasks(status),
    queryFn: ({ signal }) => getTaskerTasks({ status, limit: 50 }, signal),
    enabled,
  });
}

/** The tasker's own bids — covers both "bids sent" and incoming hire requests. */
export function useTaskerBids(status?: BidStatus, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskerBids(status),
    queryFn: ({ signal }) => getTaskerBids({ status, limit: 50 }, signal),
    enabled,
  });
}

/** Tasker wallet balance. Separate endpoint and shape from the user's. */
export function useTaskerBalance(enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskerBalance(),
    queryFn: ({ signal }) => getTaskerBalance(signal),
    enabled,
  });
}

/** Tasker earnings history. No purpose filter exists on this side. */
export function useTaskerTransactions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskerTransactions(),
    queryFn: ({ signal }) => getTaskerTransactions({ limit: 50 }, signal),
    enabled,
  });
}

/**
 * Paged tasker earnings for the history screen. The tasker endpoint has no
 * `?purpose=` filter, so there is deliberately no filter parameter here — the
 * screen hides the filter control for taskers rather than offering one that
 * the server would ignore.
 */
export function useTaskerTransactionsPaged(enabled = true) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.taskerTransactions(), 'paged'],
    queryFn: ({ pageParam, signal }) =>
      getTaskerTransactions({ page: pageParam, limit: 20 }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.currentPage < last.totalPages ? last.currentPage + 1 : undefined,
    enabled,
  });
}
