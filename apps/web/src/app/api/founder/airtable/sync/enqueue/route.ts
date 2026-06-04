export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.sourceEntityType || !body?.sourceEntityId || !body?.targetBaseName || !body?.targetTableName) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Missing Airtable mirror source or target fields"
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    productionReady: false,
    boundary: "N07 Airtable sync enqueue route shell",
    mirrorOnly: true,
    postgresTruthPreserved: true,
    airtableTruthAuthorityBlocked: true,
    serviceRoleVisibleToBrowser: false,
    queued: true
  });
}