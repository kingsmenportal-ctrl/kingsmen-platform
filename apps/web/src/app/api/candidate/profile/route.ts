import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BODY_LIMIT = 20 * 1024;
const TIMEOUT_MS = 15_000;
const ACTIONS = new Set(["load", "save", "revoke_consent", "request_correction"]);

function response(payload: unknown, status: number) {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The profile service returned an invalid response." };
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
  } catch { return null; }
}

export async function GET(request: Request) {
  return dispatch(request, { action: "load" });
}

export async function POST(request: Request) {
  let incoming: Record<string, unknown>;
  try {
    incoming = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    const status = code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return response({ ok: false, code, error: "The profile request is invalid." }, status);
  }
  return dispatch(request, incoming);
}

async function dispatch(request: Request, incoming: Record<string, unknown>) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return response({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to access your saved profile." }, 401);
  }
  const config = configuration();
  if (!config) return response({ ok: false, code: "NOT_CONFIGURED", error: "Candidate profile persistence is not configured for this deployment." }, 503);

  const action = incoming.action;
  if (typeof action !== "string" || !ACTIONS.has(action)) {
    return response({ ok: false, code: "ACTION_NOT_SUPPORTED", error: "Use load, save, revoke_consent or request_correction." }, 400);
  }
  if (action === "save") {
    if (incoming.consentAccepted !== true) {
      return response({ ok: false, code: "CONSENT_REQUIRED", error: "Confirm the profile-processing consent before saving." }, 400);
    }
    if (!incoming.profile || typeof incoming.profile !== "object" || Array.isArray(incoming.profile)) {
      return response({ ok: false, code: "PROFILE_INVALID", error: "A profile object is required." }, 400);
    }
    if (!Array.isArray(incoming.pathwayPreferences)) {
      return response({ ok: false, code: "PATHWAYS_INVALID", error: "Select zero or more supported pathways." }, 400);
    }
  }
  if (action === "request_correction") {
    for (const key of ["fieldName", "requestedValue", "reason"]) {
      if (typeof incoming[key] !== "string") return response({ ok: false, code: "CORRECTION_INPUT_INVALID", error: "A field, requested value and reason are required." }, 400);
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${config.url}/functions/v1/candidate-master-profile`, {
      method: "POST",
      headers: { apikey: config.anonKey, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(incoming),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch {
    return response({ ok: false, code: "PROFILE_SERVICE_UNAVAILABLE", error: "The profile service is temporarily unavailable. Your changes have not been confirmed as saved." }, 503);
  }

  let body: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > 128 * 1024) return response({ ok: false, code: "UPSTREAM_RESPONSE_TOO_LARGE", error: "The profile response was too large." }, 502);
    body = JSON.parse(raw);
  } catch {
    return response({ ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The profile service returned an invalid response." }, 502);
  }
  return response(body, upstream.status);
}
