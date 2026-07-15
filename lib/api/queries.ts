// React Query hooks + query keys for the TaskHub API.

import { useQueries, useQuery } from '@tanstack/react-query';

import { getCategories } from './categories';
import { getChatNotifications, getConversations, getMessages } from './chat';
import { getNotifications } from './notifications';
import { getSavedTaskers } from './saved-taskers';
import { getWalletBalance, getWalletTransactions } from './wallet';
import {
  getReviewsAboutMe,
  getTaskById,
  getTaskMatches,
  getTasks,
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
  reviewsAboutMe: () => ['reviews', 'about-me'] as const,
  categories: () => ['categories'] as const,
  savedTaskers: () => ['saved-taskers'] as const,
  notifications: () => ['notifications'] as const,
  conversations: () => ['chat', 'conversations'] as const,
  messages: (id: string) => ['chat', 'messages', id] as const,
  chatUnread: () => ['chat', 'unread'] as const,
  walletBalance: () => ['wallet', 'balance'] as const,
  walletTransactions: () => ['wallet', 'transactions'] as const,
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

/** Reviews taskers have left about the signed-in client (the "About you" tab). */
export function useReviewsAboutMe() {
  return useQuery({
    queryKey: queryKeys.reviewsAboutMe(),
    queryFn: ({ signal }) => getReviewsAboutMe(signal),
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
export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.walletBalance(),
    queryFn: ({ signal }) => getWalletBalance(signal),
  });
}

/** The user's wallet transaction history. */
export function useWalletTransactions() {
  return useQuery({
    queryKey: queryKeys.walletTransactions(),
    queryFn: ({ signal }) => getWalletTransactions({ limit: 20 }, signal),
  });
}
