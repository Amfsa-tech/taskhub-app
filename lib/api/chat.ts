// Chat / messaging API bindings for the TaskHub backend.
//
// A conversation is between a task-owner (`user`) and a bidding `tasker`.
// The caller's account type determines which side is "me" vs "the other party".
// Note: sendMessage must be multipart/form-data (text goes in a `text` field).

import type { AccountType } from '@/lib/auth/types';
import type { PickedImage } from '@/lib/image-picker';
import { api } from './client';

export interface ConversationTaskRef {
  _id: string;
  title: string;
  budget: number;
  status: string;
}

export interface ConversationUser {
  fullName?: string | null;
  profilePicture?: string | null;
}

export interface ConversationTasker {
  _id?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
}

export interface Conversation {
  _id: string;
  task?: ConversationTaskRef;
  bid?: string;
  user?: ConversationUser;
  tasker?: ConversationTasker;
  status: 'active' | 'closed' | 'blocked';
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unread?: { user: number; tasker: number };
  participantPresence?: { type: string; isOnline: boolean; lastSeenAt?: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  status: string;
  conversations: Conversation[];
  totalPages: number;
  currentPage: number;
}

export interface MessageAttachment {
  url: string;
  publicId?: string;
  type?: string;
  name?: string;
  size?: number;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  senderType: 'user' | 'tasker' | 'system';
  senderUser?: { _id: string; fullName?: string; profilePicture?: string | null } | string | null;
  senderTasker?: { _id: string; firstName?: string; lastName?: string } | string | null;
  text?: string | null;
  attachments?: MessageAttachment[];
  status?: 'sent' | 'read';
  createdAt: string;
}

export interface MessagesResponse {
  status: string;
  messages: ChatMessage[];
  hasMore: boolean;
  participantPresence?: { type: string; isOnline: boolean; lastSeenAt?: string | null };
}

export interface CreateConversationPayload {
  taskId: string;
  bidId?: string;
  taskerId?: string;
}

export function getConversations(signal?: AbortSignal) {
  return api.get<ConversationsResponse>('/api/chat/conversations', { signal });
}

export function getMessages(
  conversationId: string,
  params: { limit?: number; before?: string } = {},
  signal?: AbortSignal,
) {
  const usp = new URLSearchParams();
  if (params.limit) usp.append('limit', String(params.limit));
  if (params.before) usp.append('before', params.before);
  const qs = usp.toString();
  return api.get<MessagesResponse>(
    `/api/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
    { signal },
  );
}

/**
 * Send a message. Multipart is required by the backend (even for text-only):
 * text goes in the `text` field, image/file uploads under `attachments` (≤5).
 */
export function sendMessage(conversationId: string, text: string, attachments?: PickedImage[]) {
  const form = new FormData();
  if (text) form.append('text', text);
  for (const a of (attachments ?? []).slice(0, 5)) {
    form.append('attachments', { uri: a.uri, name: a.name, type: a.type } as unknown as Blob);
  }
  return api.post<{ status: string; message: ChatMessage }>(
    `/api/chat/conversations/${conversationId}/messages`,
    form,
  );
}

/** Create or fetch the conversation for a task + bid/tasker. */
export function createOrGetConversation(payload: CreateConversationPayload) {
  return api.post<{ status: string; conversation: Conversation }>('/api/chat/conversations', payload);
}

/** Mark a conversation read (clears the caller's unread counter). */
export function markConversationRead(conversationId: string) {
  return api.post<{ status: string }>(`/api/chat/conversations/${conversationId}/read`);
}

export interface ChatNotificationsResponse {
  status: string;
  data: { unreadCount: number; notifications: unknown[] };
}

export function getChatNotifications(signal?: AbortSignal) {
  return api.get<ChatNotificationsResponse>('/api/chat/notifications', { signal });
}

// ---- View helpers ----

/** The other participant's display name + avatar, from the caller's perspective. */
export function otherParty(
  c: Conversation,
  accountType: AccountType | null,
): { name: string; avatar: string } {
  if (accountType === 'tasker') {
    return { name: c.user?.fullName?.trim() || 'User', avatar: c.user?.profilePicture || '' };
  }
  const t = c.tasker;
  const name = [t?.firstName?.trim(), t?.lastName?.trim()].filter(Boolean).join(' ') || 'Tasker';
  return { name, avatar: t?.profilePicture || '' };
}

/** The caller's own unread count for a conversation. */
export function unreadFor(c: Conversation, accountType: AccountType | null): number {
  return (accountType === 'tasker' ? c.unread?.tasker : c.unread?.user) ?? 0;
}

/** True when a message was sent by the caller. */
export function isMine(m: ChatMessage, accountType: AccountType | null): boolean {
  if (m.senderType === 'system') return false;
  return m.senderType === (accountType ?? 'user');
}
