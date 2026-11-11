export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Request body must be valid JSON",
        queued: false
      },
      { status: 400 }
    );
  }

  const input = body as Record<string, unknown> | null;
  if (
    !input ||
    typeof input.sourceEntityType !== "string" ||
    typeof input.sourceEntityId !== "string" ||
    typeof input.targetBaseName !== "string" ||
    typeof input.targetTableName !== "string"
  ) {
    return Response.json(
      {
        ok: false,
        productionReady: false,
        error: "Missing or invalid Airtable mirror source or target fields",
        queued: false
      },
      { status: 400 }
    );
  }

  // Fail closed until this route is connected to the authenticated,
  // service-side durable outbox writer. Never claim a job was queued
  // when no database write has occurred.
  return Response.json(
    {
      ok: false,
      productionReady: false,
      boundary: "N07 Airtable sync enqueue is not connected to the durable outbox",
      reason: "QUEUE_ADAPTER_NOT_CONFIGURED",
      mirrorOnly: true,
      postgresTruthPreserved: true,
      airtableTruthAuthorityBlocked: true,
      serviceRoleVisibleToBrowser: false,
      queued: false,
      retryable: false
    },
    { status: 503 }
  );
}
