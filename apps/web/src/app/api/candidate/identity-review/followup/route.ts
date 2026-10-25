export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ error: "IDENTITY_REVIEW_NOT_CONFIGURED" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "INVALID_JSON" }, { status: 400 }); }
  try {
    const response = await fetch(`${base}/functions/v1/candidate-identity-review-followup`, { method: "POST", headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "IDENTITY_FOLLOWUP_UNAVAILABLE" }, { status: 502 }); }
}
