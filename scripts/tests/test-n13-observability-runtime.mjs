import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deriveN13RuntimeHealthStatus } from "../../supabase/functions/n13-observability-runtime/policy.mjs";

const functionSource = readFileSync(
  new URL("../../supabase/functions/n13-observability-runtime/index.ts", import.meta.url),
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

for (const required of [
  "auth.getUser(bearer)",
  '"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"',
  "CAPTURE_RATE_LIMITED",
  "MAX_CAPTURE_AGE_SECONDS = 60",
  'eq("role_code", "PLATFORM_ADMIN")',
  '.is("revoked_at", null)',
  'Deno.serve(async (req: Request)',
  'req.method !== "GET" && req.method !== "POST"',
  'from("system_health_snapshots").insert(snapshot)',
  'from("service_health_checks").insert(checks)',
  'from("metric_samples").insert(metricRows)',
  'verify_jwt',
  "productionReady: false"
]) {
  assert.ok(functionSource.includes(required), "Missing runtime security or persistence contract: " + required);
}
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
