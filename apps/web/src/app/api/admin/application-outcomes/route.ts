export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ready: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ready: false, error: "INVALID_JSON" }, { status: 400 }); }
  if (!["list_ready","confirm"].includes(body?.action)) return Response.json({ ready: false, error: "UNSUPPORTED_ACTION" }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ready: false, error: "OUTCOME_REVIEW_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-application-outcome-review`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store"
    });
    const result = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ready: false, error: "OUTCOME_REVIEW_UNAVAILABLE" }, { status: 502 });
  }
}
