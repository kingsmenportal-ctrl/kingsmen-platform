export function buildN07FounderAirtableHealthView(input: {
  configured: boolean;
  verifiedHealthCheck: boolean;
  queuedJobs: number;
  failedJobs: number;
  dlqJobs: number;
  lastCheckedAt?: string;
}) {
  return {
    schema: "kingsmen.n07-founder-airtable-health-view.v1",
    provider: "airtable",
    configured: input.configured,
    verifiedHealthCheck: input.verifiedHealthCheck,
    degraded: !input.configured || !input.verifiedHealthCheck || input.dlqJobs > 0,
    queuedJobs: input.queuedJobs,
    failedJobs: input.failedJobs,
    dlqJobs: input.dlqJobs,
    lastCheckedAt: input.lastCheckedAt,
    postgresTruthPreserved: true,
    airtableMirrorOnly: true,
    airtableTruthAuthorityBlocked: true,
    liveProviderClaimAllowed: false,
    productionReady: false
  } as const;
}