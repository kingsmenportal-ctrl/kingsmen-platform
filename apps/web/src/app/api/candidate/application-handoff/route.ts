import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 4 * 1024;
const TIMEOUT_MS = 15_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(payload: unknown, status: number): Response {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ready: false, ok: false, code: "INVALID_UPSTREAM_RESPONSE" };
  return Response.json(safe, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", Vary: "Authorization" }
  });
}

function configuration() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    return { url: url.toString().replace(/\/+$/, ""), anonKey };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return respond({ ready: false, ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before preparing a provider portal handoff." }, 401);
  }

  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return respond({ ready: false, ok: false, code, error: "The handoff request is invalid." }, status);
  }

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)
    || typeof incoming.application_id !== "string" || !UUID.test(incoming.application_id)) {
    return respond({ ready: false, ok: false, code: "APPLICATION_ID_INVALID", error: "A valid parent application reference is required." }, 400);
  }

  const config = configuration();
  if (!config) {
    return respond({ ready: false, ok: false, code: "NOT_CONFIGURED", error: "Application handoff is not configured for this deployment." }, 503);
  }

  try {
    const upstream = await fetch(`${config.url}/rest/v1/rpc/prepare_candidate_manual_portal_submission`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ p_application_id: incoming.application_id }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    let payload: unknown;
    try {
      const raw = await upstream.text();
      if (raw.length > 64 * 1024) return respond({ ready: false, ok: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502);
      payload = JSON.parse(raw);
    } catch {
      return respond({ ready: false, ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The handoff service returned an invalid response." }, 502);
    }

    if (!upstream.ok) {
      const denied = upstream.status === 401 || upstream.status === 403;
      return respond({
        ready: false,
        ok: false,
        code: denied ? "IDENTITY_OR_OWNERSHIP_REQUIRED" : "APPLICATION_HANDOFF_REJECTED",
        error: denied
          ? "A verified candidate identity and ownership of this application are required."
          : "The official portal handoff could not be prepared. Refresh the application and try again."
      }, denied ? upstream.status : upstream.status >= 500 ? 503 : 409);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return respond({ ready: false, ok: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    }
    const result = payload as Record<string, unknown>;
    if (result.ok !== true) {
      const code = typeof result.code === "string" ? result.code : "APPLICATION_HANDOFF_REJECTED";
      const clientError = ["APPLICATION_DRAFT_REQUIRED", "OFFICIAL_SOURCE_REFRESH_REQUIRED",
        "OFFICIAL_HTTPS_URL_REQUIRED", "MANUAL_PORTAL_NOT_APPLICABLE",
        "APPLICATION_ALREADY_SUBMITTED_OR_TRACKED"].includes(code);
      return respond({ ready: true, ...result, provider_submission_sent: false }, clientError ? 409 : 400);
    }

    let officialUrl: URL;
    try {
      officialUrl = new URL(String(result.official_url ?? ""));
    } catch {
      return respond({ ready: false, ok: false, code: "OFFICIAL_HTTPS_URL_REQUIRED" }, 502);
    }
    if (officialUrl.protocol !== "https:" || result.provider_submission_sent !== false
      || typeof result.submission_ref !== "string" || !result.submission_ref.trim()) {
      return respond({ ready: false, ok: false, code: "HANDOFF_RESPONSE_INVALID" }, 502);
    }

    return respond({ ready: true, ...result, provider_submission_sent: false }, 200);
  } catch {
    return respond({ ready: false, ok: false, code: "APPLICATION_HANDOFF_UNAVAILABLE", error: "The application handoff service could not be reached. Reconnect and retry." }, 503);
  }
}
