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
    typeof input.syncTargetId !== "string" ||
    typeof input.sourceVersion !== "string"
  ) {
    return Response.json(
      { ok: false, productionReady: false, error: "sourceEntityType, sourceEntityId, syncTargetId and sourceVersion are required", queued: false },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\\s+\\S+/i.test(authorization)) {
    return Response.json(
      { ok: false, productionReady: false, error: "Authenticated operator session required", queued: false },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return Response.json(
      { ok: false, productionReady: false, error: "Supabase public endpoint configuration is missing", queued: false },
      { status: 503 }
    );
  }

  // Forward the caller's JWT to the Edge Function. The service-role key is
  // never read or exposed by this route; reviewer authorization happens server-side.
  let upstream: Response;
  try {
    upstream = await fetch(`${supabaseUrl.replace(/\\/$/, "")}/functions/v1/n07-airtable-enqueue`, {
      method: "POST",
      headers: {
        authorization,
        apikey: anonKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(input),
      cache: "no-store"
    });
  } catch {
    return Response.json(
      { ok: false, productionReady: false, error: "N07 queue service is unavailable", queued: false },
      { status: 503 }
    );
  }

  let result: unknown;
  try {
    result = await upstream.json();
  } catch {
    return Response.json(
      { ok: false, productionReady: false, error: "N07 queue service returned an invalid response", queued: false },
      { status: 502 }
    );
  }

  // Relay success only when the server-side RPC confirms a persisted row.
  if (!upstream.ok) return Response.json(result, { status: upstream.status });
  const accepted = result as Record<string, unknown>;
  if (accepted.status !== "QUEUED" || accepted.queued !== true || typeof accepted.jobId !== "string") {
    return Response.json(
      { ok: false, productionReady: false, error: "Queue persistence was not confirmed", queued: false },
      { status: 502 }
    );
  }
  return Response.json(result, { status: upstream.status });
}
