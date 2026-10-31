import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  canonicalHttpsUrl as canonicalHttps,
  isWithinAuthority as withinAuthority,
  validateN15PromotionPayload as validatePayload,
  validateN15EvidenceReferences
} from "../_shared/n15-promotion-policy.mjs";

const ALLOWED_ORIGIN = Deno.env.get("KINGSMEN_WEB_ORIGIN") || "https://kingsmen-portal-staging.netlify.app";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const REVIEW_ROLES = ["EVIDENCE_VERIFIER", "PLATFORM_ADMIN"];
const ALLOWED_SECTORS = new Set([
  "UNIVERSITY", "TVET", "SETA", "QCTO", "LEARNERSHIP", "BURSARY",
  "ACCOMMODATION", "EMPLOYER", "INTERNSHIP", "NSFAS", "CAO", "PRIVATE_COLLEGE"
]);

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}
function safeStringArray(value: unknown, maxItems = 20): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length <= 500))].slice(0, maxItems);
}
async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}
async function fetchReviewedSource(url: URL, authority: URL) {
  if (!withinAuthority(url, authority)) throw new Error("SOURCE_URL_OUTSIDE_REGISTERED_AUTHORITY");
  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/pdf",
      "User-Agent": "KingsmenN15Verifier/1.0 (+source-verification; no automated applications)"
    }
  });
  if (response.status >= 300 && response.status < 400) {
    await response.body?.cancel();
    throw new Error("SOURCE_REDIRECT_REQUIRES_MANUAL_REVIEW");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("SOURCE_REFETCH_FAILED");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml\+xml|application\/pdf/i.test(contentType)) {
    await response.body?.cancel();
    throw new Error("SOURCE_CONTENT_TYPE_NOT_SUPPORTED");
  }
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_SOURCE_BYTES) {
    await response.body?.cancel();
    throw new Error("SOURCE_EVIDENCE_TOO_LARGE");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("SOURCE_EVIDENCE_BODY_MISSING");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_SOURCE_BYTES) {
      await reader.cancel();
      throw new Error("SOURCE_EVIDENCE_TOO_LARGE");
    }
    chunks.push(value);
  }
  if (total === 0) throw new Error("SOURCE_EVIDENCE_SIZE_INVALID");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    contentType: contentType.split(";")[0].toLowerCase(),
    byteLength: bytes.length,
    sha256: await sha256(bytes)
  };
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  const origin = req.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) return json({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ ok: false, code: "SERVICE_CONFIGURATION_MISSING" }, 503);

  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearer || bearer.length > 8192) return json({ ok: false, code: "UNAUTHENTICATED" }, 401);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(bearer);
  if (authError || !userData.user) {
    return json({ ok: false, code: "UNAUTHENTICATED" }, 401);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: reviewer, error: reviewerError } = await admin.from("platform_reviewers")
    .select("role_code")
    .eq("auth_user_id", userData.user.id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .in("role_code", REVIEW_ROLES)
    .limit(1)
    .maybeSingle();
  if (reviewerError) return json({ ok: false, code: "REVIEWER_AUTHORIZATION_LOOKUP_FAILED" }, 503);
  if (!reviewer) return json({ ok: false, code: "EVIDENCE_VERIFIER_REQUIRED" }, 403);

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, code: "REQUEST_TOO_LARGE" }, 413);
  let raw = "";
  try {
    raw = await req.text();
  } catch {
    return json({ ok: false, code: "REQUEST_BODY_INVALID" }, 400);
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ ok: false, code: "REQUEST_TOO_LARGE" }, 413);
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: "INVALID_JSON" }, 400);
  }
  const invalid = validatePayload(payload);
  if (invalid) return json({ ok: false, code: invalid }, 400);

  const { data: observation, error: observationError } = await admin.from("external_source_observations")
    .select("observation_ref,authority_ref,source_url,source_title,source_confidence,observation_status,observed_at,last_checked_at,stale_after,evidence_refs")
    .eq("observation_ref", payload.observation_ref)
    .maybeSingle();
  if (observationError) return json({ ok: false, code: "SOURCE_OBSERVATION_LOOKUP_FAILED" }, 503);
  if (!observation) return json({ ok: false, code: "SOURCE_OBSERVATION_NOT_FOUND" }, 404);
  if (!["NEEDS_REVIEW", "VERIFIED"].includes(observation.observation_status)) {
    return json({ ok: false, code: "SOURCE_OBSERVATION_NOT_REVIEWABLE" }, 409);
  }

  const { data: authority, error: authorityError } = await admin.from("opportunity_source_authorities")
    .select("authority_ref,base_url,active")
    .eq("authority_ref", observation.authority_ref)
    .eq("active", true)
    .maybeSingle();
  if (authorityError) return json({ ok: false, code: "SOURCE_AUTHORITY_LOOKUP_FAILED" }, 503);
  if (!authority) return json({ ok: false, code: "ACTIVE_SOURCE_AUTHORITY_REQUIRED" }, 409);

  const sourceUrl = canonicalHttps(observation.source_url);
  const authorityUrl = canonicalHttps(authority.base_url);
  const providerUrl = canonicalHttps(payload.provider.official_url);
  const programmeUrl = canonicalHttps(payload.programme.exact_link);
  if (!sourceUrl || !authorityUrl || !providerUrl || !programmeUrl ||
      !withinAuthority(sourceUrl, authorityUrl) ||
      !withinAuthority(providerUrl, authorityUrl) ||
      !withinAuthority(programmeUrl, authorityUrl) ||
      programmeUrl.toString() !== sourceUrl.toString()) {
    return json({ ok: false, code: "OFFICIAL_AUTHORITY_URL_SCOPE_FAILED" }, 409);
  }

  let sourceEvidence;
  try {
    sourceEvidence = await fetchReviewedSource(sourceUrl, authorityUrl);
  } catch (error) {
    return json({
      ok: false,
      code: error instanceof Error ? error.message : "SOURCE_REFETCH_FAILED"
    }, 409);
  }

  const suppliedEvidence = validateN15EvidenceReferences(payload.evidence_refs ?? [], authorityUrl);
  if (!suppliedEvidence.valid) return json({ ok: false, code: suppliedEvidence.reason }, 400);
  const generatedEvidenceRefs = [...new Set([
    ...safeStringArray(observation.evidence_refs, 20),
    observation.observation_ref,
    sourceUrl.toString(),
    "sha256:" + sourceEvidence.sha256,
    ...suppliedEvidence.refs
  ])];

  const rpcPayload = {
    reviewer_auth_user_id: userData.user.id,
    observation_ref: observation.observation_ref,
    review_reason: cleanText(payload.review_reason, 1000),
    decision_notes: cleanText(payload.decision_notes, 4000),
    evidence_refs: generatedEvidenceRefs,
    provider: {
      provider_ref: cleanText(payload.provider.provider_ref, 120),
      provider_name: cleanText(payload.provider.provider_name, 180),
      provider_type: cleanText(payload.provider.provider_type, 80),
      sector: cleanText(payload.provider.sector, 80).toUpperCase(),
      province: cleanText(payload.provider.province, 100),
      official_url: providerUrl.toString(),
      accreditation_status: cleanText(payload.provider.accreditation_status, 40).toUpperCase()
    },
    programme: {
      programme_ref: cleanText(payload.programme.programme_ref, 120),
      programme_name: cleanText(payload.programme.programme_name, 200),
      sector: cleanText(payload.programme.sector, 80).toUpperCase(),
      nqf_level: cleanText(payload.programme.nqf_level, 40),
      delivery_mode: cleanText(payload.programme.delivery_mode, 80),
      location_text: cleanText(payload.programme.location_text, 180),
      opening_status: cleanText(payload.programme.opening_status, 40).toUpperCase(),
      exact_link: programmeUrl.toString()
    },
    deadline: payload.deadline && typeof payload.deadline === "object" ? {
      deadline_ref: cleanText(payload.deadline.deadline_ref, 120),
      deadline_type: cleanText(payload.deadline.deadline_type, 80) || "APPLICATION",
      opens_at: cleanText(payload.deadline.opens_at, 60),
      closes_at: cleanText(payload.deadline.closes_at, 60),
      timezone: cleanText(payload.deadline.timezone, 80) || "Africa/Johannesburg"
    } : null,
    eligibility_rules: (payload.eligibility_rules ?? []).map((rule: any) => ({
      rule_ref: cleanText(rule.rule_ref, 120),
      rule_type: cleanText(rule.rule_type, 80),
      rule_text: cleanText(rule.rule_text, 2000)
    }))
  };

  const { data: promoted, error: promotionError } = await admin.rpc(
    "promote_n15_verified_opportunity_listing",
    { p_review_payload: rpcPayload }
  );
  if (promotionError) {
    console.error("N15 promotion RPC failed", promotionError.code ?? "unknown");
    return json({ ok: false, code: "N15_PROMOTION_TRANSACTION_FAILED" }, 503);
  }

  return json({
    ...promoted,
    sourceEvidence: {
      contentType: sourceEvidence.contentType,
      byteLength: sourceEvidence.byteLength,
      sha256: sourceEvidence.sha256,
      fetchedAt: new Date().toISOString()
    },
    humanReviewRecorded: true,
    candidateMatchGenerationAttempted: false
  });
});
