import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DEFAULT_ORIGINS = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);

function isAllowedOrigin(origin: string): boolean {
  if (DEFAULT_ORIGINS.has(origin)) return true;
  const configured = (Deno.env.get("KINGSMEN_PORTAL_ORIGINS") ?? "")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  return /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
}

function reply(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin"
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) {
    return reply(403, { status: "FORBIDDEN", reason: "ORIGIN_NOT_ALLOWED" }, null);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "600",
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache",
      "Vary": "Origin"
    }});
  }
  if (req.method !== "GET") {
    return reply(405, { status: "METHOD_NOT_ALLOWED", reason: "GET_REQUIRED" }, origin);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reply(503, { status: "CONFIGURATION_ERROR" }, origin);
  }
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401, { status: "UNAUTHENTICATED" }, origin);

  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: authError } = await auth.auth.getUser(token);
  if (authError || !userData.user) {
    return reply(401, { status: "UNAUTHENTICATED" }, origin);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: reviewer, error: reviewerError } = await admin
    .from("platform_reviewers")
    .select("role_code")
    .eq("auth_user_id", userData.user.id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .in("role_code", ["PLATFORM_ADMIN", "PROVIDER_OPERATOR", "APPLICATION_REVIEWER", "EVIDENCE_VERIFIER"])
    .limit(1)
    .maybeSingle();
  if (reviewerError) {
    console.error("N15 review queue reviewer lookup failed", reviewerError.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", reason: "REVIEWER_LOOKUP_FAILED" }, origin);
  }
  if (!reviewer) {
    return reply(403, {
      status: "FORBIDDEN",
      reason: "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED",
      message: "An active, authorised opportunity reviewer is required to inspect source observations."
    }, origin);
  }

  const { data: observations, error: observationsError } = await admin
    .from("external_source_observations")
    .select("observation_ref,authority_ref,source_url,source_title,sector,observed_claim,source_confidence,observation_status,observed_at,last_checked_at,stale_after,evidence_refs,review_reason")
    .in("observation_status", ["NEEDS_REVIEW", "STALE"])
    .order("observed_at", { ascending: false })
    .limit(150);
  if (observationsError) {
    console.error("N15 review queue observations query failed", observationsError.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", reason: "OBSERVATION_QUEUE_UNAVAILABLE" }, origin);
  }

  const authorityRefs = [...new Set((observations ?? [])
    .map(item => item.authority_ref)
    .filter((value): value is string => typeof value === "string" && value.length > 0))];
  let authorities: Record<string, unknown>[] = [];
  if (authorityRefs.length > 0) {
    const { data, error } = await admin
      .from("opportunity_source_authorities")
      .select("authority_ref,authority_name,authority_type,base_url,sector_scope,active,confidence_band")
      .in("authority_ref", authorityRefs);
    if (error) {
      console.error("N15 review queue authority lookup failed", error.code ?? "unknown");
      return reply(503, { status: "DATABASE_ERROR", reason: "AUTHORITY_LOOKUP_FAILED" }, origin);
    }
    authorities = (data ?? []) as Record<string, unknown>[];
  }
  const authorityByRef = new Map(authorities.map(item => [String(item.authority_ref), item]));
  const enrichedObservations = (observations ?? []).map(item => ({
    ...item,
    authority: item.authority_ref ? authorityByRef.get(item.authority_ref) ?? null : null
  }));

  const { data: recentReviews, error: reviewError } = await admin
    .from("opportunity_verification_reviews")
    .select("review_ref,target_type,target_ref,review_status,source_confidence_before,source_confidence_after,review_reason,decision_notes,evidence_refs,created_at,reviewed_at")
    .eq("target_type", "SOURCE")
    .order("created_at", { ascending: false })
    .limit(50);
  if (reviewError) {
    console.error("N15 review queue review history query failed", reviewError.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", reason: "REVIEW_HISTORY_UNAVAILABLE" }, origin);
  }

  const { data: recentRuns, error: runsError } = await admin
    .from("n15_ingestion_runs")
    .select("run_ref,status,sources_checked,sources_succeeded,observations_created,observations_updated,observations_skipped,started_at,finished_at")
    .order("started_at", { ascending: false })
    .limit(10);
  if (runsError) {
    console.error("N15 review queue run history query failed", runsError.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", reason: "INGESTION_HISTORY_UNAVAILABLE" }, origin);
  }

  return reply(200, {
    status: "OK",
    mode: "READ_ONLY_REVIEW_QUEUE",
    count: enrichedObservations.length,
    observations: enrichedObservations,
    recent_reviews: recentReviews ?? [],
    recent_runs: recentRuns ?? [],
    safety: {
      observation_status_is_not_programme_open_status: true,
      review_queue_writes_disabled: true,
      programme_deadline_eligibility_and_fee_records_not_created: true,
      candidate_facing_opportunities_published: 0,
      reviewer_authorization_required: true
    }
  }, origin);
});
