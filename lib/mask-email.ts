/** Keep a short email hint; even one-character addresses stay masked. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return email ? '***' : '';
  const local = email.slice(0, at);
  const keep = local.length > 3 ? 2 : local.length > 1 ? 1 : 0;
  return `${local.slice(0, keep)}***${email.slice(at)}`;
}
