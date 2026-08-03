// Support requests.
//
// `POST /api/support` is unauthenticated and takes exactly three fields —
// `{ name, email, message }`. It has no persistence: the backend validates,
// renders an HTML email, and sends it to support@ngtaskhub.com. There is no
// ticket id to show the user and no way to read a request back, so every screen
// that reports something has to fold its structure (issue category, task
// reference) into the free-text `message`.

import { api } from './client';

export interface SupportRequestPayload {
  name: string;
  /** Must pass the backend's `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` check. */
  email: string;
  message: string;
}

export interface SupportRequestResponse {
  status: string;
  message: string;
}

export function submitSupportRequest(payload: SupportRequestPayload) {
  // No token required, and sending one changes nothing server-side.
  return api.post<SupportRequestResponse>('/api/support', payload, { auth: false });
}

/**
 * Build the `message` body for an issue report.
 *
 * The endpoint carries no category or task fields, so the structured parts of
 * the form are written into the text where a support agent can actually read
 * them — otherwise a report reads as bare prose with no idea which task it's
 * about.
 */
export function buildIssueReportMessage(args: {
  issue: string;
  details?: string;
  taskId?: string;
  taskTitle?: string;
}): string {
  const lines = [`Issue: ${args.issue}`];

  if (args.taskTitle) lines.push(`Task: ${args.taskTitle}`);
  if (args.taskId) lines.push(`Task ID: ${args.taskId}`);

  const details = args.details?.trim();
  lines.push('', details || 'No additional details provided.');

  return lines.join('\n');
}
