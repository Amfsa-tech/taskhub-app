// Tasks API bindings + view mappers for the TaskHub backend.
//
// The list endpoints return `{ status, count, totalPages, currentPage, tasks }`.
// `taskToCard` adapts a backend task onto the `TaskCard` view model so screens
// can render real data through the existing design components unchanged.

import type {
  BadgeKind,
  CompletedTask as CompletedTaskModel,
  InProgressTask as InProgressTaskModel,
  Task as TaskCardModel,
} from '@/components/taskhub/task-card';
import type { PickedImage } from '@/lib/image-picker';
import { api } from './client';

export type TaskStatus = 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';

export type TaskEscrowStatus =
  | 'not_held'
  | 'held'
  | 'release_requested'
  | 'released'
  | 'refund_requested'
  | 'refunded';

export interface CategoryRef {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
}

export interface TaskImage {
  url: string;
  publicId: string;
}

export interface TaskLocation {
  latitude: number;
  longitude: number;
  address?: string;
  state?: string;
  country?: string;
}

export interface TaskUserRef {
  _id: string;
  fullName?: string;
  profilePicture?: string;
}

export interface TaskTaskerRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface TaskBidTaskerRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  averageRating?: number;
}

export interface TaskBid {
  _id: string;
  tasker: TaskBidTaskerRef;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  bidType?: 'custom' | 'fixed';
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  mainCategory?: CategoryRef | string | null;
  subCategory?: CategoryRef | string | null;
  budget: number;
  isBiddingEnabled: boolean;
  status: TaskStatus;
  tags?: string[];
  images?: TaskImage[];
  location?: TaskLocation | null;
  deadline?: string | null;
  user?: TaskUserRef | string;
  assignedTasker?: TaskTaskerRef | null;
  rating?: number | null;
  reviewText?: string | null;
  ratedAt?: string | null;
  escrowStatus?: TaskEscrowStatus;
  completedAt?: string | null;
  // Present on `getUserTasks` (per-task bid summary).
  bidCount?: number;
  pendingBidCount?: number;
  // Present on `getTaskById` when the caller owns the task.
  bids?: TaskBid[];
  createdAt: string;
  updatedAt: string;
}

export interface TasksListResponse {
  status: string;
  count: number;
  totalPages: number;
  currentPage: number;
  tasks: Task[];
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
}

function toQuery(params: object): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') usp.append(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/** Tasks posted by the authenticated user. Requires a bearer token. */
export function getUserTasks(params: TaskListParams = {}, signal?: AbortSignal) {
  return api.get<TasksListResponse>(`/api/tasks/user/tasks${toQuery(params)}`, { signal });
}

/** Public list of open tasks. */
export function getTasks(params: TaskListParams = {}, signal?: AbortSignal) {
  return api.get<TasksListResponse>(`/api/tasks${toQuery(params)}`, { signal, auth: false });
}

/** Single task by id. Public, but returns bids when the caller owns the task. */
export function getTaskById(id: string, signal?: AbortSignal) {
  return api.get<{ status: string; task: Task }>(`/api/tasks/${id}`, { signal });
}

export interface TaskerMatch {
  _id: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  averageRating?: number;
  completedJobs?: number;
  primaryCategory?: string | null;
  area?: string | null;
  residentState?: string;
  distance?: number; // kilometres, present only when the task has coordinates
}

export interface TaskMatchesResponse {
  status: string;
  count: number;
  matches: TaskerMatch[];
}

/** Smart-match taskers for a task. Owner-only; requires a bearer token. */
export function getTaskMatches(id: string, signal?: AbortSignal) {
  return api.get<TaskMatchesResponse>(`/api/tasks/${id}/matches`, { signal });
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  mainCategory: string; // a Category id whose parentCategory is null
  categories: string[]; // subcategory Category ids belonging to mainCategory
  budget: number;
  deadline?: string; // ISO date, future
  isBiddingEnabled?: boolean;
  tags?: string[];
  location?: { latitude: number; longitude: number };
  university?: string;
}

/**
 * Create a task. Without images it's a plain JSON body (the backend's
 * `parseField` passes non-strings through); with images it's multipart/form-data
 * (complex fields JSON-stringified, files under the `images` field, ≤5).
 * Location/university fall back to the poster's profile when omitted.
 */
export function createTask(payload: CreateTaskPayload, images?: PickedImage[]) {
  if (!images || images.length === 0) {
    return api.post<{ status: string; message: string; task: Task }>('/api/tasks', payload);
  }

  const form = new FormData();
  form.append('title', payload.title);
  form.append('description', payload.description);
  form.append('mainCategory', payload.mainCategory);
  form.append('categories', JSON.stringify(payload.categories));
  form.append('budget', String(payload.budget));
  if (payload.deadline) form.append('deadline', payload.deadline);
  if (payload.isBiddingEnabled != null) form.append('isBiddingEnabled', String(payload.isBiddingEnabled));
  if (payload.tags) form.append('tags', JSON.stringify(payload.tags));
  if (payload.location) form.append('location', JSON.stringify(payload.location));
  if (payload.university) form.append('university', payload.university);
  for (const img of images.slice(0, 5)) {
    form.append('images', { uri: img.uri, name: img.name, type: img.type } as unknown as Blob);
  }
  return api.post<{ status: string; message: string; task: Task }>('/api/tasks', form);
}

export interface RatePayload {
  rating: number; // 1-5
  reviewText?: string;
}

/** Rate a completed task (once). Owner-only. */
export function rateTask(id: string, payload: RatePayload) {
  return api.post<{ status: string; message: string; data: { task: Task; averageRating: number } }>(
    `/api/tasks/${id}/rate`,
    payload,
  );
}

/**
 * Rate the client on a completed task (once). Assigned-tasker only — the
 * reverse of `rateTask`. There's no tasker UI in this app yet, so this backs a
 * future tasker surface; the reviews it creates surface in the client's
 * "About you" tab via `getReviewsAboutMe`.
 */
export function rateClient(id: string, payload: RatePayload) {
  return api.post<{ status: string; message: string; data: { averageRating: number } }>(
    `/api/tasks/${id}/rate-client`,
    payload,
  );
}

/** A review a tasker left about the signed-in client (the "About you" tab). */
export interface ClientReview {
  _id: string;
  rating: number;
  reviewText: string;
  ratedAt: string | null;
  tasker: TaskTaskerRef | null;
  category: string | null;
}

export interface ReviewsAboutMeResponse {
  status: string;
  count: number;
  reviews: ClientReview[];
}

/** Reviews taskers have left about the signed-in client. */
export function getReviewsAboutMe(signal?: AbortSignal) {
  return api.get<ReviewsAboutMeResponse>('/api/tasks/user/reviews', { signal });
}

/** Change a task's status as the owner (e.g. cancel an open/assigned task). */
export function changeTaskStatus(id: string, status: TaskStatus) {
  return api.patch<{ status: string; message: string; task: Task }>(
    `/api/tasks/${id}/status`,
    { status },
  );
}

// ---- View mappers ----

const NAIRA = '₦';

/** `1000` -> `₦1,000` (manual grouping — avoids Hermes Intl gaps). */
export function formatNaira(amount: number): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${NAIRA}${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO date -> `18 May`. Empty string when absent/invalid. */
export function formatShortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** ISO date -> `May 10, 2026`. Empty string when absent/invalid. */
export function formatLongDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Human label for a task status (e.g. for the detail header badge). */
export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'assigned':
      return 'Assigned';
    case 'in-progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/** Full name of a populated tasker ref, e.g. `Chioma A.` */
function taskerName(t?: TaskTaskerRef | TaskBidTaskerRef | null): string {
  if (!t) return 'Tasker';
  const first = t.firstName?.trim() ?? '';
  const lastInitial = t.lastName?.trim()?.[0];
  return [first, lastInitial ? `${lastInitial}.` : ''].filter(Boolean).join(' ') || 'Tasker';
}

function categoryName(cat?: CategoryRef | string | null): string {
  if (!cat || typeof cat === 'string') return '';
  return (cat.name || cat.displayName || '').toLowerCase();
}

function toBadges(task: Task): BadgeKind[] {
  const name = categoryName(task.mainCategory);
  const badges: BadgeKind[] = [];
  if (name.includes('campus')) badges.push('campus');
  else if (name.includes('errand')) badges.push('errand');
  else badges.push('local');

  // Urgent when the task is tagged so, or when it's due within the next ~48h.
  const hasUrgentTag = (task.tags ?? []).some((t) => t.toLowerCase().includes('urgent'));
  let dueSoon = false;
  if (task.deadline) {
    const due = new Date(task.deadline).getTime();
    const now = Date.now();
    dueSoon = !Number.isNaN(due) && due >= now && due - now <= 48 * 60 * 60 * 1000;
  }
  if (hasUrgentTag || dueSoon) badges.push('urgent');

  return badges;
}

export function locationLabel(task: Task): string {
  const loc = task.location;
  if (!loc) return 'Remote';
  return loc.address || loc.state || 'Nearby';
}

/** Adapt a backend task onto the `TaskCard` view model used across the app. */
export function taskToCard(task: Task): TaskCardModel {
  const bids = task.bidCount ?? 0;
  return {
    badges: toBadges(task),
    price: formatNaira(task.budget),
    title: task.title,
    bids: `${bids} ${bids === 1 ? 'Bid' : 'Bids'}`,
    location: locationLabel(task),
    date: formatShortDate(task.deadline || task.createdAt),
  };
}

/** Adapt a backend task onto the `InProgressTaskCard` view model. */
export function taskToInProgressCard(task: Task): InProgressTaskModel {
  const awaiting = task.escrowStatus === 'release_requested';
  return {
    id: task._id,
    status: awaiting ? 'awaiting_payment' : 'in_progress',
    price: formatNaira(task.budget),
    title: task.title,
    location: locationLabel(task),
    date: formatShortDate(task.deadline || task.createdAt),
  };
}

/**
 * Adapt a backend task onto the `CompletedTaskCard` view model.
 * `rating` reflects the review the user left; `jobs` isn't returned by the
 * list endpoint, so it's left at 0 and the card hides it when absent.
 */
export function taskToCompletedCard(task: Task): CompletedTaskModel {
  const t = task.assignedTasker;
  return {
    id: task._id,
    completedAt: formatLongDate(task.completedAt || task.ratedAt || task.updatedAt),
    price: formatNaira(task.budget),
    title: task.title,
    tasker: {
      name: taskerName(t),
      avatar: t?.profilePicture || '',
      rating: task.rating ?? 0,
      jobs: 0,
    },
    reviewStatus: task.rating != null ? 'reviewed' : 'none',
  };
}

/** Statuses that count as "active" (not finished or cancelled). */
export const ACTIVE_TASK_STATUSES: TaskStatus[] = ['open', 'assigned', 'in-progress'];

export function isActiveTask(task: Task): boolean {
  return ACTIVE_TASK_STATUSES.includes(task.status);
}
