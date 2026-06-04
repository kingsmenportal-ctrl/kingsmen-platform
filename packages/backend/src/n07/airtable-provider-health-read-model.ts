export function buildN07AirtableProviderHealthReadModel(input: {
  hasApiKey: boolean;
  hasBaseMap: boolean;
  hasVerifiedHealthCheck: boolean;
  lastCheckedAt?: string;
}) {
  const configured = input.hasApiKey && input.hasBaseMap;
  const degraded = !configured || !input.hasVerifiedHealthCheck;

  return {
    provider: "airtable",
    configured,
    verifiedHealthCheck: input.hasVerifiedHealthCheck,
    degraded,
    lastCheckedAt: input.lastCheckedAt,
    liveProviderClaimAllowed: false,
    productionReady: false
  } as const;
}

export function assertN07AirtableProviderHealthSafe(input: {
  liveProviderClaimAllowed: boolean;
  verifiedHealthCheck: boolean;
  productionReady?: boolean;
}) {
  if (input.liveProviderClaimAllowed === true && input.verifiedHealthCheck !== true) {
    throw new Error("N07 Airtable health blocked: live provider claim requires verified health check");
  }

  if (input.productionReady === true) {
    throw new Error("N07 Airtable health cannot claim productionReady=true");
  }

  return true;
}