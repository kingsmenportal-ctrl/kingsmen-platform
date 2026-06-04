export function buildN07AirtableProviderGate(input: {
  hasApiKey: boolean;
  hasBaseMap: boolean;
  hasVerifiedHealthCheck: boolean;
}) {
  const status = !input.hasApiKey
    ? "not_configured"
    : input.hasApiKey && input.hasBaseMap && input.hasVerifiedHealthCheck
      ? "verified"
      : "configured_unverified";

  return {
    provider: "airtable",
    status,
    hasApiKey: input.hasApiKey,
    hasBaseMap: input.hasBaseMap,
    liveClaimAllowed: false,
    missingCredentialsDegradeGracefully: true,
    productionReady: false
  } as const;
}

export function assertN07AirtableLiveClaimBlocked(input: {
  liveClaimAllowed: boolean;
  proofReportPassed?: boolean;
}) {
  if (input.liveClaimAllowed === true && input.proofReportPassed !== true) {
    throw new Error("N07 Airtable provider live claim blocked without proof");
  }

  return true;
}