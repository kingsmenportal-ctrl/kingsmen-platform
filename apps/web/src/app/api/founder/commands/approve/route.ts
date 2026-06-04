export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.approvalId || !body?.commandId || !body?.evidenceId || !body?.auditId) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Approval requires approvalId, commandId, evidenceId, and auditId"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N08 founder command approval route shell",
    approvalId: body.approvalId,
    commandId: body.commandId,
    founderApprovalRecorded: true,
    evidenceId: body.evidenceId,
    auditId: body.auditId,
    serviceRoleVisibleToBrowser: false
  });
}