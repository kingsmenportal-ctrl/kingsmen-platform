import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BODY_LIMIT = 20 * 1024;
const TIMEOUT_MS = 15_000;
const ALLOWED_ACTIONS = new Set(["load", "save", "revoke_consent"]);

function respond(payload: unknown, status: number) {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "Invalid profile service response." };
  return Response.json(safe, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return respond({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to access your saved profile." }, 401);
  let payload: Record<string, unknown>;
  try {
    payload = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>;
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    return respond({ ok: false, code, error: "The profile request is invalid." }, code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400);
  }
  if (typeof payload.action !== "string" || !ALLOWED_ACTIONS.has(payload.action)) return respond({ ok: false, code: "ACTION_NOT_SUPPORTED", error: "Choose load, save or revoke_consent." }, 400);
  if (payload.action === "save" && payload.consentAccepted !== true) return respond({ ok: false, code: "CONSENT_REQUIRED", error: "Consent is required before saving profile changes." }, 400);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return respond({ ok: false, code: "NOT_CONFIGURED", error: "Candidate profile persistence is not configured for this deployment." }, 503);
  const outgoing: Record<string, unknown> = { action: payload.action };
  if (payload.action === "save") {
    outgoing.profile = payload.profile;
    outgoing.pathwayPreferences = payload.pathwayPreferences;
    outgoing.consentAccepted = true;
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${url.replace(/\/+$/, "")}/functions/v1/candidate-master-profile`, {
      method: "POST", headers: { apikey: anonKey, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify(outgoing), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch {
    return respond({ ok: false, code: "PROFILE_SERVICE_UNAVAILABLE", error: "Profile service is temporarily unavailable." }, 503);
  }
  let body: unknown;
  try {
    const raw = await upstream.text();
    if (raw.length > 64 * 1024) return respond({ ok: false, code: "UPSTREAM_RESPONSE_TOO_LARGE", error: "Profile service response was too large." }, 502);
    body = JSON.parse(raw);
  } catch {
    return respond({ ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "Profile service returned an invalid response." }, 502);
  }
  return respond(body, upstream.status);
}
