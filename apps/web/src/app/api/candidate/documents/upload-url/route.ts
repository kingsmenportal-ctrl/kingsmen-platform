export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.candidateId || !body?.documentTypeCode || !body?.filename || !body?.mimeType || !body?.sizeBytes) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Missing required document upload fields"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N05 signed upload route shell",
    candidateId: body.candidateId,
    documentTypeCode: body.documentTypeCode,
    rawPublicUrlAllowed: false,
    serviceRoleVisibleToBrowser: false,
    signedUploadUrl: "SIGNER_RUNTIME_REQUIRED",
    expiresInMinutes: 15
  });
}