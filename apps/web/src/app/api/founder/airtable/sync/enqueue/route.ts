export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, productionReady: false, error: "Request body must be valid JSON", queued: false },
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
      { ok: false, productionReady: false, error: "Missing or invalid Airtable mirror source or target fields", queued: false },
      { status: 400 }
    );
  }

  // The durable SQL RPC is intentionally not called from this public route yet:
  // no verified server-side founder/operator auth adapter is wired here.
  // Never report a queued job until the server has committed a real outbox row.
  return Response.json(
    {
      ok: false,
      productionReady: false,
      boundary: "N07 durable outbox exists but authenticated route adapter is not configured",
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
