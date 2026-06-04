export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.candidateId || !body?.routeId) {
    return Response.json(
      { ok: false, productionReady: false, error: "Missing candidateId or routeId" },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N06 candidate-safe readiness API shell",
    candidateId: body.candidateId,
    routeId: body.routeId,
    candidateCanVerifySource: false,
    candidateCanMarkPaid: false,
    candidateCanMarkSubmitted: false,
    candidateCanVerifyOutcome: false,
    serviceRoleVisibleToBrowser: false
  });
}