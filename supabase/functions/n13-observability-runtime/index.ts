import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { deriveN13RuntimeHealthStatus, projectN13FounderSnapshot } from "./policy.mjs";

// Deployment contract: this founder-only function must be published with verify_jwt=true.

const ALLOWED_ORIGINS = new Set([
  "https://kingsmen-portal-staging.netlify.app"
]);
const ACTIVE_CANDIDATE_CAP = 500;
const MAX_CAPTURE_AGE_SECONDS = 60;

function responseHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://kingsmen-portal-staging.netlify.app";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(req) });
}

function tokenRole(req: Request): string {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)).role ?? "";
  } catch {
    return "";
  }
}

async function authorizeFounder(req: Request, url: string, anonKey: string, admin: any) {
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!bearer) return { ok: false, status: 401, reason: "UNAUTHENTICATED" };

  // Do not trust an unverified JWT payload role or allow service-role tokens
  // to bypass Founder authorization. Every caller must resolve to a real user
  // through Supabase Auth and hold an active, non-revoked PLATFORM_ADMIN grant.
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData, error: authError } = await authClient.auth.getUser(bearer);
  if (authError || !userData.user) {
    return { ok: false, status: 401, reason: "UNAUTHENTICATED" };
  }

  const { data: reviewer, error: reviewerError } = await admin
    .from("platform_reviewers")
    .select("role_code")
    .eq("auth_user_id", userData.user.id)
    .eq("is_active", true)
    .is("revoked_at", null)
    .eq("role_code", "PLATFORM_ADMIN")
    .limit(1)
    .maybeSingle();

  if (reviewerError) {
    return { ok: false, status: 500, reason: "FOUNDER_AUTHORIZATION_LOOKUP_FAILED" };
  }
  if (!reviewer) {
    return { ok: false, status: 403, reason: "FOUNDER_ADMIN_GRANT_REQUIRED" };
  }

  return { ok: true, actorRef: "FOUNDER_ADMIN" };
}

async function countRows(
  admin: any,
  table: string,
  filters: Array<{ column: string; value: unknown; mode?: "eq" | "in" }>
) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  for (const filter of filters) {
    if (filter.mode === "in") query = query.in(filter.column, filter.value as unknown[]);
    else query = query.eq(filter.column, filter.value);
  }
  const { count, error } = await query;
  return {
    count: count ?? 0,
    available: !error,
    errorCode: error ? "HEALTH_QUERY_FAILED" : null
  };
}

function metric(
  name: string,
  domain: string,
  value: number,
  warningThreshold: number | null,
  criticalThreshold: number | null,
  tags: Record<string, unknown> = {},
  available = true
) {
  const status = !available
    ? "UNKNOWN"
    : criticalThreshold !== null && value >= criticalThreshold
      ? "CRITICAL"
      : warningThreshold !== null && value >= warningThreshold
        ? "WARN"
        : "OK";
  return {
    metric_ref: "n13_metric_" + crypto.randomUUID(),
    metric_name: name,
    metric_domain: domain,
    metric_value: value,
    metric_unit: "count",
    warning_threshold: warningThreshold,
    critical_threshold: criticalThreshold,
    status,
    tags: { ...tags, data_available: available },
    sampled_at: new Date().toISOString()
  };
}

async function readLatest(admin: any, req: Request): Promise<Response> {
  const [{ data: snapshots, error: snapshotError }, { data: services, error: servicesError }] = await Promise.all([
    admin.from("system_health_snapshots")
      .select("snapshot_ref,status,active_candidates,active_candidate_cap,pending_workflows,failed_workflows,document_backlog,manual_fallback_backlog,payment_pending_count,source_review_backlog,incident_open_count,oracle_lite_pressure,summary,captured_at")
      .order("captured_at", { ascending: false }).limit(1),
    admin.from("service_health_checks")
      .select("check_ref,service_name,service_domain,status,latency_ms,reason,fix_path,checked_at")
      .order("checked_at", { ascending: false }).limit(10)
  ]);

  if (snapshotError || servicesError) {
    return json(req, { status: "OBSERVABILITY_READ_FAILED", productionReady: false }, 500);
  }

  return json(req, {
    schema: "kingsmen.n13-founder-observability.v1",
    status: snapshots?.[0]?.status ?? "UNKNOWN",
    coverage: "PARTIAL",
    productionReady: false,
    latestSnapshot: projectN13FounderSnapshot(snapshots?.[0] ?? null),
    serviceChecks: services ?? [],
    sourceOfTruth: "Supabase PostgreSQL",
    note: "Only Supabase Auth and PostgreSQL are verified by this capture. External provider and delivery health is not inferred."
  });
}

async function capture(admin: any, req: Request, actorRef: string): Promise<Response> {
  const startedAt = performance.now();
  const observedAt = new Date().toISOString();
  const { data: recentCapture, error: recentCaptureError } = await admin
    .from("system_health_snapshots")
    .select("snapshot_ref,captured_at,status")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentCaptureError) {
    return json(req, { status: "OBSERVABILITY_RATE_LIMIT_LOOKUP_FAILED", productionReady: false }, 500);
  }
  if (recentCapture?.captured_at) {
    const ageMs = Date.now() - Date.parse(recentCapture.captured_at);
    if (ageMs >= 0 && ageMs < MAX_CAPTURE_AGE_SECONDS * 1000) {
      return json(req, {
        status: "CAPTURE_RATE_LIMITED",
        retryAfterSeconds: Math.ceil((MAX_CAPTURE_AGE_SECONDS * 1000 - ageMs) / 1000),
        latestSnapshotRef: recentCapture.snapshot_ref,
        latestStatus: recentCapture.status
      }, 429);
    }
  }

  const activeCandidates = await countRows(admin, "candidates", [
    { column: "is_active", value: true }
  ]);

  const [
    pendingWorkflows,
    failedWorkflows,
    pendingDocuments,
    manualFallbackBacklog,
    paymentPending,
    sourceReviewBacklog,
    openIncidents,
    openSev1,
    openSev2,
    deadLetters,
    airtablePending,
    airtableLocked,
    airtableFailed,
    airtableDeadLettered
  ] = await Promise.all([
    countRows(admin, "workflow_runs", [{ column: "status", value: ["DEFERRED", "MANUAL_REQUIRED"], mode: "in" }]),
    countRows(admin, "workflow_runs", [{ column: "status", value: "FAILED" }]),
    countRows(admin, "candidate_private_documents", [{ column: "status", value: ["UPLOAD_PENDING", "UPLOADED_CANDIDATE_REPORTED", "UNDER_REVIEW"], mode: "in" }]),
    countRows(admin, "candidate_application_submission_jobs", [{ column: "job_status", value: "MANUAL_REQUIRED" }]),
    countRows(admin, "payfast_payment_intents", [{ column: "intent_status", value: ["CREATED", "REDIRECTED", "ITN_RECEIVED"], mode: "in" }]),
    countRows(admin, "external_source_observations", [{ column: "observation_status", value: "NEEDS_REVIEW" }]),
    countRows(admin, "incident_events", [{ column: "status", value: ["OPEN", "ACKNOWLEDGED", "MITIGATING"], mode: "in" }]),
    countRows(admin, "incident_events", [
      { column: "severity", value: "SEV1" },
      { column: "status", value: ["OPEN", "ACKNOWLEDGED", "MITIGATING"], mode: "in" }
    ]),
    countRows(admin, "incident_events", [
      { column: "severity", value: "SEV2" },
      { column: "status", value: ["OPEN", "ACKNOWLEDGED", "MITIGATING"], mode: "in" }
    ]),
    countRows(admin, "integration_dead_letter_queue", [{ column: "status", value: "OPEN" }]),
    countRows(admin, "airtable_sync_outbox", [{ column: "status", value: "PENDING" }]),
    countRows(admin, "airtable_sync_outbox", [{ column: "status", value: "LOCKED" }]),
    countRows(admin, "airtable_sync_outbox", [{ column: "status", value: "FAILED" }]),
    countRows(admin, "airtable_sync_outbox", [{ column: "status", value: "DEAD_LETTER" }])
  ]);

  const metrics = {
    activeCandidates,
    pendingWorkflows,
    failedWorkflows,
    pendingDocuments,
    manualFallbackBacklog,
    paymentPending,
    sourceReviewBacklog,
    openIncidents,
    openSev1,
    openSev2,
    deadLetters,
    airtablePending,
    airtableLocked,
    airtableFailed,
    airtableDeadLettered
  };
  const queryResults = Object.values(metrics);
  const dataErrors = queryResults.filter((item) => !item.available).length;
  const dataComplete = dataErrors === 0 && activeCandidates.available;
  const active = activeCandidates.count;
  const healthStatus = deriveN13RuntimeHealthStatus({
    dataComplete,
    dataErrors,
    activeCandidates: active,
    activeCandidateCap: ACTIVE_CANDIDATE_CAP,
    openSev1Count: openSev1.count,
    openSev2Count: openSev2.count,
    failedWorkflows: failedWorkflows.count,
    pendingDocuments: pendingDocuments.count,
    manualFallbackBacklog: manualFallbackBacklog.count,
    deadLetterCount: deadLetters.count + airtableDeadLettered.count,
    openIncidents: openIncidents.count,
    downServices: 0,
    externalServiceCoverageComplete: false
  });
  const elapsedMs = Math.max(0, Math.round(performance.now() - startedAt));
  const snapshotRef = "n13_health_" + crypto.randomUUID();
  const evidenceRefs = [
    "supabase-edge:n13-observability-runtime",
    "aggregate-count-queries:" + observedAt,
    "founder-actor:" + actorRef
  ];
  const unavailableMetrics = Object.entries(metrics)
    .filter(([, item]) => !item.available)
    .map(([name]) => name)
    .sort();
  const summary = dataComplete
    ? "PARTIAL OBSERVATION: Supabase Auth and PostgreSQL responded. External provider, email, Netlify, worker and backup health are not probed; GREEN is withheld until coverage is complete."
    : "OBSERVATION INCOMPLETE: unavailable aggregate reads: " + unavailableMetrics.join(", ") +
      ". Health remains UNKNOWN. The legacy snapshot table requires non-null integer counters; stored zero placeholders are not measured zeroes and are suppressed in the Founder read model.";

  const snapshot = {
    snapshot_ref: snapshotRef,
    status: healthStatus,
    active_candidates: active,
    active_candidate_cap: ACTIVE_CANDIDATE_CAP,
    pending_workflows: pendingWorkflows.count,
    failed_workflows: failedWorkflows.count,
    document_backlog: pendingDocuments.count,
    manual_fallback_backlog: manualFallbackBacklog.count,
    payment_pending_count: paymentPending.count,
    source_review_backlog: sourceReviewBacklog.count,
    incident_open_count: openIncidents.count,
    oracle_lite_pressure: !activeCandidates.available
      ? "HIGH"
      : active > ACTIVE_CANDIDATE_CAP
        ? "CRITICAL"
        : active >= ACTIVE_CANDIDATE_CAP * 0.85
          ? "HIGH"
          : active >= ACTIVE_CANDIDATE_CAP * 0.7
            ? "MEDIUM"
            : "LOW",
    summary,
    evidence_refs: evidenceRefs,
    captured_at: observedAt
  };

  const { error: snapshotInsertError } = await admin.from("system_health_snapshots").insert(snapshot);
  if (snapshotInsertError) {
    return json(req, { status: "OBSERVABILITY_CAPTURE_FAILED", productionReady: false }, 500);
  }

  const checks = [
    {
      check_ref: "n13_service_" + crypto.randomUUID(),
      service_name: "Supabase PostgreSQL",
      service_domain: "POSTGRES",
      status: dataComplete ? "UP" : "UNKNOWN",
      latency_ms: elapsedMs,
      error_rate: dataComplete ? 0 : null,
      last_success_at: dataComplete ? observedAt : null,
      last_failure_at: dataComplete ? null : observedAt,
      reason: dataComplete ? "Aggregate read-only checks completed." : "One or more aggregate health queries failed.",
      fix_path: dataComplete ? "Continue monitoring; external services still require dedicated probes." : "Inspect database schema, privileges and aggregate query errors.",
      evidence_refs: evidenceRefs,
      checked_at: observedAt
    },
    {
      check_ref: "n13_service_" + crypto.randomUUID(),
      service_name: "Supabase Auth",
      service_domain: "SUPABASE",
      status: "UP",
      latency_ms: null,
      error_rate: 0,
      last_success_at: observedAt,
      last_failure_at: null,
      reason: "Founder JWT was resolved by Supabase Auth and the active Founder grant was checked.",
      fix_path: "Continue monitoring authentication and reviewer grants.",
      evidence_refs: ["supabase-auth:getUser", "founder-role:PLATFORM_ADMIN"],
      checked_at: observedAt
    }
  ];
  const { error: checksInsertError } = await admin.from("service_health_checks").insert(checks);
  if (checksInsertError) {
    return json(req, { status: "OBSERVABILITY_SERVICE_CHECK_WRITE_FAILED", productionReady: false }, 500);
  }

  const metricRows = [
    metric("active_candidates", "CAPACITY", active, 400, ACTIVE_CANDIDATE_CAP, { cap: ACTIVE_CANDIDATE_CAP }, activeCandidates.available),
    metric("failed_workflows", "WORKFLOW", failedWorkflows.count, 1, 10, {}, failedWorkflows.available),
    metric("pending_documents", "DOCUMENT", pendingDocuments.count, 10, 50, {}, pendingDocuments.available),
    metric("manual_fallback_backlog", "QUEUE", manualFallbackBacklog.count, 10, 50, {}, manualFallbackBacklog.available),
    metric("pending_payments", "FINANCE", paymentPending.count, 10, 50, {}, paymentPending.available),
    metric("source_review_backlog", "QUEUE", sourceReviewBacklog.count, 100, 500, {}, sourceReviewBacklog.available),
    metric("open_incidents", "RISK", openIncidents.count, 1, 5, {}, openIncidents.available),
    metric("integration_dead_letters", "QUEUE", deadLetters.count + airtableDeadLettered.count, 1, 10, {}, deadLetters.available && airtableDeadLettered.available),
    metric("airtable_outbox_pending", "QUEUE", airtablePending.count, 100, 500, {}, airtablePending.available),
    metric("airtable_outbox_failed", "QUEUE", airtableFailed.count, 1, 50, {}, airtableFailed.available)
  ].map((row) => ({ ...row, tags: { ...row.tags, coverage: dataComplete ? "OBSERVED" : "PARTIAL" } }));

  const { error: metricsInsertError } = await admin.from("metric_samples").insert(metricRows);
  if (metricsInsertError) {
    return json(req, { status: "OBSERVABILITY_METRIC_WRITE_FAILED", productionReady: false }, 500);
  }

  return json(req, {
    schema: "kingsmen.n13-founder-observability.v1",
    status: healthStatus,
    coverage: "PARTIAL",
    productionReady: false,
    snapshotRef,
    capturedAt: observedAt,
    captureDurationMs: elapsedMs,
    aggregateMetrics: {
      activeCandidates: activeCandidates.available ? active : null,
      activeCandidateCap: ACTIVE_CANDIDATE_CAP,
      pendingWorkflows: pendingWorkflows.available ? pendingWorkflows.count : null,
      failedWorkflows: failedWorkflows.available ? failedWorkflows.count : null,
      pendingDocuments: pendingDocuments.available ? pendingDocuments.count : null,
      manualFallbackBacklog: manualFallbackBacklog.available ? manualFallbackBacklog.count : null,
      paymentPending: paymentPending.available ? paymentPending.count : null,
      sourceReviewBacklog: sourceReviewBacklog.available ? sourceReviewBacklog.count : null,
      openIncidents: openIncidents.available ? openIncidents.count : null,
      deadLetters: deadLetters.available && airtableDeadLettered.available
        ? deadLetters.count + airtableDeadLettered.count
        : null,
      airtableOutbox: {
        pending: airtablePending.available ? airtablePending.count : null,
        locked: airtableLocked.available ? airtableLocked.count : null,
        failed: airtableFailed.available ? airtableFailed.count : null,
        deadLettered: airtableDeadLettered.available ? airtableDeadLettered.count : null
      }
    },
    dataErrors,
    unavailableMetrics,
    note: summary
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(req) });
  if (req.method !== "GET" && req.method !== "POST") {
    return json(req, { status: "METHOD_NOT_ALLOWED" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) {
    return json(req, { status: "CONFIGURATION_ERROR" }, 500);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const authz = await authorizeFounder(req, url, anonKey, admin);
  if (!authz.ok) {
    return json(req, { status: authz.reason }, authz.status);
  }

  if (req.method === "GET") return await readLatest(admin, req);
  return await capture(admin, req, authz.actorRef);
});
