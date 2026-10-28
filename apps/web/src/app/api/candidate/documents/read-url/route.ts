import { readLimitedJson } from "../../../../../lib/read-limited-json";

export const dynamic = "force-dynamic";

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Authorization");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return privateJson({ ok: false, error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  const parsed = await readLimitedJson(request, 16 * 1024);
  if (!parsed.ok) return privateJson({ ok: false, error: parsed.error }, { status: parsed.status });
  const body: any = parsed.value;
  if (typeof body?.documentId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.documentId)) {
    return privateJson({ ok: false, error: "VALID_DOCUMENT_ID_REQUIRED" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return privateJson({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_NOT_CONFIGURED" }, { status: 503 });
  try {
    const response = await fetch(`${base}/functions/v1/candidate-private-documents`, {
      method: "POST",
      headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_download_url", document_id: body.documentId }),
      cache: "no-store"
    });
    const result = await response.json();
    return privateJson(result, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return privateJson({ ok: false, error: "PRIVATE_DOCUMENT_SERVICE_UNAVAILABLE" }, { status: 502 });
  }
}
