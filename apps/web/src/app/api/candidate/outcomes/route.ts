export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ready: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ready: false, error: "OUTCOME_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-application-outcomes`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "load" }), cache: "no-store"
    });
    const result = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ready: false, error: "OUTCOME_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
