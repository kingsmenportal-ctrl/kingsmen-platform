import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const origins = new Set(["https://kingsmen-portal-staging.netlify.app", "http://localhost:8888", "http://127.0.0.1:8888"]);
function allowed(origin: string) { return origins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin); }
function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Pragma": "no-cache", "Vary": "Origin" };
  if (origin && allowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowed(origin)) return reply(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    ...(origin && allowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", "Vary": "Origin"
  }});
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." }, origin);
  if (!URL || !ANON || !SERVICE) return reply(503, { error: "Identity follow-up service is not configured." }, origin);
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "Sign in before responding to an identity-review request." }, origin);
  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: "Request body must be valid JSON." }, origin); }
  const requestId = typeof body.request_id === "string" ? body.request_id.trim() : "";
  const responseText = typeof body.response === "string" ? body.response.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) return reply(400, { error: "A valid request ID is required." }, origin);
  if (responseText.length < 3 || responseText.length > 1200) return reply(400, { error: "Your response must be 3–1,200 characters." }, origin);
  const service = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await service.rpc("submit_candidate_identity_review_followup", {
    p_request_id: requestId, p_candidate_auth_user_id: authData.user.id, p_response: responseText
  });
  if (error || !data) {
    const code = error?.code ?? "";
    if (code === "P0002") return reply(404, { error: "That request was not found for this signed-in account." }, origin);
    if (code === "55000") return reply(409, { error: "This request is not awaiting a candidate response. Refresh its current status." }, origin);
    if (code === "22023") return reply(400, { error: "The response details are invalid." }, origin);
    console.error("candidate identity follow-up failed", code || "unknown");
    return reply(503, { error: "Your response could not be saved. No success is claimed." }, origin);
  }
  return reply(200, { request_id: data.request_id, status: data.status, updated_at: data.updated_at, message: "Your response was saved and the request returned to the reviewer queue." }, origin);
});
