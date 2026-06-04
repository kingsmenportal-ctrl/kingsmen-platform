export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.candidateId || !body?.parentApplicationId) {
    return Response.json(
      { ok: false, productionReady: false, error: "Missing candidateId or parentApplicationId" },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N06 CAO parent-child optimizer route shell",
    candidateId: body.candidateId,
    parentApplicationId: body.parentApplicationId,
    countsAsOneKingsmenApplication: true,
    childChoiceCountsAsSeparateKingsmenApplication: false,
    noGuaranteeLanguageRequired: true,
    serviceRoleVisibleToBrowser: false
  });
}