import { readLimitedJson } from "../../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(payload: unknown, status: number) {
  const safe = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { ok: false, code: "INVALID_UPSTREAM_RESPONSE", error: "The opportunity service returned an invalid response." };
  return Response.json(safe, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache", Vary: "Authorization" } });
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return respond({ ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in before saving an opportunity." }, 401);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return respond({ ok: false, code: "NOT_CONFIGURED", error: "Opportunity saving is not configured for this deployment." }, 503);
  let incoming: Record<string, unknown>;
  try { incoming = await readLimitedJson(request, 8 * 1024) as Record<string, unknown>; }
  catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    return respond({ ok: false, code, error: "The save request is invalid." }, code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400);
  }
  if (incoming.action !== "save" || typeof incoming.match_ref !== "string" || incoming.match_ref.length < 1 || incoming.match_ref.length > 160) {
    return respond({ ok: false, code: "MATCH_REFERENCE_REQUIRED", error: "A valid approved N15 match reference is required." }, 400);
  }
  if (incoming.pathway_type !== undefined && (typeof incoming.pathway_type !== "string" || !["HIGHER_EDUCATION","TVET","SETA_LEARNERSHIP","INTERNSHIP","APPRENTICESHIP","EMPLOYMENT"].includes(incoming.pathway_type))) {
    return respond({ ok: false, code: "PATHWAY_INVALID", error: "Choose a supported pathway." }, 400);
  }
  let url: URL;
  try {
    url = new URL(baseUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("protocol");
  } catch { return respond({ ok: false, code: "CONFIGURATION_INVALID", error: "The opportunity service configuration is invalid." }, 503); }
  try {
    const upstream = await fetch(`${url.toString().replace(/\/+$/, "")}/functions/v1/candidate-save-verified-opportunity`, {
      method: "POST", headers: { apikey: anonKey, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", match_ref: incoming.match_ref, ...(typeof incoming.pathway_type === "string" ? { pathway_type: incoming.pathway_type } : {}) }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000)
    });
    let body: unknown;
    try { const raw = await upstream.text(); if (raw.length > 128 * 1024) return respond({ ok: false, code: "UPSTREAM_RESPONSE_TOO_LARGE" }, 502); body = JSON.parse(raw); }
    catch { return respond({ ok: false, code: "INVALID_UPSTREAM_RESPONSE" }, 502); }
    return respond(body, upstream.status);
  } catch {
    return respond({ ok: false, code: "OPPORTUNITY_SAVE_UNAVAILABLE", error: "The opportunity could not be saved. Reload your tracker before retrying." }, 503);
  }
}
