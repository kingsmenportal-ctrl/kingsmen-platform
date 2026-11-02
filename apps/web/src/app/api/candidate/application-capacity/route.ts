import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 8 * 1024;
const TIMEOUT_MS = 15_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USAGE_TYPES = new Set(["PRIORITY_APPLICATION", "MANAGED_ROUTE"]);

function respond(payload: unknown, status: number): Response {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The capacity service returned an invalid response." };
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

async function callRpc(request: Request, rpc: string, args: Record<string, unknown> = {}) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return respond({ ready: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before accessing application capacity." }, 401);
  }
  const config = configuration();
  if (!config) {
    return respond({ ready: false, code: "NOT_CONFIGURED", error: "Application capacity is not configured for this deployment." }, 503);
  }

  try {
    const upstream = await fetch(`${config.url}/rest/v1/rpc/${rpc}`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: authorization,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(args),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    let body: unknown;
    try {
      const raw = await upstream.text();
      if (raw.length > 64 * 1024) return respond({ ready: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502);
      body = JSON.parse(raw);
    } catch {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The capacity service returned an invalid response." }, 502);
    }

    if (!upstream.ok) {
      const denied = upstream.status === 401 || upstream.status === 403;
      return respond({
        ready: false,
        code: denied ? "IDENTITY_OR_CONSENT_REQUIRED" : "CAPACITY_REQUEST_REJECTED",
        error: denied
          ? "A verified candidate identity and active profile-processing consent are required."
          : upstream.status >= 500
            ? "Application capacity is temporarily unavailable."
            : "The capacity request was rejected. Refresh the page and check the selected application."
      }, denied ? upstream.status : upstream.status >= 500 ? 503 : 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    }
    const result = body as Record<string, unknown>;
    return respond({ ready: true, ...result }, result.ok === false ? 409 : 200);
  } catch {
    return respond({ ready: false, code: "CAPACITY_SERVICE_UNAVAILABLE", error: "Application capacity could not be reached. Retry after reconnecting." }, 503);
  }
}

export async function GET(request: Request) {
  return callRpc(request, "get_candidate_application_capacity");
}

export async function POST(request: Request) {
  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return respond({ ready: false, code, error: "The application capacity request is invalid." }, status);
  }

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return respond({ ready: false, code: "INVALID_REQUEST", error: "A capacity action is required." }, 400);
  }

  if (incoming.action === "reserve") {
    if (typeof incoming.application_id !== "string" || !UUID.test(incoming.application_id)
      || typeof incoming.usage_type !== "string" || !USAGE_TYPES.has(incoming.usage_type)
      || typeof incoming.idempotency_key !== "string"
      || !/^[A-Za-z0-9._:-]{8,160}$/.test(incoming.idempotency_key)) {
      return respond({ ready: false, code: "RESERVATION_INPUT_INVALID", error: "Select an owned application and a supported capacity type." }, 400);
    }
    return callRpc(request, "reserve_candidate_application_capacity", {
      p_application_id: incoming.application_id,
      p_usage_type: incoming.usage_type,
      p_idempotency_key: incoming.idempotency_key
    });
  }

  if (incoming.action === "release") {
    if (typeof incoming.reservation_id !== "string" || !UUID.test(incoming.reservation_id)
      || typeof incoming.reason !== "string" || incoming.reason.trim().length < 5 || incoming.reason.trim().length > 500) {
      return respond({ ready: false, code: "RELEASE_INPUT_INVALID", error: "A valid owned reservation and release reason are required." }, 400);
    }
    return callRpc(request, "release_candidate_application_capacity", {
      p_reservation_id: incoming.reservation_id,
      p_reason: incoming.reason.trim()
    });
  }

  return respond({ ready: false, code: "ACTION_NOT_SUPPORTED", error: "Supported actions are reserve and release." }, 400);
}
