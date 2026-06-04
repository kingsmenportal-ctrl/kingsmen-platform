export function assertNoProviderLiveClaimWithoutProof(input: {
  paymentsLive?: boolean;
  emailRuntimeLive?: boolean;
  officialSubmissionsLive?: boolean;
  productionReady?: boolean;
}) {
  const blocked = Object.entries(input).filter(([, value]) => value === true);
  if (blocked.length > 0) {
    throw new Error("Provider live claim blocked without matching proof report.");
  }
  return true;
}