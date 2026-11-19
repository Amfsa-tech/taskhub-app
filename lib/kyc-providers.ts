export type KycProviderKey = "qoreid" | "didit";

export interface KycProviders {
  providers: { key: string; enabled: boolean }[];
  anyEnabled: boolean;
}

export function parseKycProviders(response: unknown): KycProviders {
  const payload = response as { data?: KycProviders } & Partial<KycProviders>;
  const data = payload?.data ?? payload;
  if (!data || !Array.isArray(data.providers) || typeof data.anyEnabled !== "boolean"
    || data.providers.some((provider) => !provider || typeof provider.key !== "string" || typeof provider.enabled !== "boolean")) {
    throw new Error("Could not load verification options. Please try again.");
  }
  return { providers: data.providers, anyEnabled: data.anyEnabled };
}

export function kycProviderEnabled(data: KycProviders | undefined, key: KycProviderKey) {
  return data?.anyEnabled === true && data.providers.some((provider) => provider.key === key && provider.enabled === true);
}
