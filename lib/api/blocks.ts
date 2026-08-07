// Blocking. Either account type can block the other; a block in either
// direction also prevents starting conversations (enforced server-side).

import { api } from './client';

export interface BlockedUser {
  _id: string;
  blockedModel: 'User' | 'Tasker';
  fullName: string;
  emailAddress: string;
  profilePicture: string;
  reason: string;
  createdAt: string;
}

export function getBlockedUsers(signal?: AbortSignal) {
  return api.get<{ status: string; data: BlockedUser[] }>('/api/blocks', { signal });
}

export function blockUser(blockedId: string, reason?: string) {
  return api.post<{ status: string; message: string }>('/api/blocks', { blockedId, reason });
}

/** `id` is the blocked account's id, not a block-record id. */
export function unblockUser(id: string) {
  return api.delete<{ status: string; message: string }>(`/api/blocks/${id}`);
}
