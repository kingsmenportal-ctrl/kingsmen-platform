export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }
  if (typeof body?.applicationId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.applicationId)) {
    return Response.json({ ok: false, error: "VALID_APPLICATION_ID_REQUIRED" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ok: false, error: "CANDIDATE_WORKSPACE_NOT_CONFIGURED" }, { status: 503 });
  const auth = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: authorization }, cache: "no-store" });
  if (!auth.ok) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  try {
    const response = await fetch(`${base}/rest/v1/rpc/prepare_candidate_manual_portal_submission`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ p_application_id: body.applicationId }),
      cache: "no-store"
    });
    const result = await response.json();
    if (!response.ok) {
      return Response.json({ ok: false, error: response.status === 403 ? "VERIFIED_CANDIDATE_IDENTITY_REQUIRED" : "MANUAL_PORTAL_PREPARATION_FAILED" }, { status: response.status >= 500 ? 502 : response.status });
    }
    return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "MANUAL_PORTAL_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
