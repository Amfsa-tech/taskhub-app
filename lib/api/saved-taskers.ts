// Saved (bookmarked) taskers.
//
// The backend returns the same tasker shape as the smart-match endpoint, so
// `SavedTasker` just extends `TaskerMatch` with the few extra fields it adds.

import { api } from './client';
import type { TaskerMatch } from './tasks';

export interface SavedTasker extends TaskerMatch {
  isVerified?: boolean;
  previousWork?: { url: string; publicId?: string }[];
  websiteLink?: string;
}

export interface SavedTaskersResponse {
  status: string;
  count: number;
  taskers: SavedTasker[];
}

/** Mutations echo back the new saved count so the profile tile can update. */
export interface SavedTaskerMutationResponse {
  status: string;
  message: string;
  saved: boolean;
  count: number;
}

/** The signed-in user's bookmarked taskers. */
export function getSavedTaskers(signal?: AbortSignal) {
  return api.get<SavedTaskersResponse>('/api/saved-taskers', { signal });
}

/** Bookmark a tasker. Idempotent — saving twice is a no-op. */
export function saveTasker(taskerId: string) {
  return api.post<SavedTaskerMutationResponse>(`/api/saved-taskers/${taskerId}`);
}

/** Remove a bookmark. Idempotent — unsaving an unsaved tasker is a no-op. */
export function unsaveTasker(taskerId: string) {
  return api.delete<SavedTaskerMutationResponse>(`/api/saved-taskers/${taskerId}`);
}

/** `Chioma A.` — matches how taskers are named elsewhere in the app. */
export function savedTaskerName(t: SavedTasker): string {
  const first = t.firstName?.trim() ?? '';
  const lastInitial = t.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}
