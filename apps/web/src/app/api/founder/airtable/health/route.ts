export async function GET() {
  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N07 Airtable provider health route shell",
    provider: "airtable",
    configured: false,
    verifiedHealthCheck: false,
    degraded: true,
    missingCredentialsDegradeGracefully: true,
    liveProviderClaimAllowed: false,
    postgresTruthPreserved: true,
    airtableMirrorOnly: true,
    airtableTruthAuthorityBlocked: true,
    serviceRoleVisibleToBrowser: false
  });
}