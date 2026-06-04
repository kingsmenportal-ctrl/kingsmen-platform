export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.candidateId || !body?.routeId || !body?.gate) {
    return Response.json(
      { ok: false, productionReady: false, error: "Missing candidateId, routeId, or gate" },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N06 candidate-safe choice optimizer route shell",
    candidateId: body.candidateId,
    routeId: body.routeId,
    gate: body.gate,
    safeToProceed: false,
    noGuaranteeLanguageRequired: true,
    candidateCanVerifySource: false,
    serviceRoleVisibleToBrowser: false
  });
}