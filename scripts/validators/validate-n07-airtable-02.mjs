import fs from "node:fs";

const requiredFiles = [
  "docs/n07/N07_AIRTABLE_02_MIRROR_JOB_QUEUE_WORKER_DLQ.md",
  "manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json",
  "packages/contracts/src/n07-airtable-mirror-job-contract.ts",
  "packages/contracts/src/n07-airtable-worker-contract.ts",
  "packages/db/src/n07-airtable-mirror-schema.sql",
  "packages/db/src/n07-airtable-mirror-repository.ts",
  "packages/db/src/n07-airtable-dlq-repository.ts",
  "packages/backend/src/n07/airtable-mirror-worker.ts",
  "packages/backend/src/n07/airtable-idempotency-policy.ts",
  "reports/n07/n07-airtable-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json")
  ? JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json", "utf8"))
  : {};

for (const key of [
  "requiresN07Airtable01",
  "mirrorJobSchemaBuilt",
  "queueJobContractBuilt",
  "dlqPersistenceBuilt",
  "mirrorWorkerPolicyBuilt",
  "retryDisciplineBuilt",
  "idempotencyBoundaryBuilt",
  "missingCredentialsDegradeGracefully",
  "airtableTruthAuthorityBlocked",
  "oracleLiteWorkerLimitsEnforced"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const sql = fs.existsSync("packages/db/src/n07-airtable-mirror-schema.sql")
  ? fs.readFileSync("packages/db/src/n07-airtable-mirror-schema.sql", "utf8")
  : "";

for (const phrase of [
  "create table if not exists airtable_mirror_jobs",
  "create table if not exists airtable_mirror_dlq",
  "create or replace view airtable_mirror_job_health_view",
  "alter table airtable_mirror_jobs enable row level security",
  "alter table airtable_mirror_dlq enable row level security"
]) {
  if (!sql.includes(phrase)) failures.push(`Mirror schema missing ${phrase}`);
}

const worker = fs.existsSync("packages/backend/src/n07/airtable-mirror-worker.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-mirror-worker.ts", "utf8")
  : "";

for (const phrase of ["skipped_degraded", "mirrored", "providerConfigured", "liveClaimAllowed: false"]) {
  if (!worker.includes(phrase)) failures.push(`Mirror worker missing ${phrase}`);
}

const idempotency = fs.existsSync("packages/backend/src/n07/airtable-idempotency-policy.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-idempotency-policy.ts", "utf8")
  : "";

if (!idempotency.includes("n07_airtable")) failures.push("Idempotency policy missing n07_airtable namespace");

const report = {
  schema: "kingsmen.n07-airtable-02-validation.v1",
  module: "N07-AIRTABLE-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n07-airtable-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-02 validation passed.");