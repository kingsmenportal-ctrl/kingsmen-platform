import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  
  "https://6ad61ee1da20fa786856f07e--kingsmen-portal-staging.netlify.app",
  
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);

function response(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) return response(403, { error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin"
      }
    });
  }
  if (req.method !== "POST") return response(405, { error: "Method not allowed." }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return response(503, { error: "Identity review service is not configured." }, origin);
  }
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return response(401, { error: "A signed-in account is required." }, origin);

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(bearer[1]);
  if (authError || !authData.user) return response(401, { error: "Your session is invalid or expired. Sign in again." }, origin);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return response(400, { error: "Request body must be valid JSON." }, origin); }
  const candidateReference = typeof payload.candidate_reference === "string" ? payload.candidate_reference.trim() : "";
  const claimantName = typeof payload.claimant_name === "string" ? payload.claimant_name.trim() : "";
  const claimantMessage = typeof payload.claimant_message === "string" ? payload.claimant_message.trim() : "";
  if (candidateReference.length < 2 || candidateReference.length > 120) return response(400, { error: "Enter the existing Kingsmen candidate reference (2–120 characters)." }, origin);
  if (claimantName.length < 2 || claimantName.length > 160) return response(400, { error: "Enter your name (2–160 characters)." }, origin);
  if (claimantMessage.length > 1200) return response(400, { error: "The message must be 1,200 characters or fewer." }, origin);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: existing, error: lookupError } = await admin
    .from("candidate_identity_review_requests")
    .select("id,request_status")
    .eq("supabase_user_id", authData.user.id)
    .eq("candidate_reference", candidateReference)
    .in("request_status", ["PENDING", "NEEDS_INFORMATION"])
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("identity-review lookup failed", lookupError.code ?? "unknown");
    return response(503, { error: "Could not check for an existing request. Try again later." }, origin);
  }
  if (existing) return response(409, { error: "You already have an open review request for this candidate reference.", request_id: existing.id, status: existing.request_status }, origin);

  const { data: created, error: insertError } = await admin
    .from("candidate_identity_review_requests")
    .insert({
      supabase_user_id: authData.user.id,
      candidate_reference: candidateReference,
      claimant_name: claimantName,
      claimant_message: claimantMessage,
      candidate_response: "",
      request_status: "PENDING"
    })
    .select("id,request_status,created_at")
    .single();
  if (insertError || !created) {
    console.error("identity-review insert failed", insertError?.code ?? "unknown");
    return response(503, { error: "Your review request could not be saved. Try again later." }, origin);
  }
  return response(201, {
    request_id: created.id,
    status: created.request_status,
    created_at: created.created_at,
    message: "Your request was received for manual review. This does not verify identity or link a candidate record."
  }, origin);
});
