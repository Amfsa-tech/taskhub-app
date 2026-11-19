export interface MyReferrals {
  referralCode: string;
  referralLink: string;
  shareMessage: string;
  accountType: "User" | "Tasker";
  totalReferrals: number;
  userReferrals: number;
  taskerReferrals: number;
}

export function parseMyReferrals(response: unknown): MyReferrals {
  const payload = response as { data?: MyReferrals } & Partial<MyReferrals>;
  const data = payload?.data ?? payload;
  const counts = [data?.totalReferrals, data?.userReferrals, data?.taskerReferrals];
  const text = [data?.referralCode, data?.referralLink, data?.shareMessage];
  if (!data || text.some((value) => typeof value !== "string" || !value.trim())
    || !["User", "Tasker"].includes(data.accountType ?? "")
    || counts.some((count) => !Number.isSafeInteger(count) || (count ?? -1) < 0)) {
    throw new Error("Could not load your referral details. Please try again.");
  }
  return data as MyReferrals;
}
