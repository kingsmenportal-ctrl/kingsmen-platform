import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deriveN13RuntimeHealthStatus, projectN13FounderSnapshot } from "../../supabase/functions/n13-observability-runtime/policy.mjs";

const functionSource = readFileSync(
  new URL("../../supabase/functions/n13-observability-runtime/index.ts", import.meta.url),
  "utf8"
);
const policySource = readFileSync(
  new URL("../../supabase/functions/n13-observability-runtime/policy.mjs", import.meta.url),
  "utf8"
);
const migrationSource = readFileSync(
  new URL("../../supabase/migrations/20261101170000_n13_atomic_observability_capture.sql", import.meta.url),
  "utf8"
);

assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: false, dataErrors: 1 }),
  "UNKNOWN",
  "incomplete telemetry must never be treated as zero or green"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, openSev1Count: 1 }),
  "RED",
  "an open SEV1 incident must make health RED"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, activeCandidates: 501, activeCandidateCap: 500 }),
  "RED",
  "the 500 active-candidate boundary must be enforced in health derivation"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, openSev2Count: 1 }),
  "AMBER",
  "an open SEV2 incident must prevent green status"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, failedWorkflows: 1 }),
  "AMBER",
  "failed workflows must prevent green status"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, externalServiceCoverageComplete: false }),
  "AMBER",
  "unprobed external services must prevent green status"
);
assert.equal(
  deriveN13RuntimeHealthStatus({ dataComplete: true, externalServiceCoverageComplete: true }),
  "GREEN",
  "green is allowed only after complete telemetry and service coverage"
);

const incompleteProjection = projectN13FounderSnapshot({
  status: "UNKNOWN",
  active_candidates: 0,
  pending_workflows: 0,
  failed_workflows: 0,
  document_backlog: 0,
  manual_fallback_backlog: 0,
  payment_pending_count: 0,
  source_review_backlog: 0,
  incident_open_count: 0,
  active_candidate_cap: 500
});
assert.equal(incompleteProjection.metricCountsAvailable, false);
for (const field of [
  "active_candidates",
  "pending_workflows",
  "failed_workflows",
  "document_backlog",
  "manual_fallback_backlog",
  "payment_pending_count",
  "source_review_backlog",
  "incident_open_count"
]) {
  assert.equal(incompleteProjection[field], null, "unavailable " + field + " must not be presented as zero");
}
const completeProjection = projectN13FounderSnapshot({
  status: "AMBER",
  active_candidates: 12,
  pending_workflows: 2,
  active_candidate_cap: 500
});
assert.equal(completeProjection.metricCountsAvailable, true);
assert.equal(completeProjection.active_candidates, 12, "complete aggregate values must remain visible");
assert.equal(projectN13FounderSnapshot(null), null);

for (const required of [
  "auth.getUser(bearer)",
  '"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"',
  "CAPTURE_RATE_LIMITED",
  '.select("id, role_code")',
  'actorRef: "FOUNDER_REVIEWER:" + reviewer.id',
  'admin.rpc("n13_commit_observability_capture"',
  "capture_ref: snapshotRef",
  "ACTIVE_CANDIDATE_CAP + 1",
  'eq("role_code", "PLATFORM_ADMIN")',
  '.is("revoked_at", null)',
  'Deno.serve(async (req: Request)',
  'req.method !== "GET" && req.method !== "POST"',
  'verify_jwt',
  "productionReady: false",
  "projectN13FounderSnapshot",
  "unavailableMetrics",
  "data_available: available"
]) {
  assert.ok(functionSource.includes(required), "Missing runtime security or persistence contract: " + required);
}
assert.ok(migrationSource.includes("SECURITY DEFINER"), "Atomic capture must run in a database transaction under a constrained function.");
assert.ok(migrationSource.includes("SET search_path = pg_catalog"), "The privileged capture function must pin a safe search_path.");
assert.ok(migrationSource.includes("pg_advisory_xact_lock"), "Capture cooldown must be serialized at the database boundary.");
assert.ok(migrationSource.includes("n13_capture_rate_limited"), "The database function must return rate-limit evidence without partial writes.");
assert.ok(migrationSource.includes("jsonb_to_record") && migrationSource.includes("jsonb_to_recordset"), "All capture records must be decoded and inserted by the same RPC transaction.");
assert.ok(migrationSource.includes("system_health_snapshots") && migrationSource.includes("service_health_checks") && migrationSource.includes("metric_samples"), "The atomic operation must persist all three evidence classes.");
assert.ok(migrationSource.includes("revoke all on function") && migrationSource.includes("grant execute on function") && migrationSource.includes("TO service_role"), "Only service_role may invoke the capture RPC.");
assert.ok(policySource.includes("metricCountsAvailable"), "The founder read-model projection must explicitly mark counter availability.");
assert.ok(policySource.includes("SNAPSHOT_COUNT_FIELDS") && policySource.includes("projected[field] = null"),
  "Unknown counter placeholders must be suppressed from the Founder read model.");
assert.ok(!functionSource.includes("function tokenRole("), "No unverified JWT role decoder may remain in the Founder runtime.");
assert.ok(!/select\(["']\*["']\)/.test(functionSource), "The founder runtime must not select entire database rows.");
for (const sensitiveField of ['select("email', 'select("phone', 'select("candidate_id', 'select("document_url', 'select("id_number']) {
  assert.ok(!functionSource.includes(sensitiveField), "The founder runtime must not select candidate PII or ownership identifiers: " + sensitiveField);
}

console.log(JSON.stringify({
  status: "PASS",
  module: "N13 Founder Observability Runtime",
  checks: [
    "incomplete query data fails to UNKNOWN",
    "SEV1 and active-candidate cap breaches fail to RED",
    "SEV2, failed workflows and partial service coverage remain AMBER",
    "GREEN requires complete telemetry and complete external service coverage",
    "founder authentication and PLATFORM_ADMIN authorization are required",
    "aggregate snapshots, service checks and metrics persist without candidate detail"
  ]
}, null, 2));
