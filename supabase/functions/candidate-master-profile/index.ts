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
type ProfileCandidate = { id: string; public_ref: string; display_name: string };
type ProfileIdentityResolution = {
  candidate: ProfileCandidate | null;
  identityStatus: "VERIFIED" | "PENDING_REVIEW" | null;
  hasLink: boolean;
};
async function resolveProfileCandidate(admin: ReturnType<typeof createClient>, userId: string): Promise<ProfileIdentityResolution> {
  const { data: link, error: linkError } = await admin.from("candidate_auth_identity_links")
    .select("candidate_id,link_status,verified_at,verified_by")
    .eq("supabase_user_id", userId).maybeSingle();
  if (linkError) throw new Error("IDENTITY_LOOKUP_FAILED");
  if (!link) return { candidate: null, identityStatus: null, hasLink: false };

  let identityStatus: ProfileIdentityResolution["identityStatus"] = null;
  if (link.link_status === "VERIFIED") {
    const verifiedAt = Date.parse(link.verified_at ?? "");
    if (!Number.isFinite(verifiedAt) || verifiedAt > Date.now() ||
        typeof link.verified_by !== "string" || !AUTH_UUID.test(link.verified_by)) {
      return { candidate: null, identityStatus: null, hasLink: true };
    }
    identityStatus = "VERIFIED";
  } else if (link.link_status === "PENDING") {
    // Pending legacy-link requests never grant access to the target candidate's profile.
    // Only a profile row created atomically by this same Auth user can be self-managed while review is pending.
    const { data: ownership, error: ownershipError } = await admin.from("candidate_master_application_events")
      .select("id").eq("candidate_id", link.candidate_id).eq("actor_auth_user_id", userId)
      .eq("event_type", "PROFILE_SAVED")
      .eq("details->>self_service_bootstrap", "true")
      .eq("details->>bootstrap_owner_user_id", userId)
      .limit(1).maybeSingle();
    if (ownershipError) throw new Error("SELF_SERVICE_OWNER_LOOKUP_FAILED");
    if (!ownership) return { candidate: null, identityStatus: null, hasLink: true };
    identityStatus = "PENDING_REVIEW";
  } else {
    return { candidate: null, identityStatus: null, hasLink: true };
  }

  const { data: candidate, error: candidateError } = await admin.from("candidates")
    .select("id,public_ref,display_name").eq("id", link.candidate_id).maybeSingle();
  if (candidateError) throw new Error("CANDIDATE_LOOKUP_FAILED");
  if (!candidate) return { candidate: null, identityStatus: null, hasLink: true };
  return { candidate, identityStatus, hasLink: true };
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
  if (action !== "load" && action !== "save" && action !== "revoke_consent" && action !== "request_correction") return reply(400, { ok: false, code: "ACTION_NOT_SUPPORTED", error: "Choose load, save, revoke_consent or request_correction." }, origin);
  if (action === "save" && payload.consentAccepted !== true) return reply(400, { ok: false, code: "CONSENT_REQUIRED", error: "Consent is required before saving profile changes." }, origin);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  let identity: ProfileIdentityResolution;
  try { identity = await resolveProfileCandidate(admin, authData.user.id); }
  catch (e) {
    console.error("candidate profile identity read failed", e instanceof Error ? e.message : "unknown");
    return reply(503, { ok: false, code: "PROFILE_SERVICE_UNAVAILABLE", error: "Candidate identity could not be verified. Try again later." }, origin);
  }

  if (!identity.candidate) {
    if (identity.hasLink) {
      return reply(403, { ok: false, code: "IDENTITY_NOT_VERIFIED", error: "This account has a pending or revoked link to a candidate record. An authorised reviewer must resolve that link before its profile can be accessed." }, origin);
    }
    if (action === "load") {
      return reply(200, {
        ok: true, profile: {}, pathwayPreferences: [],
        consent: { status: "NOT_RECORDED", version: null, grantedAt: null, text: CONSENT_TEXT },
        completeness: completion({}, []), correctionRequests: [], savedAt: null,
        candidateReference: null, identityStatus: "NOT_PROVISIONED",
        persistence: "NOT_PROVISIONED",
        message: "No profile has been saved yet. Complete the consent section and save to create your profile."
      }, origin);
    }
    if (action !== "save") {
      return reply(403, { ok: false, code: "PROFILE_BOOTSTRAP_REQUIRED", error: "Save a consented profile before requesting a correction or withdrawing consent." }, origin);
    }
    if (!authData.user.email || !authData.user.email_confirmed_at) {
      return reply(403, { ok: false, code: "CONFIRMED_EMAIL_REQUIRED", error: "Confirm your email address before creating a new candidate profile." }, origin);
    }
    const newProfile = safeProfile(payload.profile);
    const newPathways = safePathways(payload.pathwayPreferences);
    if (!newPathways) return reply(400, { ok: false, code: "PATHWAYS_INVALID", error: "Select only the supported Kingsmen pathways." }, origin);
    if (!newProfile.displayName || newProfile.displayName.length < 2) {
      return reply(400, { ok: false, code: "PROFILE_NAME_INVALID", error: "Enter at least two characters for your name." }, origin);
    }
    if (newProfile.phone && !/^[+0-9 ()-]{7,40}$/.test(newProfile.phone)) {
      return reply(400, { ok: false, code: "PHONE_INVALID", error: "Use a valid phone format or leave the number blank." }, origin);
    }
    const { data: bootstrapped, error: bootstrapError } = await admin.rpc("bootstrap_candidate_self_profile", {
      p_supabase_user_id: authData.user.id,
      p_email: authData.user.email,
      p_profile: newProfile,
      p_pathway_preferences: newPathways,
      p_consent_version: CONSENT_VERSION,
      p_consent_text: CONSENT_TEXT,
      p_consent_accepted: payload.consentAccepted === true
    });
    if (bootstrapError) {
      console.error("candidate profile bootstrap failed", bootstrapError.code ?? "unknown");
      return reply(503, { ok: false, code: "PROFILE_BOOTSTRAP_FAILED", error: "A new profile could not be created safely. No email-based link or duplicate profile was created." }, origin);
    }
    if (!bootstrapped || bootstrapped.ok !== true) {
      const code = typeof bootstrapped?.code === "string" ? bootstrapped.code : "PROFILE_BOOTSTRAP_FAILED";
      const known = code === "CONSENT_REQUIRED" ? 400
        : code === "PROFILE_FIELDS_INVALID" || code === "PATHWAYS_INVALID" ? 400
        : code === "AUTH_IDENTITY_ALREADY_LINKED" ? 409
        : code === "MANUAL_IDENTITY_REVIEW_REQUIRED" ? 409 : 503;
      return reply(known, {
        ok: false,
        code: code === "MANUAL_IDENTITY_REVIEW_REQUIRED" ? "IDENTITY_REVIEW_REQUIRED" : code,
        error: code === "MANUAL_IDENTITY_REVIEW_REQUIRED"
          ? "Profile setup needs manual identity review to avoid creating a duplicate candidate. Kingsmen never links accounts by email equality. Use the identity-review module or contact support."
          : code === "CONSENT_REQUIRED" ? "Consent is required before saving profile changes."
          : code === "PROFILE_FIELDS_INVALID" ? "Enter a valid name and supported profile fields."
          : code === "PATHWAYS_INVALID" ? "Select only supported Kingsmen pathways."
          : "This account already has an identity link. Refresh the profile or use the identity-review process."
      }, origin);
    }
    const persistedProfile = safeProfile(bootstrapped.profile_data);
    const persistedPathways = safePathways(bootstrapped.pathway_preferences) ?? [];
    return reply(201, {
      ok: true,
      profile: persistedProfile,
      pathwayPreferences: persistedPathways,
      consent: { status: "ACTIVE", version: bootstrapped.consent_version, grantedAt: bootstrapped.consent_at, text: CONSENT_TEXT },
      completeness: completion(persistedProfile, persistedPathways),
      candidateReference: bootstrapped.candidate_reference,
      identityStatus: "PENDING_REVIEW",
      savedAt: bootstrapped.saved_at,
      persistence: "SUPABASE_BACKEND",
      message: "Profile created and saved to Supabase. Your candidate reference is shown below. Identity verification remains pending; personal documents, opportunity matching and any legacy-record link still require authorised human review."
    }, origin);
  }

  const candidate = identity.candidate;
  const identityStatus = identity.identityStatus;
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
    .order("granted_at", { ascending: false }).order("id", { ascending: false }).limit(20);
  if (consentReadError) {
    console.error("candidate consent read failed", consentReadError.code ?? "unknown");
    return reply(503, { ok: false, code: "CONSENT_READ_FAILED", error: "Consent state could not be verified." }, origin);
  }
  const latestConsent = consentRows?.[0] ?? null;
  const consentActive = Boolean(latestConsent?.consent_status === "ACTIVE" && !latestConsent?.revoked_at && latestConsent.consent_text_snapshot);
  const currentProfile = safeProfile(current?.profile_data);
  if (action === "load") {
    const { data: correctionRequests, error: correctionError } = await admin.from("candidate_profile_change_requests")
      .select("id,field_name,old_value,requested_value,reason,status,requested_at,decided_at,decision_notes")
      .eq("candidate_id", candidate.id).order("requested_at", { ascending: false }).limit(50);
    if (correctionError) {
      console.error("candidate profile correction read failed", correctionError.code ?? "unknown");
      return reply(503, { ok: false, code: "CORRECTION_READ_FAILED", error: "Profile correction status could not be loaded." }, origin);
    }
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
      correctionRequests: correctionRequests ?? [],
      savedAt: current?.updated_at ?? null,
      candidateReference: candidate.public_ref,
      identityStatus,
      persistence: "SUPABASE_BACKEND"
    }, origin);
  }
  if (action === "request_correction") {
    if (!current) return reply(409, { ok: false, code: "PROFILE_NOT_SAVED", error: "Save your profile before requesting a correction." }, origin);
    const fieldName = typeof payload.fieldName === "string" ? payload.fieldName : "";
    const requestedValue = typeof payload.requestedValue === "string" ? payload.requestedValue.trim() : "";
    const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
    const allowedFields = new Set(Object.keys(FIELD_LIMITS));
    const maxValue = FIELD_LIMITS[fieldName] ?? 0;
    if (!allowedFields.has(fieldName) || !requestedValue || requestedValue.length > maxValue || reason.length < 5 || reason.length > 800) {
      return reply(400, { ok: false, code: "CORRECTION_INPUT_INVALID", error: "Select a supported profile field, enter the requested value and provide a reason (5–800 characters)." }, origin);
    }
    if ((currentProfile[fieldName] ?? "") === requestedValue) return reply(400, { ok: false, code: "CORRECTION_NOT_NEEDED", error: "The requested value already matches the saved profile field." }, origin);
    const { data: existing, error: existingError } = await admin.from("candidate_profile_change_requests")
      .select("id").eq("candidate_id", candidate.id).eq("field_name", fieldName).eq("status", "PENDING").limit(1).maybeSingle();
    if (existingError) {
      console.error("candidate correction duplicate check failed", existingError.code ?? "unknown");
      return reply(503, { ok: false, code: "CORRECTION_CHECK_FAILED", error: "Could not check for a pending correction request." }, origin);
    }
    if (existing) return reply(409, { ok: false, code: "CORRECTION_ALREADY_PENDING", error: "A correction request for this field is already pending review." }, origin);
    const { data: created, error: createError } = await admin.from("candidate_profile_change_requests").insert({
      candidate_id: candidate.id, field_name: fieldName, old_value: currentProfile[fieldName] ?? null,
      requested_value: requestedValue, reason, sensitivity: "NORMAL", status: "PENDING"
    }).select("id,field_name,old_value,requested_value,reason,status,requested_at").single();
    if (createError || !created) {
      console.error("candidate correction create failed", createError?.code ?? "unknown");
      return reply(503, { ok: false, code: "CORRECTION_SAVE_FAILED", error: "The correction request could not be saved." }, origin);
    }
    return reply(201, { ok: true, correctionRequest: created, message: "Correction request submitted. Your saved profile was not changed; an authorised reviewer must decide the request." }, origin);
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
  const latestConsent = consentRows?.[0] ?? null;
  const activeConsent = latestConsent?.consent_status === "ACTIVE" && !latestConsent.revoked_at &&
    typeof latestConsent.consent_text_snapshot === "string" && latestConsent.consent_text_snapshot.trim().length > 0
    ? latestConsent : null;
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
