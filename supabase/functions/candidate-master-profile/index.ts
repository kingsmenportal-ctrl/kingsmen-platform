import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CONSENT_VERSION = "KINGSMEN_PROFILE_CONSENT_V1_2026-10-29";
const CONSENT_TEXT = "I consent to Kingsmen processing the profile information I enter for candidate profile, opportunity discovery and application-preparation support. Access to my personal records is restricted to my verified candidate identity and authorised roles. Information is handled under the published privacy, security and retention rules. I may withdraw consent; withdrawal does not automatically delete my saved profile, but functions that depend on consent may be restricted. I will not enter national identity numbers or sensitive documents in this profile form.";
const AUTH_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ORIGINS = new Set([
  "https://kingsmen-portal-staging.netlify.app",
  "http://localhost:8888",
  "http://127.0.0.1:8888"
]);
const PATHWAYS = new Set(["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]);
const FIELD_LIMITS: Record<string, number> = {
  displayName: 120,
  phone: 40,
  province: 40,
  highestQualification: 100,
  studyInterests: 600,
  employmentInterests: 600,
  preferredLocation: 120
};
type ProfileData = Record<string, string>;
function isAllowedOrigin(origin: string): boolean {
  return ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(origin);
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
function safeProfile(value: unknown): ProfileData {
  const out: ProfileData = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  const source = value as Record<string, unknown>;
  for (const [key, max] of Object.entries(FIELD_LIMITS)) {
    if (typeof source[key] === "string") out[key] = source[key].trim().slice(0, max);
  }
  return out;
}
function safePathways(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > PATHWAYS.size) return null;
  if (value.some((v) => typeof v !== "string" || !PATHWAYS.has(v))) return null;
  return [...new Set(value as string[])];
}
function completion(profile: ProfileData, pathways: string[]) {
  const checks = [
    ["displayName", Boolean(profile.displayName?.trim())],
    ["province", Boolean(profile.province?.trim())],
    ["highestQualification", Boolean(profile.highestQualification?.trim())],
    ["pathwayPreferences", pathways.length > 0]
  ] as const;
  const complete = checks.filter(([, ok]) => ok).length;
  return { completed: complete, required: checks.length, percent: Math.round((complete / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([key]) => key) };
}
async function getVerifiedCandidate(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: link, error: linkError } = await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by")
    .eq("supabase_user_id", userId).maybeSingle();
  if (linkError) throw new Error("IDENTITY_LOOKUP_FAILED");
  const verifiedAt = Date.parse(link?.verified_at ?? "");
  if (!link || link.link_status !== "VERIFIED" || !Number.isFinite(verifiedAt) || verifiedAt > Date.now() ||
      typeof link.verified_by !== "string" || !AUTH_UUID.test(link.verified_by)) return null;
  const { data: candidate, error } = await admin.from("candidates")
    .select("id,public_ref,display_name").eq("id", link.candidate_id).maybeSingle();
  if (error) throw new Error("CANDIDATE_LOOKUP_FAILED");
  return candidate ?? null;
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return reply(403, { ok: false, code: "ORIGIN_NOT_ALLOWED", error: "Origin not allowed." }, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "600", "Vary": "Origin"
  }});
  if (req.method !== "POST") return reply(405, { ok: false, code: "METHOD_NOT_ALLOWED", error: "Use POST." }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) return reply(503, { ok: false, code: "NOT_CONFIGURED", error: "Candidate profile persistence is not configured." }, origin);
  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401, { ok: false, code: "AUTHENTICATION_REQUIRED", error: "Sign in to open your saved profile." }, origin);
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return reply(401, { ok: false, code: "SESSION_INVALID", error: "Your session is invalid or expired. Sign in again." }, origin);
  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return reply(413, { ok: false, code: "REQUEST_TOO_LARGE", error: "Profile request is too large." }, origin);
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, code: "INVALID_JSON", error: "The profile request must be valid JSON." }, origin);
  }
  const action = payload.action;
  if (action !== "load" && action !== "save" && action !== "revoke_consent") return reply(400, { ok: false, code: "ACTION_NOT_SUPPORTED", error: "Choose load, save or revoke_consent." }, origin);
  if (action === "save" && payload.consentAccepted !== true) return reply(400, { ok: false, code: "CONSENT_REQUIRED", error: "Consent is required before saving profile changes." }, origin);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let candidate: { id: string; public_ref: string; display_name: string } | null;
  try { candidate = await getVerifiedCandidate(admin, authData.user.id); }
  catch (e) {
    console.error("candidate profile identity read failed", e instanceof Error ? e.message : "unknown");
    return reply(503, { ok: false, code: "PROFILE_SERVICE_UNAVAILABLE", error: "Candidate identity could not be verified. Try again later." }, origin);
  }
  if (!candidate) return reply(403, { ok: false, code: "IDENTITY_NOT_VERIFIED", error: "Your saved profile is protected until an authorised identity reviewer verifies your candidate link." }, origin);
  const { data: current, error: profileReadError } = await admin.from("candidate_master_profiles")
    .select("profile_data,pathway_preferences,consent_version,consent_at,updated_at")
    .eq("candidate_id", candidate.id).maybeSingle();
  if (profileReadError) {
    console.error("candidate profile read failed", profileReadError.code ?? "unknown");
    return reply(503, { ok: false, code: "PROFILE_READ_FAILED", error: "Saved profile information could not be loaded." }, origin);
  }
  const { data: consentRows, error: consentReadError } = await admin.from("privacy_consent_records")
    .select("id,consent_ref,consent_status,granted_at,revoked_at,consent_text_snapshot")
    .eq("candidate_ref", candidate.public_ref).eq("consent_type", "PROFILE_PROCESSING")
    .order("granted_at", { ascending: false }).limit(20);
  if (consentReadError) {
    console.error("candidate consent read failed", consentReadError.code ?? "unknown");
    return reply(503, { ok: false, code: "CONSENT_READ_FAILED", error: "Consent state could not be verified." }, origin);
  }
  const latestConsent = consentRows?.[0] ?? null;
  const consentActive = Boolean(latestConsent?.consent_status === "ACTIVE" && !latestConsent?.revoked_at && latestConsent.consent_text_snapshot);
  const currentProfile = safeProfile(current?.profile_data);
  if (action === "load") {
    const pathways = safePathways(current?.pathway_preferences) ?? [];
    if (!currentProfile.displayName) currentProfile.displayName = candidate.display_name ?? "";
    return reply(200, {
      ok: true,
      profile: currentProfile,
      pathwayPreferences: pathways,
      consent: {
        status: consentActive ? "ACTIVE" : latestConsent?.consent_status === "REVOKED" ? "REVOKED" : "NOT_RECORDED",
        version: current?.consent_version ?? null,
        grantedAt: latestConsent?.granted_at ?? current?.consent_at ?? null,
        text: consentActive ? latestConsent?.consent_text_snapshot : CONSENT_TEXT
      },
      completeness: completion(currentProfile, pathways),
      savedAt: current?.updated_at ?? null,
      persistence: "SUPABASE_BACKEND"
    }, origin);
  }
  if (action === "revoke_consent") {
    if (consentRows?.some((row: Record<string, unknown>) => row.consent_status === "ACTIVE")) {
      const { error } = await admin.from("privacy_consent_records")
        .update({ consent_status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("candidate_ref", candidate.public_ref).eq("consent_type", "PROFILE_PROCESSING").eq("consent_status", "ACTIVE");
      if (error) {
        console.error("candidate consent revocation failed", error.code ?? "unknown");
        return reply(503, { ok: false, code: "CONSENT_REVOCATION_FAILED", error: "Consent could not be withdrawn. No confirmation was recorded." }, origin);
      }
    }
    return reply(200, { ok: true, consent: { status: "REVOKED", version: current?.consent_version ?? null }, profilePreserved: true, message: "Profile data was preserved. Consent-dependent processing may be restricted." }, origin);
  }
  const profile = safeProfile(payload.profile);
  const pathways = safePathways(payload.pathwayPreferences);
  if (!pathways) return reply(400, { ok: false, code: "PATHWAYS_INVALID", error: "Select only the supported Kingsmen pathways." }, origin);
  if (profile.displayName && profile.displayName.length < 2) return reply(400, { ok: false, code: "PROFILE_NAME_INVALID", error: "Enter at least two characters for your name." }, origin);
  if (profile.phone && !/^[+0-9 ()-]{7,40}$/.test(profile.phone)) return reply(400, { ok: false, code: "PHONE_INVALID", error: "Use a valid phone format or leave the number blank." }, origin);
  const now = new Date().toISOString();
  const activeConsent = consentRows?.find((row: Record<string, unknown>) => row.consent_status === "ACTIVE" && !row.revoked_at && row.consent_text_snapshot);
  if (!activeConsent) {
    const consentRef = `PROFILE-${candidate.public_ref}-${crypto.randomUUID()}`;
    const { error } = await admin.from("privacy_consent_records").insert({
      consent_ref: consentRef, candidate_ref: candidate.public_ref, consent_type: "PROFILE_PROCESSING",
      lawful_basis: "CONSENT", consent_status: "ACTIVE", consent_text_snapshot: CONSENT_TEXT,
      evidence_refs: ["candidate-profile-consent-v1", "self-service-profile-save"], granted_at: now
    });
    if (error) {
      console.error("candidate profile consent create failed", error.code ?? "unknown");
      return reply(503, { ok: false, code: "CONSENT_SAVE_FAILED", error: "Consent could not be recorded. Profile changes were not saved." }, origin);
    }
  }
  const consentAt = activeConsent ? (current?.consent_version === CONSENT_VERSION && current?.consent_at ? current.consent_at : now) : now;
  const { data: saved, error: saveError } = await admin.from("candidate_master_profiles").upsert({
    candidate_id: candidate.id, profile_data: profile, pathway_preferences: pathways,
    consent_version: CONSENT_VERSION, consent_at: consentAt,
    last_saved_by_auth_user_id: authData.user.id, updated_at: now
  }, { onConflict: "candidate_id" }).select("profile_data,pathway_preferences,consent_version,consent_at,updated_at").single();
  if (saveError || !saved) {
    console.error("candidate profile save failed", saveError?.code ?? "unknown");
    return reply(503, { ok: false, code: "PROFILE_SAVE_FAILED", error: "Profile changes could not be saved. Reload before retrying." }, origin);
  }
  const savedProfile = safeProfile(saved.profile_data);
  const savedPathways = safePathways(saved.pathway_preferences) ?? [];
  return reply(200, {
    ok: true, profile: savedProfile, pathwayPreferences: savedPathways,
    consent: { status: "ACTIVE", version: saved.consent_version, grantedAt: saved.consent_at, text: CONSENT_TEXT },
    completeness: completion(savedProfile, savedPathways), savedAt: saved.updated_at,
    persistence: "SUPABASE_BACKEND", message: "Profile changes saved to Supabase. Refresh or sign in again to reload this information."
  }, origin);
});
