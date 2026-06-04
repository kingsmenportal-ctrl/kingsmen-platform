export async function GET() {
  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N05 candidate-safe document status route shell",
    candidateSafeReadModelOnly: true,
    serviceRoleVisibleToBrowser: false,
    candidateCanVerify: false,
    candidateCanReject: false,
    candidateCanDelete: false,
    rawPublicUrlAllowed: false
  });
}