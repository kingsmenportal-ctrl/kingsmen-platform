export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }
  if (typeof body?.documentId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.documentId)) {
    return Response.json({ ok: false, error: "VALID_DOCUMENT_ID_REQUIRED" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-private-documents`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_download_url", document_id: body.documentId }),
      cache: "no-store"
    });
    const result = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
