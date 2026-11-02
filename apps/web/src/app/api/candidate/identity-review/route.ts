import { readLimitedJson } from "../../../../lib/read-limited-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BODY_LIMIT = 8 * 1024;
const TIMEOUT_MS = 15_000;
function response(body: unknown, status: number) {
  const payload = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : { error: "Invalid identity-review response." };
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
}
function config() {
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
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return response({ code: "AUTHENTICATION_REQUIRED", error: "Sign in to view identity-review status." }, 401);
  const c = config();
  if (!c) return response({ code: "NOT_CONFIGURED", error: "Identity-review status is not configured." }, 503);
  let upstream: Response;
  try {
    upstream = await fetch(`${c.url}/functions/v1/candidate-identity-review-status`, {
      method: "GET", headers: { apikey: c.anonKey, Authorization: authorization },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch { return response({ code: "IDENTITY_STATUS_UNAVAILABLE", error: "Identity-review status is temporarily unavailable." }, 503); }
  let data: unknown;
  try { data = JSON.parse(await upstream.text()); } catch { return response({ code: "INVALID_UPSTREAM_RESPONSE", error: "Identity-review status returned an invalid response." }, 502); }
  return response(data, upstream.status);
}
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return response({ code: "AUTHENTICATION_REQUIRED", error: "Sign in before requesting identity review." }, 401);
  let input: Record<string, unknown>;
  try { input = await readLimitedJson(request, BODY_LIMIT) as Record<string, unknown>; }
  catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_JSON";
    return response({ code, error: "Identity-review request is invalid." }, code === "REQUEST_TOO_LARGE" ? 413 : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400);
  }
  const candidate_reference = input.candidate_reference;
  const claimant_name = input.claimant_name;
  const claimant_message = input.claimant_message;
  if (typeof candidate_reference !== "string" || typeof claimant_name !== "string" || typeof claimant_message !== "string") {
    return response({ code: "IDENTITY_REVIEW_FIELDS_REQUIRED", error: "Candidate reference, name and message are required." }, 400);
  }
  const c = config();
  if (!c) return response({ code: "NOT_CONFIGURED", error: "Identity-review submission is not configured." }, 503);
  let upstream: Response;
  try {
    upstream = await fetch(`${c.url}/functions/v1/candidate-identity-review-request`, {
      method: "POST", headers: { apikey: c.anonKey, Authorization: authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_reference, claimant_name, claimant_message }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch { return response({ code: "IDENTITY_REQUEST_UNAVAILABLE", error: "Identity-review submission is temporarily unavailable." }, 503); }
  let data: unknown;
  try { data = JSON.parse(await upstream.text()); } catch { return response({ code: "INVALID_UPSTREAM_RESPONSE", error: "Identity-review submission returned an invalid response." }, 502); }
  return response(data, upstream.status);
}
