export function referralCodeValue(value?: string | string[]) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function referralFieldError(error: unknown) {
  const data = (error as { body?: { field?: string; code?: string; message?: string } })?.body;
  if (!data || (data.field !== 'referralCode' && !['INVALID_REFERRAL_CODE', 'SELF_REFERRAL'].includes(data.code ?? ''))) return undefined;
  return data.message || 'This referral code cannot be used. Check the code or leave the field empty.';
}
