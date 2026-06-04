export const N07_AIRTABLE_PROVIDER_HEALTH_POLICY = {
  productionReady: false,
  providerHealthReadModelBuilt: true,
  liveProviderClaimRequiresProof: true,
  missingCredentialsDegradeGracefully: true,
  airtableMirrorOnly: true,
  postgresTruthPreserved: true
} as const;

export function assertN07AirtableProviderHealthPolicySafe() {
  if (N07_AIRTABLE_PROVIDER_HEALTH_POLICY.productionReady !== false) {
    throw new Error("N07 Airtable provider health policy cannot claim productionReady=true");
  }

  return true;
}