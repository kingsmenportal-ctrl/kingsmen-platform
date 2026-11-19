import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const AUTH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORIGINS = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);
const PATHWAYS = new Set([
  "HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP",
  "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT"
]);
const SECTOR_PATHWAYS: Record<string, string[]> = {
  UNIVERSITY: ["HIGHER_EDUCATION"],
  CAO: ["HIGHER_EDUCATION"],
  TVET: ["TVET"],
  SETA: ["SETA_LEARNERSHIP", "APPRENTICESHIP"],
  LEARNERSHIP: ["SETA_LEARNERSHIP"],
  INTERNSHIP: ["INTERNSHIP"],
  APPRENTICESHIP: ["APPRENTICESHIP"],
  EMPLOYER: ["EMPLOYMENT"],
  BURSARY: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP", "INTERNSHIP", "APPRENTICESHIP"],
  NSFAS: ["HIGHER_EDUCATION", "TVET"],
  QCTO: ["SETA_LEARNERSHIP", "APPRENTICESHIP"],
  ACCOMMODATION: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP", "INTERNSHIP", "APPRENTICESHIP", "EMPLOYMENT"],
  PRIVATE_COLLEGE: ["HIGHER_EDUCATION", "TVET", "SETA_LEARNERSHIP"]
};

type Candidate = { id: string; public_ref: string; display_name: string };
type Target = {
  id: string;
  target_key: string;
  pathway_type: string;
  provider_name: string;
  programme_or_role: string;
  planning_status: string;
  source_confidence: string;
  application_id: string | null;
  created_at: string;
  updated_at: string;
};

function evidenceList(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function isAllowedOrigin(origin: string): boolean {
  if (ORIGINS.has(origin)) return true;
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
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function pathwayCompatible(sector: unknown, pathway: string): boolean {
  return typeof sector === "string" &&
    (SECTOR_PATHWAYS[sector] ?? []).includes(pathway);
}

async function resolveVerifiedCandidate(admin: ReturnType<typeof createClient<any>>, userId: string) {
  const { data: link, error: linkError } = await admin
    .from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by")
    .eq("supabase_user_id", userId)
    .maybeSingle();
  if (linkError) throw new Error("IDENTITY_LOOKUP_FAILED");
  if (!link) {
    return { candidate: null as Candidate | null, code: "PROFILE_SETUP_REQUIRED" };
  }
  const verifiedAt = Date.parse(link.verified_at ?? "");
  if (link.link_status !== "VERIFIED" ||
      !Number.isFinite(verifiedAt) ||
      verifiedAt > Date.now() ||
      typeof link.verified_by !== "string" ||
      !AUTH_UUID.test(link.verified_by)) {
    return { candidate: null as Candidate | null, code: "IDENTITY_REVIEW_REQUIRED" };
  }
  const { data: candidate, error: candidateError } = await admin
    .from("candidates")
    .select("id,public_ref,display_name")
    .eq("id", link.candidate_id)
    .maybeSingle();
  if (candidateError) throw new Error("CANDIDATE_LOOKUP_FAILED");
  if (!candidate) return { candidate: null as Candidate | null, code: "CANDIDATE_NOT_FOUND" };
  return { candidate: candidate as Candidate, code: null as string | null };
}

async function hasActiveConsent(admin: ReturnType<typeof createClient<any>>, publicRef: string): Promise<boolean> {
  const { data: consent, error } = await admin
    .from("privacy_consent_records")
    .select("consent_status,revoked_at,consent_text_snapshot,granted_at")
    .eq("candidate_ref", publicRef)
    .eq("consent_type", "PROFILE_PROCESSING")
    .order("granted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("CONSENT_LOOKUP_FAILED");
  if (!consent) return false;
  const grantedAt = Date.parse(consent.granted_at ?? "");
  return consent.consent_status === "ACTIVE" &&
    consent.revoked_at == null &&
    typeof consent.consent_text_snapshot === "string" &&
    consent.consent_text_snapshot.trim().length > 0 &&
    Number.isFinite(grantedAt) &&
    grantedAt <= Date.now();
}

async function verifyOpportunityMatch(
  admin: ReturnType<typeof createClient<any>>,
  candidateId: string,
  matchRef: string,
  pathwayType: string
) {
  const { data: match, error: matchError } = await admin
    .from("candidate_opportunity_matches")
    .select("candidate_match_ref,candidate_ref,programme_ref,provider_ref,sector,match_status,source_confidence,human_review_required,sealed_exact_target,evidence_refs")
    .eq("candidate_match_ref", matchRef)
    .eq("candidate_ref", candidateId)
    .maybeSingle();
  if (matchError) throw new Error("MATCH_LOOKUP_FAILED");
  if (!match ||
      match.match_status !== "APPROVED" ||
      match.source_confidence !== "OFFICIAL_VERIFIED" ||
      match.human_review_required !== false ||
      match.sealed_exact_target !== false ||
      !evidenceList(match.evidence_refs) ||
      !match.programme_ref ||
      !match.provider_ref ||
      !pathwayCompatible(match.sector, pathwayType)) {
    return { ok: false as const, code: "VERIFIED_MATCH_NOT_AVAILABLE" };
  }

  const { data: programme, error: programmeError } = await admin
    .from("opportunity_programmes")
    .select("programme_ref,provider_ref,programme_name,sector,location_text,opening_status,source_confidence,candidate_facing_safe,exact_link,evidence_refs")
    .eq("programme_ref", match.programme_ref)
    .eq("provider_ref", match.provider_ref)
    .maybeSingle();
  if (programmeError) throw new Error("PROGRAMME_LOOKUP_FAILED");
  if (!programme ||
      programme.opening_status !== "OPEN" ||
      programme.source_confidence !== "OFFICIAL_VERIFIED" ||
      programme.candidate_facing_safe !== true ||
      typeof programme.exact_link !== "string" ||
      !/^https:\/\//i.test(programme.exact_link) ||
      !evidenceList(programme.evidence_refs)) {
    return { ok: false as const, code: "VERIFIED_MATCH_NOT_AVAILABLE" };
  }

  const { data: provider, error: providerError } = await admin
    .from("opportunity_providers")
    .select("provider_ref,provider_name,accreditation_status,source_confidence,safe_to_recommend,evidence_refs")
    .eq("provider_ref", match.provider_ref)
    .maybeSingle();
  if (providerError) throw new Error("PROVIDER_LOOKUP_FAILED");
  if (!provider ||
      provider.source_confidence !== "OFFICIAL_VERIFIED" ||
      provider.safe_to_recommend !== true ||
      provider.accreditation_status === "REJECTED" ||
      !evidenceList(provider.evidence_refs)) {
    return { ok: false as const, code: "VERIFIED_MATCH_NOT_AVAILABLE" };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const freshSince = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: observations, error: observationError } = await admin
    .from("external_source_observations")
    .select("last_checked_at,stale_after,evidence_refs,observation_status,source_confidence,source_url")
    .eq("source_url", programme.exact_link)
    .eq("observation_status", "VERIFIED")
    .eq("source_confidence", "OFFICIAL_VERIFIED")
    .gte("last_checked_at", freshSince)
    .gt("stale_after", nowIso)
    .order("last_checked_at", { ascending: false })
    .limit(1);
  if (observationError) throw new Error("SOURCE_OBSERVATION_LOOKUP_FAILED");
  const observation = observations?.[0];
  if (!observation || !evidenceList(observation.evidence_refs)) {
    return { ok: false as const, code: "SOURCE_REFRESH_REQUIRED" };
  }

  const { data: deadlines, error: deadlineError } = await admin
    .from("opportunity_deadlines")
    .select("opens_at,closes_at,deadline_status,source_confidence,evidence_refs,timezone")
    .eq("programme_ref", programme.programme_ref)
    .eq("provider_ref", provider.provider_ref)
    .eq("deadline_status", "CONFIRMED")
    .eq("source_confidence", "OFFICIAL_VERIFIED")
    .gt("closes_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1);
  if (deadlineError) throw new Error("DEADLINE_LOOKUP_FAILED");
  const deadline = deadlines?.[0];
  if (!deadline || !evidenceList(deadline.evidence_refs)) {
    return { ok: false as const, code: "CONFIRMED_DEADLINE_REQUIRED" };
  }
  const opensAt = deadline.opens_at == null ? null : Date.parse(deadline.opens_at);
  if (opensAt !== null && (!Number.isFinite(opensAt) || opensAt > now.getTime())) {
    return { ok: false as const, code: "OPPORTUNITY_NOT_OPEN_YET" };
  }
  return { ok: true as const, match, programme, provider, observation, deadline };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) {
    return reply(403, { ok: false, code: "ORIGIN_NOT_ALLOWED", error: "Origin not allowed." }, null);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    }});
  }
  if (req.method !== "POST") {
    return reply(405, { ok: false, code: "METHOD_NOT_ALLOWED", error: "Use POST." }, origin);
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reply(503, { ok: false, code: "NOT_CONFIGURED", error: "Kingsmen application planning is not configured." }, origin);
  }
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401, { ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to open your Kingsmen application plan." }, origin);
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) {
    return reply(401, { ok: false, code: "SESSION_INVALID", error: "Your session is invalid or expired. Sign in again." }, origin);
  }

  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply(413, { ok: false, code: "REQUEST_TOO_LARGE", error: "Request is too large." }, origin);
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, code: "INVALID_JSON", error: "The request must be valid JSON." }, origin);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return reply(400, { ok: false, code: "INVALID_BODY", error: "The request must be a JSON object." }, origin);
  }
  const action = payload.action;
  if (action !== "list_targets" && action !== "create_draft") {
    return reply(400, { ok: false, code: "ACTION_NOT_SUPPORTED", error: "Choose list_targets or create_draft." }, origin);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let identity: Awaited<ReturnType<typeof resolveVerifiedCandidate>>;
  try {
    identity = await resolveVerifiedCandidate(admin, authData.user.id);
    if (!identity.candidate) {
      const status = identity.code === "PROFILE_SETUP_REQUIRED" ? 409 : 403;
      return reply(status, {
        ok: false,
        code: identity.code,
        error: identity.code === "PROFILE_SETUP_REQUIRED"
          ? "Save your Kingsmen profile before creating an application plan."
          : "A verified Kingsmen candidate identity is required before applications can be planned."
      }, origin);
    }
    if (!await hasActiveConsent(admin, identity.candidate.public_ref)) {
      return reply(403, { ok: false, code: "PROFILE_PROCESSING_CONSENT_REQUIRED", error: "Active profile-processing consent is required before using the application engine." }, origin);
    }

    if (action === "list_targets") {
      const { data: targets, error } = await admin
        .from("candidate_master_application_targets")
        .select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,source_confidence,application_id,created_at,updated_at")
        .eq("candidate_id", identity.candidate.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error("TARGET_LIST_FAILED");
      return reply(200, { ok: true, status: "OK", count: targets?.length ?? 0, targets: (targets ?? []) as Target[] }, origin);
    }

    const matchRef = typeof payload.matchRef === "string" ? payload.matchRef.trim() : "";
    const pathwayType = typeof payload.pathwayType === "string" ? payload.pathwayType.trim() : "";
    if (!/^[A-Za-z0-9._:-]{1,80}$/.test(matchRef) || !PATHWAYS.has(pathwayType)) {
      return reply(400, { ok: false, code: "VALID_MATCH_AND_PATHWAY_REQUIRED", error: "Choose a valid Kingsmen match and one supported pathway." }, origin);
    }
    const verified = await verifyOpportunityMatch(admin, identity.candidate.id, matchRef, pathwayType);
    if (!verified.ok) {
      return reply(409, { ok: false, code: verified.code, error: "This match no longer passes Kingsmen's current official-source, deadline and pathway gates. Refresh verified matches and try again." }, origin);
    }
    const targetKey = `N15:${pathwayType}:${matchRef}`;
    if (targetKey.length > 120) {
      return reply(400, { ok: false, code: "MATCH_REFERENCE_TOO_LONG", error: "This match reference is too long to save safely." }, origin);
    }
    const { data: existing, error: existingError } = await admin
      .from("candidate_master_application_targets")
      .select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,source_confidence,application_id,created_at,updated_at")
      .eq("candidate_id", identity.candidate.id)
      .eq("target_key", targetKey)
      .maybeSingle();
    if (existingError) throw new Error("EXISTING_TARGET_LOOKUP_FAILED");
    if (existing) {
      return reply(200, { ok: true, created: false, target: existing as Target, provider_submission_sent: false }, origin);
    }
    const providerName = typeof verified.provider.provider_name === "string"
      ? verified.provider.provider_name.trim().slice(0, 180) : "";
    const programmeName = typeof verified.programme.programme_name === "string"
      ? verified.programme.programme_name.trim().slice(0, 240) : "";
    if (!providerName || !programmeName) {
      return reply(409, { ok: false, code: "VERIFIED_TARGET_DETAILS_REQUIRED", error: "The verified provider and programme names must be available before this target can be saved." }, origin);
    }
    const { data: created, error: insertError } = await admin
      .from("candidate_master_application_targets")
      .insert({
        candidate_id: identity.candidate.id,
        target_key: targetKey,
        pathway_type: pathwayType,
        provider_name: providerName,
        programme_or_role: programmeName,
        provider_application_url: verified.programme.exact_link,
        source_reference: `N15 match reference: ${matchRef}`,
        source_confidence: "UNVERIFIED",
        planning_status: "PLANNING",
        idempotency_key: crypto.randomUUID(),
        created_by_auth_user_id: authData.user.id
      })
      .select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,source_confidence,application_id,created_at,updated_at")
      .single();
    if (insertError) {
      if (insertError.code === "23505") {
        const { data: raced, error: raceError } = await admin
          .from("candidate_master_application_targets")
          .select("id,target_key,pathway_type,provider_name,programme_or_role,planning_status,source_confidence,application_id,created_at,updated_at")
          .eq("candidate_id", identity.candidate.id)
          .eq("target_key", targetKey)
          .maybeSingle();
        if (!raceError && raced) {
          return reply(200, { ok: true, created: false, target: raced as Target, provider_submission_sent: false }, origin);
        }
      }
      console.error("candidate application target insert failed", insertError.code ?? "unknown");
      return reply(503, { ok: false, code: "TARGET_SAVE_FAILED", error: "The application plan could not be saved safely. Try again later." }, origin);
    }
    return reply(201, {
      ok: true,
      created: true,
      target: created as Target,
      source_checked_at: verified.observation.last_checked_at,
      deadline_closes_at: verified.deadline.closes_at,
      provider_submission_sent: false,
      provider_outcome_verified: false,
      message: "Saved to your Kingsmen application plan. No application was sent to the provider."
    }, origin);
  } catch (error) {
    console.error("candidate application plan request failed", error instanceof Error ? error.message : "unknown");
    return reply(503, { ok: false, code: "APPLICATION_PLAN_UNAVAILABLE", error: "The application plan could not be verified. Try again later." }, origin);
  }
});
