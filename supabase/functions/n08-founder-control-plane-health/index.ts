import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://kingsmen-portal-staging.netlify.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const ALLOWED_FOUNDER_ROLES = ["PLATFORM_ADMIN"];

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
async function count(admin: any, table: string, column?: string, values?: string[]) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  if (column && values) query = query.in(column, values);
  const { count: total, error } = await query;
  return { count: total ?? 0, available: !error, errorCode: error ? "HEALTH_QUERY_FAILED" : null };
}
async function oldestPendingAgeMinutes(admin: any) {
  const { data, error } = await admin.from("airtable_sync_outbox")
    .select("created_at").eq("status", "PENDING").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) return { minutes: null, available: false };
  if (!data?.created_at) return { minutes: 0, available: true };
  return { minutes: Math.max(0, Math.floor((Date.now() - Date.parse(data.created_at)) / 60000)), available: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ status: "METHOD_NOT_ALLOWED" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ status: "CONFIGURATION_ERROR" }, 500);

  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!bearer) return json({ status: "UNAUTHENTICATED" }, 401);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  if (tokenRole(req) !== "service_role") {
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !userData.user) return json({ status: "UNAUTHENTICATED" }, 401);
    const { data: reviewer, error: reviewerError } = await admin.from("platform_reviewers")
      .select("role_code").eq("auth_user_id", userData.user.id).eq("is_active", true)
      .is("revoked_at", null).in("role_code", ALLOWED_FOUNDER_ROLES).limit(1).maybeSingle();
    if (reviewerError) return json({ status: "AUTHORIZATION_LOOKUP_FAILED" }, 500);
    if (!reviewer) return json({ status: "FORBIDDEN", reason: "FOUNDER_ADMIN_GRANT_REQUIRED" }, 403);
  }

  const [outboxPending, outboxActive, outboxFailed, outboxDlq, submissionBacklog,
    commandWaiting, escalationOpen, ingestionFailed, activeTargets, activeReviewers, oldest] = await Promise.all([
    count(admin, "airtable_sync_outbox", "status", ["PENDING"]),
    count(admin, "airtable_sync_outbox", "status", ["LOCKED"]),
    count(admin, "airtable_sync_outbox", "status", ["FAILED"]),
    count(admin, "airtable_sync_outbox", "status", ["DEAD_LETTER"]),
    count(admin, "candidate_application_submission_jobs", "job_status", ["QUEUED", "PENDING", "READY", "AUTHORIZED", "RUNNING"]),
    count(admin, "founder_command_requests", "command_status", ["SUBMITTED", "WAITING_APPROVAL", "GOVERNANCE_BLOCKED"]),
    count(admin, "founder_escalation_threads", "escalation_status", ["OPEN", "ASSIGNED", "WAITING_APPROVAL"]),
    count(admin, "n15_ingestion_runs", "status", ["FAILED"]),
    count(admin, "airtable_sync_targets", "is_active", ["true"]),
    count(admin, "platform_reviewers", "is_active", ["true"]),
    oldestPendingAgeMinutes(admin)
  ]);

  const queue = {
    name: "airtable_mirror_outbox",
    waiting: outboxPending.count,
    active: outboxActive.count,
    failed: outboxFailed.count,
    deadLettered: outboxDlq.count,
    oldestWaitingAgeMinutes: oldest.minutes,
    available: [outboxPending, outboxActive, outboxFailed, outboxDlq].every(x => x.available) && oldest.available
  };
  const queueSafe = queue.waiting <= 500 && queue.active <= 25 && queue.failed <= 50
    && queue.deadLettered <= 10 && (queue.oldestWaitingAgeMinutes ?? 999999) <= 120;
  const stopSellingRecommended = queue.waiting > 500 || queue.deadLettered > 10 || !queue.available;
  const degradedCount = [
    !queue.available, !submissionBacklog.available, !commandWaiting.available,
    !escalationOpen.available, !ingestionFailed.available, !activeTargets.available,
    !activeReviewers.available, activeTargets.count === 0, activeReviewers.count === 0
  ].filter(Boolean).length;

  return json({
    schema: "kingsmen.n08-live-founder-health.v1",
    observedAt: new Date().toISOString(),
    status: degradedCount > 0 || !queueSafe ? "DEGRADED" : "OBSERVED",
    productionReady: false,
    sourceOfTruth: "PostgreSQL",
    airtableRole: "OPTIONAL_ASYNC_MIRROR",
    queue,
    operationalQueues: {
      candidateSubmissionsWaiting: submissionBacklog,
      founderCommandsAwaitingAction: commandWaiting,
      openEscalations: escalationOpen,
      failedOpportunityIngestionRuns: ingestionFailed
    },
    integrationReadiness: {
      activeAirtableTargets: activeTargets,
      activePlatformReviewerGrants: activeReviewers,
      airtableConnectionCanBlockCandidateFlows: false
    },
    controls: {
      oracleLiteQueueSafe: queueSafe,
      stopSellingRecommended,
      founderReviewRequired: degradedCount > 0 || !queueSafe,
      piiReturned: false,
      candidateRecordsReturned: false,
      productionReady: false
    },
    degradedSignals: degradedCount
  });
});
