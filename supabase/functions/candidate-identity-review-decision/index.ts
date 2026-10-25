import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const allowedOrigins = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);

function originAllowed(origin: string): boolean {
  return allowedOrigins.has(origin)
    || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}

function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Vary": "Origin"
  };
  if (origin && originAllowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !originAllowed(origin)) return reply(403, { error: "Origin not allowed." }, null);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && originAllowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin"
      }
    });
  }
  if (req.method !== "POST") return reply(405, { error: "Method not allowed." }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reply(503, { error: "Identity review service is not configured." }, origin);
  }

  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "A signed-in reviewer session is required." }, origin);

  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) {
    return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return reply(400, { error: "Request body must be valid JSON." }, origin);
  }

  const requestId = typeof payload.request_id === "string" ? payload.request_id.trim() : "";
  const decision = typeof payload.decision === "string" ? payload.decision.trim().toUpperCase() : "";
  const candidateReference = typeof payload.candidate_reference === "string" ? payload.candidate_reference.trim() : null;
  const note = typeof payload.note === "string" ? payload.note.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return reply(400, { error: "A valid identity-review request ID is required." }, origin);
  }
  if (!["APPROVED", "REJECTED", "NEEDS_INFORMATION"].includes(decision)) {
    return reply(400, { error: "Choose APPROVED, REJECTED, or NEEDS_INFORMATION." }, origin);
  }
  if (decision === "APPROVED" && (!candidateReference || candidateReference.length < 2 || candidateReference.length > 120)) {
    return reply(400, { error: "An exact candidate reference (2–120 characters) is required for approval." }, origin);
  }
  if (note.length < 3 || note.length > 1200) {
    return reply(400, { error: "A review note of 3–1,200 characters is required." }, origin);
  }

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: grant, error: grantError } = await service
    .from("platform_reviewers")
    .select("auth_user_id")
    .eq("auth_user_id", authData.user.id)
    .eq("role_code", "IDENTITY_REVIEWER")
    .eq("is_active", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (grantError) {
    console.error("identity reviewer grant lookup failed", grantError.code ?? "unknown");
    return reply(503, { error: "Reviewer authorization could not be checked. No decision was made." }, origin);
  }
  if (!grant) return reply(403, { error: "This account is not authorised to make identity-review decisions." }, origin);

  const { data, error } = await service.rpc("decide_candidate_identity_review", {
    p_request_id: requestId,
    p_reviewer_auth_user_id: authData.user.id,
    p_decision: decision,
    p_candidate_reference: candidateReference,
    p_note: note
  });
  if (error || !data) {
    const code = error?.code ?? "";
    if (code === "42501") return reply(403, { error: "Identity-review authorization was denied." }, origin);
    if (code === "22023") return reply(400, { error: "The decision details are invalid." }, origin);
    if (code === "P0002") return reply(404, { error: "The request or exact active candidate reference was not found." }, origin);
    if (code === "23505" || code === "55000") return reply(409, { error: "The request or identity link conflicts with current state and needs manual review." }, origin);
    console.error("identity decision transaction failed", code || "unknown");
    return reply(503, { error: "The decision could not be saved. No success is claimed." }, origin);
  }

  return reply(200, {
    request_id: data.request_id,
    status: data.status,
    reviewed_at: data.reviewed_at,
    message: "The identity-review decision was recorded with an audit event."
  }, origin);
});
