import { readLimitedJson } from "../../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function reply(body: unknown, status: number) {
  const payload = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : { error: "Invalid identity follow-up response." };
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return reply({ code: "AUTHENTICATION_REQUIRED", error: "Sign in before responding to a review request." }, 401);
  let payload: Record<string, unknown>;
  try { payload = await readLimitedJson(request, 4 * 1024) as Record<string, unknown>; }
  catch (error) { const code = error instanceof Error ? error.message : "INVALID_JSON"; return reply({ code, error: "Identity follow-up is invalid." }, code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400); }
  if (typeof payload.request_id !== "string" || typeof payload.response !== "string") return reply({ code: "FOLLOWUP_FIELDS_REQUIRED", error: "Request and response fields are required." }, 400);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return reply({ code: "NOT_CONFIGURED", error: "Identity follow-up is not configured." }, 503);
  try {
    const upstream = await fetch(`${url.replace(/\/+$/, "")}/functions/v1/candidate-identity-review-followup`, {
      method: "POST", headers: { apikey: anonKey, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: payload.request_id, response: payload.response }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000)
    });
    let data: unknown; try { data = JSON.parse(await upstream.text()); } catch { return reply({ code: "INVALID_UPSTREAM_RESPONSE", error: "Follow-up service returned an invalid response." }, 502); }
    return reply(data, upstream.status);
  } catch { return reply({ code: "IDENTITY_FOLLOWUP_UNAVAILABLE", error: "Follow-up service is temporarily unavailable." }, 503); }
}
