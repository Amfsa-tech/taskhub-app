// Support drafts contain readable context, never raw backend errors or credentials.
const ACTIONS = {
  'fund-wallet': 'I tried to add money to my wallet, but the payment checkout could not be started.',
  'bank-view': 'I tried to view my payout bank details, but they could not be loaded.',
  'bank-edit': 'I tried to save my payout bank details, but they could not be saved.',
  'email-verification': 'I tried to verify my email address, but it could not be confirmed.',
  'check-payment': 'I tried to confirm my wallet payment, but its payment status could not be retrieved.',
  'payment-failed': 'The payment provider reported that my wallet payment was not completed.',
  'payment-pending': 'My wallet payment is still being processed and has not been confirmed.',
  'payment-cancelled': 'The checkout closed before my wallet payment was confirmed.',
  withdrawal: 'I tried to submit a withdrawal from my wallet, but the request was not completed.',
  wallet: 'I tried to view my wallet balance or transactions, but they could not be loaded.',
  'post-task': 'I tried to publish a task, but it could not be posted.',
  'update-task': 'I tried to change a task, but my changes could not be saved.',
  tasks: 'I tried to view task information, but it could not be loaded.',
  hire: 'I tried to invite a tasker to my task, but the invitation was not sent.',
  bids: 'I tried to manage a bid or invitation for a task, but the action could not be completed.',
  messages: 'I tried to open or send a message, but the conversation could not be updated.',
  verification: 'I tried to verify my identity, but verification could not be completed.',
  'verification-preparation': 'Identity verification stayed on the preparing screen instead of opening the next step.',
  'support-info': 'I tried to view help information or support options, but they could not be loaded.',
  taskers: 'I tried to find or view a tasker, but their profile information could not be loaded.',
  'verification-closed': 'I closed identity verification before submitting it and need help completing verification.',
  'load-profile': 'I tried to view my account details, but they could not be loaded.',
  profile: 'I tried to update my account details, but my changes could not be saved.',
  'delete-account': 'I tried to delete my account, but account deletion could not be completed.',
  signin: 'I tried to sign in or switch account roles, but I could not access the requested account.',
  biometrics: 'I tried to set up or use biometric sign-in, but the biometric check could not be completed.',
  categories: 'I tried to choose a task category or service, but the available choices could not be loaded.',
  support: 'I tried to send a support request, but it could not be submitted.',
  load: 'I tried to load information on this screen, but it could not be displayed.',
  save: 'I tried to save changes on this screen, but they could not be saved.',
} as const;

export type SupportAction = keyof typeof ACTIONS;
export interface SupportIssue { action: SupportAction; explanation: string; reference?: string; scope?: string }
type Identity = { fullName?: unknown; firstName?: unknown; lastName?: unknown; name?: unknown; emailAddress?: unknown; email?: unknown };

export function makeSupportIssue(action: SupportAction, error?: unknown, reference?: string, requestScope?: string): SupportIssue {
  const raw = typeof error === 'string' ? error : error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  let detail = '';
  if (/timed? ?out|timeout|took too long/i.test(raw)) detail = 'The request did not finish before the connection timed out.';
  else if (/network|failed to fetch|connection|offline|ECONN/i.test(raw)) detail = 'My device could not connect to TaskHub to complete this action.';
  else if (/insufficient|more than.*available|not enough.*balance/i.test(raw)) detail = 'My available wallet balance was too low for this action.';
  else if (/missing.*payment reference|payment reference.*missing/i.test(raw)) detail = 'The payment return page did not include a usable payment reference.';
  else if (/minimum|at least|min_amount/i.test(raw)) detail = 'The amount I entered was below the minimum allowed for this action.';
  else if (/pending.*withdraw|withdraw.*pending/i.test(raw)) detail = 'An earlier withdrawal is still awaiting approval.';
  else if (/cooldown|withdraw again after/i.test(raw)) detail = 'I cannot make another withdrawal until the waiting period for my previous withdrawal ends.';
  else if (/restrict|suspend/i.test(raw)) detail = 'My account is restricted from completing this action.';
  else if (/bank|payout/i.test(raw) && /missing|invalid|required|not.*accept/i.test(raw)) detail = 'My payout bank details were missing or could not be accepted.';
  else if (/verif|kyc/i.test(raw) && /required|must|need|not verified/i.test(raw)) detail = 'My account needs verification before I can complete this action.';
  else if (/code|otp/i.test(raw) && /incorrect|invalid|expired/i.test(raw)) detail = 'The email verification code was incorrect or had expired.';
  return { action, explanation: `${ACTIONS[action]}${detail ? ' ' + detail : ''}`, ...(reference ? { reference } : {}), ...(requestScope ? { scope: requestScope } : {}) };
}

export function supportTopic(pathname: string): string {
  if (/deactivate-account|delete-account/.test(pathname)) return 'I need help deleting my TaskHub account.';
  if (/biometric/.test(pathname)) return 'I need help setting up or using biometric sign-in on TaskHub.';
  if (/bank|payout/.test(pathname)) return 'I need help with my payout bank account.';
  if (/withdraw/.test(pathname)) return 'I need help withdrawing money from my TaskHub wallet.';
  if (/receipt|transaction-history/.test(pathname)) return 'I need help with my TaskHub transactions or receipts.';
  if (/wallet|payment|transaction|withdraw/.test(pathname)) return 'I need help with my TaskHub wallet.';
  if (/otp/.test(pathname)) return 'I need help verifying my email address on TaskHub.';
  if (/verif|nin|kyc/.test(pathname)) return 'I need help verifying my identity on TaskHub.';
  if (/forgot-password|create-new-password|change-password/.test(pathname)) return 'I need help resetting or changing my TaskHub password.';
  if (/login|link-role|connected-accounts/.test(pathname)) return 'I need help signing in or switching accounts on TaskHub.';
  if (/create-account|google-complete-signup|signup/.test(pathname)) return 'I need help creating my TaskHub account.';
  if (/edit-profile|tasker-details|location-permission/.test(pathname)) return 'I need help completing or updating my TaskHub profile.';
  if (/post-category|post-service|post-details|edit-task/.test(pathname)) return 'I need help posting or editing a task on TaskHub.';
  if (/choose-existing-task|task-agreement/.test(pathname)) return 'I need help hiring a Tasker for my task.';
  if (/portfolio/.test(pathname)) return 'I need help updating my Tasker portfolio.';
  if (/tasker-services|purpose-selection|location-university/.test(pathname)) return 'I need help choosing my services or institution on TaskHub.';
  if (/tasker-profile|taskers|saved-taskers/.test(pathname)) return 'I need help finding or viewing a Tasker on TaskHub.';
  if (/chat|messages/.test(pathname)) return 'I need help with my TaskHub messages.';
  if (/reviews|post-review/.test(pathname)) return 'I need help with reviews and ratings on TaskHub.';
  if (/referral/.test(pathname)) return 'I need help with my TaskHub referral code or invitations.';
  if (/task|history|discover|feed/.test(pathname)) return 'I need help with a task on TaskHub.';
  if (/profile|settings/.test(pathname)) return 'I need help with my TaskHub account.';
  return 'I need help using TaskHub.';
}

function readSupportField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function supportIdentity(user?: Identity | null) {
  const name = readSupportField(user?.fullName) || [user?.firstName, user?.lastName].map(readSupportField).filter(Boolean).join(' ') || readSupportField(user?.name);
  const email = readSupportField(user?.emailAddress) || readSupportField(user?.email);
  return { name, email };
}

export function buildSupportMessage(user?: Identity | null, issue?: SupportIssue | null, topic = 'I need help using TaskHub.'): string {
  const { name, email } = supportIdentity(user);
  return [name ? `Hi, my name is ${name}.` : 'Hi, I would like help with TaskHub.', email ? `My email is ${email}.` : '', '',
    issue ? `${issue.action === 'load' || issue.action === 'save' ? topic + ' ' : ''}${issue.explanation}` : topic, issue?.reference ? `Payment reference: ${issue.reference}` : ''].filter((line, index) => line || index === 2).join('\n').trim();
}

type Snapshot = { issue: SupportIssue; scope: string; key: string; at: number } | null;
let scope = '';
let snapshot: Snapshot = null;
type SupportOrigin = { scope: string; sourceScope: string; pathname: string; issue?: SupportIssue; key?: string; at: number };
let supportOrigin: SupportOrigin | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
export const getSupportScope = () => scope;
export const getSupportSnapshot = () => snapshot;
export const getServerSupportSnapshot = () => null;
export const subscribeSupport = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const supportScope = (id: string | undefined, pathname: string) => `${id || 'guest'}:${pathname}`;
export function setSupportScope(next: string) {
  if (scope === next) return;
  const separator = scope.indexOf(':');
  const owner = scope.slice(0, separator);
  const previousPath = scope.slice(separator + 1);
  // Help is a continuation of the preceding screen, not a new support topic.
  if (separator > 0 && next === `${owner}:/help-support` && previousPath !== '/help-support') {
    supportOrigin = {
      scope: next, sourceScope: scope, pathname: previousPath,
      issue: previousPath === '/home' ? undefined : currentSupportIssue(snapshot, scope),
      key: snapshot?.key, at: snapshot?.at ?? Date.now(),
    };
  } else supportOrigin = null;
  scope = next; snapshot = null; emit();
}
export function getSupportOrigin(currentScope: string) {
  return supportOrigin?.scope === currentScope && Date.now() - supportOrigin.at < 10 * 60_000 ? supportOrigin : undefined;
}
export function recordSupportIssue(issue: SupportIssue, key: string = issue.action, requestScope = scope) {
  if (!requestScope || requestScope !== scope || (issue.scope && issue.scope !== requestScope)) return;
  snapshot = { issue, scope, key, at: Date.now() }; emit();
}
export function clearSupportIssue(key: string, requestScope = scope) {
  if (snapshot?.scope === requestScope && snapshot.key === key) { snapshot = null; emit(); }
  if (supportOrigin?.sourceScope === requestScope && supportOrigin.key === key) {
    supportOrigin = { ...supportOrigin, issue: undefined, key: undefined }; emit();
  }
}
export function currentSupportIssue(value: Snapshot, currentScope: string): SupportIssue | undefined {
  return value && value.scope === currentScope && Date.now() - value.at < 10 * 60_000 ? value.issue : undefined;
}

export function supportRequestAction(endpoint: string, method: string): SupportAction | null {
  const path = endpoint.split('?')[0].toLowerCase();
  if (/refresh|kyc-failure|notification|presence|heartbeat|online-status/.test(path)) return null;
  if (/bank|payout/.test(path)) return method === 'GET' ? 'bank-view' : 'bank-edit';
  if (/biometric/.test(path)) return 'biometrics';
  if (/verify-email|email-verification/.test(path)) return 'email-verification';
  if (/withdraw/.test(path)) return 'withdrawal';
  if (/verify.*fund|verify.*payment|fund.*verify|payment.*verify|wallet.*verify|verify.*wallet/.test(path)) return 'check-payment';
  if (/fund|initializ.*payment/.test(path)) return 'fund-wallet';
  if (/wallet|transaction|payment/.test(path)) return 'wallet';
  if (/hire|invit/.test(path)) return 'hire';
  if (/bids/.test(path)) return 'bids';
  if (/chat|message|conversation/.test(path)) return 'messages';
  if (/nin|kyc|didit|verif/.test(path)) return 'verification';
  if (/delete-account/.test(path)) return 'delete-account';
  if (/login|switch-mode|roles|link-account/.test(path)) return 'signin';
  if (/auth|profile/.test(path)) return method === 'GET' ? 'load-profile' : method === 'DELETE' ? 'delete-account' : 'profile';
  if (/categor|universit|service/.test(path)) return 'categories';
  if (/taskers/.test(path)) return 'taskers';
  if (/\/tasks?(?:\/|$)/.test(path)) return method === 'GET' ? 'tasks' : method === 'POST' && /\/tasks?\/?$|create|post/.test(path) ? 'post-task' : 'update-task';
  if (/support|ticket|faq/.test(path)) return method === 'GET' ? 'support-info' : 'support';
  return method === 'GET' ? 'load' : 'save';
}
export function captureSupportRequest(endpoint: string, method: string, error: unknown, requestScope: string) {
  const action = supportRequestAction(endpoint, method);
  const object = error && typeof error === 'object' ? error as { name?: string; body?: { name?: string; code?: string }; data?: { code?: string } } : undefined;
  if (!action || object?.name === 'AbortError' || object?.body?.name === 'AbortError' ||
    (object?.body?.code || object?.data?.code) === 'counterpart_not_found') return;
  recordSupportIssue(makeSupportIssue(action, error, undefined, requestScope), `${method}:${endpoint}`, requestScope);
}
