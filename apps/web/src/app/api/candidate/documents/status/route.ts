export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-private-documents`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
      cache: "no-store"
    });
    const body = await response.json();
    return Response.json(body, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
