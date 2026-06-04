export function buildN08FounderProviderHealthSummary(input: {
  providers: Array<{
    provider: string;
    configured: boolean;
    verified: boolean;
    degraded: boolean;
  }>;
}) {
  return {
    schema: "kingsmen.n08-founder-provider-health-summary.v1",
    providers: input.providers.map((provider) => ({
      ...provider,
      liveClaimAllowed: false,
      productionReady: false
    })),
    degradedCount: input.providers.filter((provider) => provider.degraded === true).length,
    founderReviewRequired: input.providers.some((provider) => provider.degraded === true),
    productionReady: false
  } as const;
}