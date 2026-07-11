// Notifications API bindings for the TaskHub backend.
// All routes require auth (user or tasker); chat-type notifications are excluded
// server-side. The list is newest-first, capped at 20.

import { api } from './client';

export interface NotificationMetadata {
  taskId?: string;
  bidId?: string;
  conversationId?: string;
  externalLink?: string;
  action?: string;
}

export interface AppNotification {
  _id: string;
  title?: string;
  message?: string;
  type?: string;
  read: boolean;
  createdAt: string;
  metadata?: NotificationMetadata;
}

export interface NotificationsResponse {
  status: string;
  data: {
    unreadCount: number;
    notifications: AppNotification[];
  };
}

export function getNotifications(signal?: AbortSignal) {
  return api.get<NotificationsResponse>('/api/notifications', { signal });
}

export function markNotificationRead(id: string) {
  return api.patch<{ status: string; message: string }>(`/api/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch<{ status: string; message: string; data: { modifiedCount: number } }>(
    '/api/notifications/read-all',
  );
}

export function deleteNotification(id: string) {
  return api.delete<{ status: string; message: string }>(`/api/notifications/${id}`);
}

/** ISO timestamp -> "2m ago" / "3h ago" / "5d ago". */
export function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
