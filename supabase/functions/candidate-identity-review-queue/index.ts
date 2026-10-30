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
  return allowedOrigins.has(origin) ||
    /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
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
    return new Response(null, { status: 204, headers: {
      ...(origin && originAllowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    }});
  }
  if (req.method !== "GET") return reply(405, { error: "Method not allowed." }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reply(503, { error: "Identity review service is not configured." }, origin);
  }
  const bearer = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!bearer) return reply(401, { error: "A signed-in reviewer session is required." }, origin);

  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: authData, error: authError } = await auth.auth.getUser(bearer[1]);
  if (authError || !authData.user) return reply(401, { error: "Your session is invalid or expired. Sign in again." }, origin);

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
    console.error("identity reviewer queue grant lookup failed", grantError.code ?? "unknown");
    return reply(503, { error: "Reviewer authorization could not be checked." }, origin);
  }
  if (!grant) return reply(403, { error: "This account is not authorised to inspect identity-review requests." }, origin);

  const { data, error } = await service
    .from("candidate_identity_review_requests")
    .select("id,candidate_reference,claimant_name,claimant_message,request_status,created_at,candidate_response")
    .in("request_status", ["PENDING", "NEEDS_INFORMATION"])
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("identity reviewer queue read failed", error.code ?? "unknown");
    return reply(503, { error: "The review queue could not be loaded." }, origin);
  }

  const requests = data ?? [];
  const requestIds = requests.map((item) => item.id);
  let evidenceByRequest: Record<string, unknown[]> = {};
  if (requestIds.length > 0) {
    const { data: evidenceRows, error: evidenceError } = await service
      .from("candidate_identity_review_evidence")
      .select("id,request_id,original_filename,mime_type,size_bytes,sha256_hex,review_status,reviewed_at,reviewed_by,reviewer_note,uploaded_at")
      .in("request_id", requestIds)
      .order("uploaded_at", { ascending: true });
    if (evidenceError) {
      console.error("identity reviewer evidence list failed", evidenceError.code ?? "unknown");
      return reply(503, { error: "Supporting evidence could not be loaded. No review decision should be made." }, origin);
    }
    for (const row of evidenceRows ?? []) {
      (evidenceByRequest[row.request_id] ??= []).push({
        id: row.id,
        original_filename: row.original_filename,
        mime_type: row.mime_type,
        size_bytes: row.size_bytes,
        sha256_hex: row.sha256_hex,
        review_status: row.review_status,
        reviewed_at: row.reviewed_at,
        reviewed_by: row.reviewed_by,
        reviewer_note: row.reviewer_note,
        uploaded_at: row.uploaded_at
      });
    }
  }
  return reply(200, {
    requests: requests.map((item) => ({ ...item, evidence: evidenceByRequest[item.id] ?? [] })),
    count: requests.length,
    limit: 100,
    evidence_boundary: "Private evidence files are listed with integrity hashes and reviewer status. Open each file through the reviewer-only signed-read endpoint and record an evidence decision before approving identity."
  }, origin);
});
