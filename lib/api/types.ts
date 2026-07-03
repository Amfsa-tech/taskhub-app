// Shared API response primitives. The TaskHub backend consistently returns
// `{ status: 'success' | 'error', message, ...data }`.

export type ApiStatus = 'success' | 'error';

export interface ApiEnvelope {
  status: ApiStatus;
  message?: string;
}

// Error body shapes seen across endpoints.
export interface ApiErrorBody extends ApiEnvelope {
  status: 'error';
  message: string;
  missingFields?: string[];
  emailVerificationRequired?: boolean;
}
