import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://kingsmen-portal-staging.netlify.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const ALLOWED_REVIEWER_ROLES = ["PLATFORM_ADMIN", "PROVIDER_OPERATOR", "APPLICATION_REVIEWER", "EVIDENCE_VERIFIER"];
const SAFE_PAYLOAD_KEYS = new Set([
  "publicRef", "applicationRef", "opportunityRef", "status", "state", "title",
  "sourceRef", "updatedAt", "lastCheckedAt", "sourceConfidence", "mirrorSummary"
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTIFIER = /^[a-z][a-z0-9_]{0,62}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function tokenRole(req: Request): string {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? "";
  } catch { return ""; }
}
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safePayload(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !SAFE_PAYLOAD_KEYS.has(key))) return null;
  for (const [key, item] of Object.entries(input)) {
    if (typeof item === "string" && item.length > 500) return null;
    if (item !== null && !["string", "number", "boolean"].includes(typeof item)) return null;
  }
  return input;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ status: "METHOD_NOT_ALLOWED" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) {
    return json({ status: "CONFIGURATION_ERROR", reason: "SUPABASE_SERVICE_CONFIGURATION_MISSING" }, 500);
  }

  const authorization = req.headers.get("authorization") ?? "";
  const bearer = authorization.replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ status: "UNAUTHENTICATED" }, 401);

  // The gateway validates JWT signatures (verify_jwt=true). For user tokens,
  // independently resolve the user and require an active, server-granted reviewer role.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (tokenRole(req) !== "service_role") {
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !userData.user) return json({ status: "UNAUTHENTICATED" }, 401);
    const { data: reviewer, error: reviewerError } = await admin
      .from("platform_reviewers")
      .select("role_code")
      .eq("auth_user_id", userData.user.id)
      .eq("is_active", true)
      .is("revoked_at", null)
      .in("role_code", ALLOWED_REVIEWER_ROLES)
      .limit(1)
      .maybeSingle();
    if (reviewerError) return json({ status: "DATABASE_ERROR", reason: "REVIEWER_AUTHORIZATION_LOOKUP_FAILED" }, 500);
    if (!reviewer) return json({ status: "FORBIDDEN", reason: "ACTIVE_PLATFORM_REVIEWER_REQUIRED" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_BODY");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ status: "INVALID_REQUEST", reason: "JSON_OBJECT_REQUIRED" }, 400);
  }

  const sourceEntityType = body.sourceEntityType;
  const sourceEntityId = body.sourceEntityId;
  const syncTargetId = body.syncTargetId;
  const sourceVersion = body.sourceVersion;
  const operation = body.operation ?? "UPSERT_MIRROR";
  const payload = safePayload(body.payload ?? {});

  if (typeof sourceEntityType !== "string" || !IDENTIFIER.test(sourceEntityType)) {
    return json({ status: "INVALID_REQUEST", reason: "INVALID_SOURCE_ENTITY_TYPE" }, 400);
  }
  if (typeof sourceEntityId !== "string" || !UUID.test(sourceEntityId)) {
    return json({ status: "INVALID_REQUEST", reason: "SOURCE_ENTITY_ID_MUST_BE_UUID" }, 400);
  }
  if (typeof syncTargetId !== "string" || !UUID.test(syncTargetId)) {
    return json({ status: "INVALID_REQUEST", reason: "SYNC_TARGET_ID_MUST_BE_UUID" }, 400);
  }
  if (typeof sourceVersion !== "string" || sourceVersion.trim().length < 1 || sourceVersion.length > 100) {
    return json({ status: "INVALID_REQUEST", reason: "SOURCE_VERSION_REQUIRED_FOR_IDEMPOTENCY" }, 400);
  }
  if (!["CREATE_MIRROR", "UPDATE_MIRROR", "ARCHIVE_MIRROR", "UPSERT_MIRROR"].includes(String(operation))) {
    return json({ status: "INVALID_REQUEST", reason: "UNSUPPORTED_MIRROR_OPERATION" }, 400);
  }
  if (!payload) return json({ status: "INVALID_REQUEST", reason: "PAYLOAD_CONTAINS_UNAPPROVED_FIELDS_OR_TYPES" }, 400);

  const idempotencyKey = "n07:" + await sha256([
    sourceEntityType, sourceEntityId, syncTargetId, String(operation), sourceVersion
  ].join("|"));

  const { data, error } = await admin.rpc("n07_enqueue_airtable_mirror", {
    p_idempotency_key: idempotencyKey,
    p_sync_target_id: syncTargetId,
    p_source_table: sourceEntityType,
    p_source_record_id: sourceEntityId,
    p_operation: String(operation),
    p_payload: payload
  });

  if (error) {
    if (error.code === "42501") return json({ status: "FORBIDDEN", reason: "QUEUE_PERMISSION_OR_LEASE_BOUNDARY" }, 403);
    if (error.code === "22023") return json({ status: "INVALID_REQUEST", reason: "TARGET_OR_PAYLOAD_REJECTED" }, 400);
    if (error.code === "23505") return json({ status: "CONFLICT", reason: "IDEMPOTENCY_KEY_EVENT_CONFLICT" }, 409);
    return json({ status: "QUEUE_WRITE_FAILED", reason: "DURABLE_OUTBOX_WRITE_FAILED" }, 500);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return json({ status: "QUEUE_WRITE_UNCONFIRMED", reason: "OUTBOX_ROW_NOT_RETURNED" }, 502);
  return json({
    status: "QUEUED",
    queued: true,
    jobId: row.id,
    jobStatus: row.status,
    postgresTruthPreserved: true,
    airtableMirrorOnly: true,
    productionReady: false
  }, 202);
});
