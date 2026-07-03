// Thin typed fetch wrapper around the TaskHub backend.
//
// Responsibilities:
//   - Prefix relative paths with the configured base URL.
//   - JSON encode bodies and set headers.
//   - Inject the bearer token (set by the auth layer via `setApiToken`).
//   - Normalize all failures into a single `ApiError` carrying the backend's
//     `{ status, message }` payload so screens can show real messages.

import { API_BASE_URL } from '@/lib/config';
import type { ApiErrorBody } from './types';

// Module-level token, kept in sync by the auth layer. Requests with
// `auth: true` (the default) attach it automatically.
let authToken: string | null = null;

export function setApiToken(token: string | null): void {
  authToken = token;
}

export function getApiToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  /** HTTP status code, or 0 for network/transport failures. */
  readonly status: number;
  /** Parsed response body, when available. */
  readonly body?: ApiErrorBody | unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** Field names the backend flagged as missing (register/create-task flows). */
  get missingFields(): string[] | undefined {
    const body = this.body as ApiErrorBody | undefined;
    return body && typeof body === 'object' ? body.missingFields : undefined;
  }

  /** True when the backend rejected the request because email isn't verified. */
  get emailVerificationRequired(): boolean {
    const body = this.body as ApiErrorBody | undefined;
    return Boolean(body && typeof body === 'object' && body.emailVerificationRequired);
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  /** JSON-serializable request body. */
  body?: unknown;
  /** Attach the stored bearer token. Defaults to true. */
  auth?: boolean;
  /** Override the token for this single request. */
  token?: string;
  /** Extra headers, merged over the defaults. */
  headers?: Record<string, string>;
  /** Abort signal for cancellation (e.g. from React Query). */
  signal?: AbortSignal;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, token, headers = {}, signal } = options;

  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  const bearer = token ?? (auth ? authToken : null);
  if (bearer) {
    finalHeaders.Authorization = `Bearer ${bearer}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    throw new ApiError(
      'Network request failed. Check your connection and try again.',
      0,
      err,
    );
  }

  // Parse body defensively — some endpoints may return empty bodies.
  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as ApiErrorBody).message)
        : null) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
