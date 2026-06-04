export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.candidateId || !body?.documentId) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Missing candidateId or documentId"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N05 signed read route shell",
    candidateId: body.candidateId,
    documentId: body.documentId,
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false,
    signedReadUrl: "SIGNER_RUNTIME_REQUIRED",
    expiresInMinutes: 10
  });
}