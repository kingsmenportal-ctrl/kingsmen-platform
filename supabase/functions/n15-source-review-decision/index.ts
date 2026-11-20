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
const REVIEW_ROLES = ["PLATFORM_ADMIN", "PROVIDER_OPERATOR", "APPLICATION_REVIEWER", "EVIDENCE_VERIFIER"];
const MAX_BODY_BYTES = 16 * 1024;
const MAX_EVIDENCE_REFS = 12;

type Decision = "APPROVE_OFFICIAL_SOURCE" | "REJECT_SOURCE" | "MARK_SOURCE_STALE";
type Payload = {
  observation_ref?: unknown;
  decision?: unknown;
  review_reason?: unknown;
  decision_notes?: unknown;
  evidence_refs?: unknown;
  reviewed_official_source?: unknown;
};

function isAllowedOrigin(origin: string): boolean {
  if (DEFAULT_ORIGINS.has(origin)) return true;
  const configured = (Deno.env.get("KINGSMEN_PORTAL_ORIGINS") ?? "")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  return /^https://[a-z0-9-]+--kingsmen-portal-staging.netlify.app$/i.test(origin);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readBoundedJson(req: Request): Promise<Payload> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!/^application/json(?:s*;|$)/i.test(contentType)) throw new Error("JSON_CONTENT_TYPE_REQUIRED");
  const declaredLength = req.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^d+$/.test(declaredLength)) throw new Error("INVALID_CONTENT_LENGTH");
    if (Number(declaredLength) > MAX_BODY_BYTES) throw new Error("REQUEST_TOO_LARGE");
  }
  const reader = req.body?.getReader();
  if (!reader) throw new Error("JSON_BODY_REQUIRED");
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("INVALID_JSON"); }
  if (!isRecord(body)) throw new Error("JSON_OBJECT_REQUIRED");
  return body as Payload;
}

function canonicalHttps(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function hostIsWithin(host: string, authorityHost: string): boolean {
  const candidate = host.toLowerCase();
  const authority = authorityHost.toLowerCase();
  return candidate === authority || candidate.endsWith("." + authority);
}

function decisionStatus(code: string): number {
  if (code === "SOURCE_OBSERVATION_NOT_FOUND") return 404;
  if (code === "SOURCE_OBSERVATION_ALREADY_DECIDED") return 409;
  if ([
    "OBSERVATION_REF_INVALID", "SOURCE_DECISION_INVALID", "REVIEWER_REF_REQUIRED",
    "REVIEW_REASON_INVALID", "DECISION_NOTES_TOO_LONG", "EVIDENCE_REFS_COUNT_INVALID",
    "EVIDENCE_REF_INVALID", "SOURCE_AUTHORITY_REQUIRED", "SOURCE_URL_OUTSIDE_AUTHORITY",
    "OFFICIAL_AUTHORITY_EVIDENCE_REQUIRED", "SOURCE_AUTHORITY_NOT_VERIFIED"
  ].includes(code)) return 400;
  return 503;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) return reply(403, { status: "FORBIDDEN", code: "ORIGIN_NOT_ALLOWED" }, null);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin && isAllowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "600",
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache",
        "Vary": "Origin"
      }
    });
  }
  if (req.method !== "POST") return reply(405, { status: "METHOD_NOT_ALLOWED", code: "POST_REQUIRED" }, origin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return reply(503, { status: "CONFIGURATION_ERROR", code: "SUPABASE_SERVICE_CONFIGURATION_MISSING" }, origin);
  }

  const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
  if (!token) return reply(401, { status: "UNAUTHENTICATED", code: "BEARER_REQUIRED" }, origin);

  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: authError } = await auth.auth.getUser(token);
  if (authError || !userData.user) return reply(401, { status: "UNAUTHENTICATED", code: "INVALID_SESSION" }, origin);

  let payload: Payload;
  try {
    payload = await readBoundedJson(req);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_REQUEST_BODY";
    const status = code === "REQUEST_TOO_LARGE" ? 413
      : code === "JSON_CONTENT_TYPE_REQUIRED" ? 415 : 400;
    return reply(status, { status: "INVALID_REQUEST", code }, origin);
  }

  const observationRef = typeof payload.observation_ref === "string" ? payload.observation_ref.trim() : "";
  const decision = payload.decision;
  const reviewReason = typeof payload.review_reason === "string" ? payload.review_reason.trim() : "";
  const decisionNotes = typeof payload.decision_notes === "string" ? payload.decision_notes.trim() : "";
  if (!/^[a-zA-Z0-9._:-]{1,120}$/.test(observationRef)) {
    return reply(400, { status: "INVALID_REQUEST", code: "OBSERVATION_REF_INVALID" }, origin);
  }
  if (!["APPROVE_OFFICIAL_SOURCE", "REJECT_SOURCE", "MARK_SOURCE_STALE"].includes(String(decision))) {
    return reply(400, { status: "INVALID_REQUEST", code: "SOURCE_DECISION_INVALID" }, origin);
  }
  if (reviewReason.length < 5 || reviewReason.length > 1200) {
    return reply(400, { status: "INVALID_REQUEST", code: "REVIEW_REASON_INVALID" }, origin);
  }
  if (decisionNotes.length > 2000) {
    return reply(400, { status: "INVALID_REQUEST", code: "DECISION_NOTES_TOO_LONG" }, origin);
  }
  if (!Array.isArray(payload.evidence_refs) || payload.evidence_refs.length < 1 || payload.evidence_refs.length > MAX_EVIDENCE_REFS) {
    return reply(400, { status: "INVALID_REQUEST", code: "EVIDENCE_REFS_COUNT_INVALID" }, origin);
  }
  const evidenceRefs: string[] = [];
  for (const item of payload.evidence_refs) {
    const parsed = canonicalHttps(item);
    if (!parsed) return reply(400, { status: "INVALID_REQUEST", code: "EVIDENCE_REF_INVALID" }, origin);
    evidenceRefs.push(parsed.toString());
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: reviewer, error: reviewerError } = await admin
    .from("platform_reviewers")
    .select("id,role_code")
    .eq("auth_user_id", userData.user.id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .in("role_code", REVIEW_ROLES)
    .limit(1)
    .maybeSingle();
  if (reviewerError) {
    console.error("N15 source decision reviewer lookup failed", reviewerError.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", code: "REVIEWER_LOOKUP_FAILED" }, origin);
  }
  if (!reviewer) {
    return reply(403, {
      status: "FORBIDDEN",
      code: "ACTIVE_OPPORTUNITY_REVIEWER_REQUIRED",
      message: "An active, authorised opportunity reviewer is required to make source decisions."
    }, origin);
  }

  if (decision === "APPROVE_OFFICIAL_SOURCE") {
    if (payload.reviewed_official_source !== true) {
      return reply(400, { status: "INVALID_REQUEST", code: "OFFICIAL_SOURCE_ATTESTATION_REQUIRED" }, origin);
    }
    const { data: observation, error: observationError } = await admin
      .from("external_source_observations")
      .select("observation_ref,authority_ref,source_url,observation_status")
      .eq("observation_ref", observationRef)
      .in("observation_status", ["NEEDS_REVIEW", "STALE"])
      .maybeSingle();
    if (observationError) {
      console.error("N15 source decision observation lookup failed", observationError.code ?? "unknown");
      return reply(503, { status: "DATABASE_ERROR", code: "SOURCE_OBSERVATION_LOOKUP_FAILED" }, origin);
    }
    if (!observation) return reply(409, { status: "CONFLICT", code: "SOURCE_OBSERVATION_ALREADY_DECIDED" }, origin);
    if (!observation.authority_ref) return reply(400, { status: "INVALID_REQUEST", code: "SOURCE_AUTHORITY_REQUIRED" }, origin);

    const { data: authority, error: authorityError } = await admin
      .from("opportunity_source_authorities")
      .select("authority_ref,base_url,active,confidence_band")
      .eq("authority_ref", observation.authority_ref)
      .maybeSingle();
    if (authorityError) {
      console.error("N15 source decision authority lookup failed", authorityError.code ?? "unknown");
      return reply(503, { status: "DATABASE_ERROR", code: "SOURCE_AUTHORITY_LOOKUP_FAILED" }, origin);
    }
    if (!authority || authority.active !== true || authority.confidence_band !== "OFFICIAL_VERIFIED") {
      return reply(400, { status: "INVALID_REQUEST", code: "SOURCE_AUTHORITY_NOT_VERIFIED" }, origin);
    }
    const authorityUrl = canonicalHttps(authority.base_url);
    const sourceUrl = canonicalHttps(observation.source_url);
    if (!authorityUrl || !sourceUrl || !hostIsWithin(sourceUrl.hostname, authorityUrl.hostname)) {
      return reply(400, { status: "INVALID_REQUEST", code: "SOURCE_URL_OUTSIDE_AUTHORITY" }, origin);
    }
    if (!evidenceRefs.some(value => {
      const candidate = canonicalHttps(value);
      return candidate && hostIsWithin(candidate.hostname, authorityUrl.hostname);
    })) {
      return reply(400, { status: "INVALID_REQUEST", code: "OFFICIAL_AUTHORITY_EVIDENCE_REQUIRED" }, origin);
    }
  }

  const { data, error } = await admin.rpc("record_n15_source_review_decision", {
    p_observation_ref: observationRef,
    p_decision: decision as Decision,
    p_reviewer_ref: String(reviewer.id),
    p_review_reason: reviewReason,
    p_decision_notes: decisionNotes || null,
    p_evidence_refs: evidenceRefs
  });
  if (error) {
    console.error("N15 source review RPC failed", error.code ?? "unknown");
    return reply(503, { status: "DATABASE_ERROR", code: "SOURCE_REVIEW_TRANSACTION_FAILED" }, origin);
  }
  if (!isRecord(data) || data.ok !== true) {
    const code = isRecord(data) && typeof data.code === "string" ? data.code : "SOURCE_REVIEW_DECISION_FAILED";
    return reply(decisionStatus(code), {
      status: "DECISION_NOT_RECORDED",
      code,
      message: "The source review was not recorded. Refresh the queue before retrying."
    }, origin);
  }

  return reply(200, {
    status: "OK",
    ...data,
    message: "Source review recorded. This decision does not publish an opportunity or approve its deadline, eligibility, fees, or provider outcome."
  }, origin);
});
