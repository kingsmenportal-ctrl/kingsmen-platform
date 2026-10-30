import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 16 * 1024;
const TIMEOUT_MS = 15_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(payload: unknown, status: number) {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The CAO choices service returned an invalid response." };
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

async function callRpc(request: Request, functionName: string, args: Record<string, unknown>) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return respond({ ready: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before accessing CAO choices." }, 401);
  }
  const config = configuration();
  if (!config) {
    return respond({ ready: false, code: "NOT_CONFIGURED", error: "CAO choice storage is not configured for this deployment." }, 503);
  }

  try {
    const upstream = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
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
      if (raw.length > 128 * 1024) return respond({ ready: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502);
      body = JSON.parse(raw);
    } catch {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The CAO choice service returned an invalid response." }, 502);
    }
    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) {
        return respond({ ready: false, code: "IDENTITY_OR_PARENT_NOT_AUTHORIZED", error: "An authorised candidate identity and an eligible owned CAO draft are required." }, upstream.status);
      }
      return respond({
        ready: false,
        code: "CAO_CHOICES_REJECTED",
        error: upstream.status >= 500
          ? "The CAO choice service is temporarily unavailable."
          : "The CAO choice request was rejected. Check the parent draft and choice values."
      }, upstream.status >= 500 ? 503 : 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ ready: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502);
    }
    const result = body as Record<string, unknown>;
    if (result.ok !== true) {
      return respond({ ready: false, code: "CAO_CHOICES_REJECTED", error: "The CAO choice operation was not accepted." }, 400);
    }
    return respond({ ready: true, ...result }, 200);
  } catch {
    return respond({ ready: false, code: "CAO_CHOICES_UNAVAILABLE", error: "CAO choices could not be loaded or saved. Retry after reconnecting." }, 503);
  }
}

export async function GET(request: Request) {
  const applicationId = new URL(request.url).searchParams.get("application_id");
  if (applicationId && !UUID.test(applicationId)) {
    return respond({ ready: false, code: "APPLICATION_ID_INVALID", error: "Select a valid CAO parent application." }, 400);
  }
  return applicationId
    ? callRpc(request, "get_candidate_cao_choices", { p_application_id: applicationId })
    : callRpc(request, "list_candidate_cao_parents", {});
}

export async function POST(request: Request) {
  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return respond({ ready: false, code, error: "The CAO choice request is invalid." }, status);
  }
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming) || incoming.action !== "save" || typeof incoming.application_id !== "string" || !UUID.test(incoming.application_id)) {
    return respond({ ready: false, code: "CAO_PARENT_REQUIRED", error: "Select an eligible CAO parent application before saving its choices." }, 400);
  }
  if (!Array.isArray(incoming.choices) || incoming.choices.length > 6) {
    return respond({ ready: false, code: "CAO_CHOICES_LIMIT", error: "Save between zero and six ordered programme choices." }, 400);
  }
  return callRpc(request, "save_candidate_cao_choices", {
    p_application_id: incoming.application_id,
    p_choices: incoming.choices
  });
}
