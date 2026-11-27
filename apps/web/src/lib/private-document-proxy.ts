const MAX_BODY_BYTES = 16 * 1024;
const NO_STORE = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Authorization",
  "Content-Type": "application/json; charset=utf-8"
};
type ProxyOptions = { action?: "create_upload" | "create_download_url" | "create_reviewer_download_url" | "list_review_queue" | "review_document" };
function reply(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: NO_STORE });
}
function bearer(request: Request): string | null {
  return /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1] ?? null;
}
async function parseLimitedJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) return null;
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) throw new Error("REQUEST_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("REQUEST_TOO_LARGE"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { throw new Error("INVALID_JSON"); }
}
function allowlistedBody(action: NonNullable<ProxyOptions["action"]>, source: Record<string, unknown>) {
  if (action === "create_upload") return {
    action, documentTypeCode: source.documentTypeCode ?? source.document_type_code ?? source.document_type ?? "OTHER",
    filename: source.filename ?? source.original_filename, mimeType: source.mimeType ?? source.mime_type,
    sizeBytes: source.sizeBytes ?? source.size_bytes, applicationId: source.applicationId ?? source.application_id ?? null,
    preparationItemId: source.preparationItemId ?? source.preparation_item_id ?? null,
    evidencePurpose: source.evidencePurpose ?? source.evidence_purpose ?? "CANDIDATE_DOCUMENT"
  };
  if (action === "create_download_url" || action === "create_reviewer_download_url") return { action, document_id: source.document_id ?? source.documentId };
  if (action === "review_document") return {
    action, document_id: source.document_id ?? source.documentId, decision: source.decision,
    reviewer_note: source.reviewer_note ?? source.reviewerNote,
    evidence_reference: source.evidence_reference ?? source.evidenceReference
  };
  return { action: "list_review_queue" };
}
export async function proxyPrivateDocumentRequest(request: Request, options: ProxyOptions = {}): Promise<Response> {
  const token = bearer(request);
  if (!token) return reply({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "A signed-in session is required." }, 401);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return reply({ ok: false, code: "DOCUMENT_SERVICE_NOT_CONFIGURED" }, 503);
  let endpoint: URL;
  try { endpoint = new URL(baseUrl); } catch { return reply({ ok: false, code: "DOCUMENT_SERVICE_NOT_CONFIGURED" }, 503); }
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") {
    return reply({ ok: false, code: "DOCUMENT_SERVICE_NOT_CONFIGURED" }, 503);
  }
  let upstreamMethod = request.method === "GET" ? "GET" : "POST";
  let body: Record<string, unknown> | undefined;
  if (options.action) {
    upstreamMethod = "POST";
    if (options.action === "list_review_queue") body = allowlistedBody(options.action, {});
    else {
      let incoming: Record<string, unknown> | null;
      try { incoming = await parseLimitedJson(request); }
      catch (error) {
        const code = error instanceof Error ? error.message : "INVALID_JSON";
        return reply({ ok: false, code, error: "The document request is invalid." }, code === "REQUEST_TOO_LARGE" ? 413 : 400);
      }
      if (!incoming) {
        const contentType = request.headers.get("content-type") ?? "";
        const code = /^application\/json/i.test(contentType) ? "INVALID_JSON" : "JSON_CONTENT_TYPE_REQUIRED";
        return reply({ ok: false, code }, code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400);
      }
      body = allowlistedBody(options.action, incoming);
    }
  } else if (request.method !== "GET") return reply({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const upstream = await fetch(new URL("/functions/v1/candidate-private-documents", endpoint).toString(), {
      method: upstreamMethod,
      headers: { apikey: anonKey, Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000)
    });
    let payload: unknown;
    try { payload = await upstream.json(); } catch { return reply({ ok: false, code: "DOCUMENT_SERVICE_INVALID_RESPONSE" }, 502); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply({ ok: false, code: "DOCUMENT_SERVICE_INVALID_RESPONSE" }, 502);
    return reply(payload as Record<string, unknown>, upstream.status);
  } catch {
    return reply({ ok: false, code: "DOCUMENT_SERVICE_UNAVAILABLE", error: "The private document service could not be reached." }, 503);
  }
}
