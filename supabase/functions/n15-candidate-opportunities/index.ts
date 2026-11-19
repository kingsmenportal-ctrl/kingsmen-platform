import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const AUTH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "600",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return json({ status: "FORBIDDEN", reason: "ORIGIN_NOT_ALLOWED" }, 403, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "GET") return json({ status: "METHOD_NOT_ALLOWED" }, 405, origin);
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ status: "UNAUTHENTICATED" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ status: "CONFIGURATION_ERROR" }, 500, origin);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) return json({ status: "UNAUTHENTICATED" }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: link, error: linkError } = await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by").eq("supabase_user_id", userData.user.id).maybeSingle();
  if (linkError) return json({ status: "DATABASE_ERROR", reason: "IDENTITY_LINK_LOOKUP_FAILED" }, 500, origin);
  const verifiedAt = Date.parse(link?.verified_at ?? "");
  if (!link || link.link_status !== "VERIFIED" || !Number.isFinite(verifiedAt) ||
      verifiedAt > Date.now() || typeof link.verified_by !== "string" || !AUTH_UUID.test(link.verified_by)) {
    return json({ status: "IDENTITY_REVIEW_REQUIRED", message: "Your Kingsmen identity must have an authorised, valid verification record before personalised matching can be shown." }, 403, origin);
  }

  const candidateRef = String(link.candidate_id);
  const { data: matches, error: matchError } = await admin.from("candidate_opportunity_matches")
    .select("candidate_match_ref,programme_ref,provider_ref,sector,match_score,source_confidence,recommendation_summary,evidence_refs,created_at")
    .eq("candidate_ref", candidateRef).eq("match_status", "APPROVED")
    .eq("source_confidence", "OFFICIAL_VERIFIED")
    .eq("human_review_required", false).eq("sealed_exact_target", false)
    .order("match_score", { ascending: false }).limit(100);
  if (matchError) return json({ status: "DATABASE_ERROR", reason: "MATCH_LOOKUP_FAILED" }, 500, origin);

  const now = new Date();
  const pathwayMap: Record<string, string[]> = {
    UNIVERSITY: ["HIGHER_EDUCATION"], CAO: ["HIGHER_EDUCATION"], TVET: ["TVET"],
    SETA: ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"], LEARNERSHIP: ["SETA_LEARNERSHIPS"],
    INTERNSHIP: ["INTERNSHIPS"], APPRENTICESHIP: ["APPRENTICESHIPS"], EMPLOYER: ["EMPLOYMENT"],
    BURSARY: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS"],
    NSFAS: ["HIGHER_EDUCATION", "TVET"], QCTO: ["SETA_LEARNERSHIPS", "APPRENTICESHIPS"],
    ACCOMMODATION: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS", "INTERNSHIPS", "APPRENTICESHIPS", "EMPLOYMENT"],
    PRIVATE_COLLEGE: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIPS"]
  };
  const cutoff = new Date(now.getTime() - 24 * 3600_000).toISOString();
  const results = [];
  for (const match of matches ?? []) {
    if (!match.programme_ref || !match.provider_ref) continue;
    const { data: programme } = await admin.from("opportunity_programmes").select("*")
      .eq("programme_ref", match.programme_ref).maybeSingle();
    const { data: provider } = await admin.from("opportunity_providers").select("*")
      .eq("provider_ref", match.provider_ref).maybeSingle();
    if (!programme || !provider) continue;
    if (programme.opening_status !== "OPEN" || programme.candidate_facing_safe !== true) continue;
    if (programme.source_confidence !== "OFFICIAL_VERIFIED" || provider.source_confidence !== "OFFICIAL_VERIFIED") continue;
    if (provider.safe_to_recommend !== true || provider.accreditation_status === "REJECTED") continue;
    if (!Array.isArray(programme.evidence_refs) || !programme.evidence_refs.length ||
        !Array.isArray(provider.evidence_refs) || !provider.evidence_refs.length) continue;
    const { data: observations } = await admin.from("external_source_observations")
      .select("observation_ref,source_url,source_title,observed_at,last_checked_at,stale_after,evidence_refs")
      .eq("observation_status", "VERIFIED").eq("source_confidence", "OFFICIAL_VERIFIED")
      .eq("source_url", programme.exact_link).gte("last_checked_at", cutoff)
      .gt("stale_after", now.toISOString()).limit(1);
    if (!observations?.length) continue;
    const { data: deadlines } = await admin.from("opportunity_deadlines")
      .select("deadline_ref,opens_at,closes_at,deadline_status,evidence_refs,timezone")
      .eq("programme_ref", programme.programme_ref).eq("deadline_status", "CONFIRMED")
      .gt("closes_at", now.toISOString()).order("closes_at", { ascending: true }).limit(1);
    const deadline = deadlines?.[0] ?? null;
    if (deadline && (!Array.isArray(deadline.evidence_refs) || !deadline.evidence_refs.length)) continue;
    results.push({
      match_ref: match.candidate_match_ref,
      title: programme.programme_name,
      provider: provider.provider_name,
      sector: match.sector,
      pathways: pathwayMap[match.sector] ?? [],
      location: programme.location_text ?? null,
      official_link: programme.exact_link,
      match_score: match.match_score,
      source_checked_at: observations[0].last_checked_at,
      source_evidence: observations[0].evidence_refs,
      deadline: deadline ? { closes_at: deadline.closes_at, timezone: deadline.timezone, evidence: deadline.evidence_refs } : { status: "NOT_VERIFIED", message: "No current confirmed deadline is available; check the official page." },
      eligibility: { status: "REQUIRES_CANDIDATE_REVIEW", rules: "Only separately evidenced and reviewed eligibility rules may be used." },
      recommendation_summary: match.recommendation_summary
    });
  }
  return json({
    status: "OK",
    candidate_id: candidateRef,
    count: results.length,
    opportunities: results,
    safety: {
      only_authorised_identity: true,
      requires_approved_human_reviewed_match: true,
      requires_fresh_official_source_evidence: true,
      no_stale_or_unverified_opportunities: true,
      no_eligibility_guarantee: true,
      candidate_submission_is_not_provider_confirmation: true
    },
    empty_reason: results.length ? null : "No opportunities currently satisfy every publication, identity, human-review, official-source and freshness gate. This is not proof that no opportunities exist."
  }, 200, origin);
});
