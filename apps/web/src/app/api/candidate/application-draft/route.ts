import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 72 * 1024;
const TIMEOUT_MS = 15_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(payload: unknown, status: number): Response {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The application draft service returned an invalid response." };
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
    return respond({ ready: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to open or save an application draft." }, 401);
  }
  const config = configuration();
  if (!config) {
    return respond({ ready: false, code: "NOT_CONFIGURED", error: "Application draft persistence is not configured for this deployment." }, 503);
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
    let payload: unknown;
    try {
      const raw = await upstream.text();
      if (raw.length > 128 * 1024) return respond({ ready: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502);
      payload = JSON.parse(raw);
    } catch {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The application draft service returned an invalid response." }, 502);
    }

    if (!upstream.ok) {
      const denied = upstream.status === 401 || upstream.status === 403;
      return respond({
        ready: false,
        code: denied ? "IDENTITY_OR_OWNERSHIP_REQUIRED" : "APPLICATION_DRAFT_REQUEST_REJECTED",
        error: denied
          ? "A verified candidate identity and ownership of this parent application are required."
          : upstream.status >= 500
            ? "Application draft persistence is temporarily unavailable."
            : "The application draft could not be loaded or saved. Refresh the page and try again."
      }, denied ? upstream.status : upstream.status >= 500 ? 503 : 400);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    }
    const result = payload as Record<string, unknown>;
    return respond({ ready: true, ...result }, result.ok === false
      ? result.code === "APPLICATION_DRAFT_VERSION_CONFLICT" ? 409 : 400
      : 200);
  } catch {
    return respond({ ready: false, code: "APPLICATION_DRAFT_UNAVAILABLE", error: "The application draft service could not be reached. Reconnect and retry." }, 503);
  }
}

export async function GET(request: Request) {
  const applicationId = new URL(request.url).searchParams.get("application_id") ?? "";
  if (!UUID.test(applicationId)) {
    return respond({ ready: false, code: "APPLICATION_ID_INVALID", error: "A valid application reference is required." }, 400);
  }
  return callRpc(request, "get_candidate_application_draft", {
    p_application_id: applicationId
  });
}

export async function POST(request: Request) {
  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return respond({ ready: false, code, error: "The application draft request is invalid." }, status);
  }

  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)
    || typeof incoming.application_id !== "string" || !UUID.test(incoming.application_id)
    || !Number.isInteger(incoming.expected_version) || (incoming.expected_version as number) < 0
    || typeof incoming.idempotency_key !== "string"
    || !/^[A-Za-z0-9._:-]{8,160}$/.test(incoming.idempotency_key)
    || !incoming.answer_data || typeof incoming.answer_data !== "object" || Array.isArray(incoming.answer_data)) {
    return respond({ ready: false, code: "APPLICATION_DRAFT_INPUT_INVALID", error: "The application, version, idempotency key or answer data is invalid." }, 400);
  }

  return callRpc(request, "save_candidate_application_draft", {
    p_application_id: incoming.application_id,
    p_answer_data: incoming.answer_data,
    p_expected_version: incoming.expected_version,
    p_idempotency_key: incoming.idempotency_key
  });
}
