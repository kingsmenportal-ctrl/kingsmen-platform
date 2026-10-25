export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return Response.json({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }
  const filename = typeof body?.filename === "string" ? body.filename.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  const sizeBytes = Number(body?.sizeBytes);
  if (!filename || filename.length > 180 || !["application/pdf", "image/jpeg", "image/png"].includes(mimeType) ||
      !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 10 * 1024 * 1024) {
    return Response.json({ ok: false, error: "PDF_JPEG_PNG_MAX_10_MIB_REQUIRED" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-private-documents`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_upload", filename, mime_type: mimeType, size_bytes: sizeBytes,
        ...(typeof body.applicationId === "string" ? { application_id: body.applicationId } : {}),
        ...(typeof body.preparationItemId === "string" ? { preparation_item_id: body.preparationItemId } : {})
      }),
      cache: "no-store"
    });
    const result = await response.json();
    return Response.json(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
