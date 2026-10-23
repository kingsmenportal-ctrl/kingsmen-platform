import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);
function originAllowed(origin: string): boolean {
  return allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}
function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Pragma": "no-cache", "Vary": "Origin" };
  if (origin && originAllowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !originAllowed(origin)) return reply(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    ...(origin && originAllowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", "Vary": "Origin"
  }});
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." }, origin);
  if (!URL || !ANON || !SERVICE) return reply(503, { error: "Identity review service is not configured." }, origin);
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "A signed-in account is required." }, origin);
  const auth = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);
  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return reply(400, { error: "Request body must be valid JSON." }, origin); }
  const candidateReference = typeof payload.candidate_reference === "string" ? payload.candidate_reference.trim() : "";
  const claimantName = typeof payload.claimant_name === "string" ? payload.claimant_name.trim() : "";
  const claimantMessage = typeof payload.claimant_message === "string" ? payload.claimant_message.trim() : "";
  if (candidateReference.length < 2 || candidateReference.length > 120) return reply(400, { error: "Enter the existing Kingsmen candidate reference (2–120 characters)." }, origin);
  if (claimantName.length < 2 || claimantName.length > 160) return reply(400, { error: "Enter your name (2–160 characters)." }, origin);
  if (claimantMessage.length < 3 || claimantMessage.length > 1200) return reply(400, { error: "Enter a message of 3–1,200 characters." }, origin);
  const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc("submit_candidate_identity_review_for_user", {
    p_supabase_user_id: authData.user.id, p_candidate_reference: candidateReference,
    p_claimant_name: claimantName, p_claimant_message: claimantMessage
  });
  if (error || !data) {
    const code = error?.code ?? "";
    if (code === "23505") return reply(409, { code: "IDENTITY_REVIEW_ALREADY_OPEN", error: "This account already has an open identity review request." }, origin);
    if (code === "22023") return reply(400, { error: "One or more identity review fields are invalid." }, origin);
    if (code === "42501") return reply(401, { error: "Authentication could not be verified for this submission." }, origin);
    console.error("identity-review transactional submission failed", code || "unknown");
    return reply(503, { error: "Your request could not be saved. Please retry shortly." }, origin);
  }
  return reply(201, { request_id: data.request_id, status: data.status, message: "Your request was received for manual review. This does not verify identity or link a candidate record." }, origin);
});
