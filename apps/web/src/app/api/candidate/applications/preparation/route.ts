export const dynamic = "force-dynamic";

const ACTIONS = new Set(["load","start_from_saved_route","update_tracker","add_item","update_item"]);

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ready: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ready: false, error: "INVALID_JSON" }, { status: 400 }); }
  if (!body || typeof body.action !== "string" || !ACTIONS.has(body.action)) return Response.json({ ready: false, error: "UNSUPPORTED_PREPARATION_ACTION" }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ready: false, error: "PREPARATION_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  const payload: Record<string, unknown> = { action: body.action };
  const fields = ["route_programme_id","tracker_id","status","candidate_note","evidence_reference","title","item_type","official_source_url","item_id"];
  for (const field of fields) if (body[field] !== undefined) payload[field] = body[field];
  try {
    const response = await fetch(`${base}/functions/v1/candidate-application-preparation`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store"
    });
    const result = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ready: false, error: "PREPARATION_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
