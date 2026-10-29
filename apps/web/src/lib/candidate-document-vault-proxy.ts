import { readLimitedJson } from "./read-limited-json";

const MAX_JSON_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 20_000;

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" }
  });
}

function upstreamConfiguration(): { url: string; anonKey: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") return null;
    return { url: parsed.toString().replace(/\/+$/, ""), anonKey };
  } catch {
    return null;
  }
}

export async function proxyCandidateDocumentVault(
  request: Request,
  action: "upload-url" | "finalize-upload" | "read-url" | "list",
  method: "GET" | "POST"
): Promise<Response> {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return json({ ok: false, status: "AUTHENTICATION_REQUIRED" }, 401);
  }
  const config = upstreamConfiguration();
  if (!config) return json({ ok: false, status: "NOT_CONFIGURED" }, 503);

  let body: Record<string, unknown> = {};
  if (method === "POST") {
    let parsed: unknown;
    try {
      parsed = await readLimitedJson(request, MAX_JSON_BYTES);
    } catch (error) {
      const code = error instanceof Error ? error.message : "INVALID_JSON";
      const status = code === "REQUEST_TOO_LARGE" ? 413
        : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
      return json({ ok: false, status: code }, status);
    }
    body = parsed as Record<string, unknown>;
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${config.url}/functions/v1/candidate-private-documents`,
      {
        method,
        headers: {
          Authorization: authorization,
          apikey: config.anonKey,
          ...(method === "POST" ? { "Content-Type": "application/json" } : {})
        },
        ...(method === "POST" ? { body: JSON.stringify({ ...body, action }) } : {}),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      }
    );
  } catch {
    return json({ ok: false, status: "DOCUMENT_SERVICE_UNAVAILABLE" }, 503);
  }

  let payload: unknown;
  try {
    const text = await upstream.text();
    if (text.length > 64 * 1024) return json({ ok: false, status: "INVALID_UPSTREAM_RESPONSE" }, 502);
    payload = JSON.parse(text);
  } catch {
    return json({ ok: false, status: "INVALID_UPSTREAM_RESPONSE" }, 502);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ ok: false, status: "INVALID_UPSTREAM_RESPONSE" }, 502);
  }
  return json(payload, upstream.status);
}
