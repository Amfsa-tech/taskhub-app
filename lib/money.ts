/** Monetary snapshots may be absent on old ledger rows. Keep zero distinct from unknown. */
export function balanceValue(naira?: number | null, kobo?: number | null): number | null {
  if (naira === null && (kobo == null || kobo === 0)) return null;
  if (typeof kobo === 'number' && Number.isFinite(kobo)) return kobo / 100;
  return typeof naira === 'number' && Number.isFinite(naira) ? naira : null;
}

export function formatBalance(naira?: number | null, kobo?: number | null): string {
  const value = balanceValue(naira, kobo);
  return value === null ? 'N/A' : `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
