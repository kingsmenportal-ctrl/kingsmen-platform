export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.operationId || !body?.evidenceId || !body?.auditId) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Stop-selling operation requires operationId, evidenceId, and auditId"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N08 stop-selling operation route shell",
    operationId: body.operationId,
    founderApprovalRequired: true,
    capLimitsVolumeNotCapability: true,
    gatesRemainVisibleAndAssessable: true,
    serviceRoleVisibleToBrowser: false
  });
}