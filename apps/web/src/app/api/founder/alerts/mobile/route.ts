export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.alertId || !body?.reason || !body?.actionPacketId || !body?.evidenceId || !body?.auditId) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Mobile alert requires alertId, reason, actionPacketId, evidenceId, and auditId"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N08 urgent-only founder mobile alert route shell",
    urgentOnly: true,
    alertId: body.alertId,
    reason: body.reason,
    actionPacketId: body.actionPacketId,
    serviceRoleVisibleToBrowser: false
  });
}