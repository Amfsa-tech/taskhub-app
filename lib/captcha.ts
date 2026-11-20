type Requester = () => Promise<string>;
let requester: Requester | undefined;

export function captchaRequiredFor(endpoint: string, method: string) {
  return method === 'POST' && /^\/api\/auth\/(?:user-register|tasker-register|user-login|tasker-login|forgot-password|resend-verification)$/.test(endpoint.split('?')[0]);
}

export function registerCaptchaRequester(handler: Requester) {
  requester = handler;
  return () => { if (requester === handler) requester = undefined; };
}

export async function requestCaptchaToken() {
  if (!requester) throw new Error('The security check is not ready. Please reopen this screen and try again.');
  const token = await requester();
  if (!token) throw new Error('Please complete the security check and try again.');
  return token;
}
