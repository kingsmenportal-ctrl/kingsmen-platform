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
    "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "600", "Vary": "Origin"
  }});
  if (req.method !== "GET") return reply(405, { error: "Method not allowed." }, origin);
  if (!URL || !ANON || !SERVICE) return reply(503, { error: "Identity status service is not configured." }, origin);
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "Sign in to view your identity-review status." }, origin);
  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);
  const service = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: requests, error } = await service.from("candidate_identity_review_requests")
    .select("id,candidate_reference,request_status,claimant_message,candidate_response,reviewer_note,created_at,updated_at,reviewed_at")
    .eq("supabase_user_id", authData.user.id).order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("candidate identity status read failed", error.code ?? "unknown");
    return reply(503, { error: "Your identity-review status could not be loaded." }, origin);
  }
  const items = requests ?? [];
  const ids = items.map((item) => item.id);
  let evidenceByRequest: Record<string, unknown[]> = {};
  if (ids.length) {
    const { data: evidence, error: evidenceError } = await service.from("candidate_identity_review_evidence")
      .select("id,request_id,original_filename,mime_type,size_bytes,review_status,reviewer_note,uploaded_at,reviewed_at")
      .in("request_id", ids).eq("supabase_user_id", authData.user.id).order("uploaded_at", { ascending: false });
    if (evidenceError) {
      console.error("candidate identity evidence status read failed", evidenceError.code ?? "unknown");
      return reply(503, { error: "Evidence status could not be loaded." }, origin);
    }
    for (const item of evidence ?? []) (evidenceByRequest[item.request_id] ??= []).push(item);
  }
  return reply(200, { requests: items.map((item) => ({ ...item, evidence: evidenceByRequest[item.id] ?? [] })) }, origin);
});
