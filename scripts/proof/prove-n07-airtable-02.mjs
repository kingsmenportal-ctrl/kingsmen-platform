import fs from "node:fs";

const required = [
  "docs/n07/N07_AIRTABLE_02_MIRROR_JOB_QUEUE_WORKER_DLQ.md",
  "manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json",
  "packages/contracts/src/n07-airtable-mirror-job-contract.ts",
  "packages/contracts/src/n07-airtable-worker-contract.ts",
  "packages/db/src/n07-airtable-mirror-schema.sql",
  "packages/db/src/n07-airtable-mirror-repository.ts",
  "packages/db/src/n07-airtable-dlq-repository.ts",
  "packages/backend/src/n07/airtable-mirror-worker.ts",
  "packages/backend/src/n07/airtable-idempotency-policy.ts",
  "scripts/validators/validate-n07-airtable-02.mjs",
  "reports/n07/n07-airtable-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-02-mirror-job-queue-worker-dlq.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.mirrorJobSchemaBuilt !== true) failures.push("mirrorJobSchemaBuilt must be true");
if (manifest.dlqPersistenceBuilt !== true) failures.push("dlqPersistenceBuilt must be true");
if (manifest.missingCredentialsDegradeGracefully !== true) failures.push("missingCredentialsDegradeGracefully must be true");
if (manifest.airtableTruthAuthorityBlocked !== true) failures.push("airtableTruthAuthorityBlocked must be true");

const report = {
  schema: "kingsmen.n07-airtable-02-proof.v1",
  module: "N07-AIRTABLE-02 - Mirror Job Schema / Queue Worker / DLQ Persistence Boundary",
  status: failures.length === 0 ? "N07_AIRTABLE_MIRROR_JOB_QUEUE_WORKER_DLQ_PROVEN" : "N07_AIRTABLE_MIRROR_JOB_QUEUE_WORKER_DLQ_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  mirrorJobSchemaBuilt: manifest.mirrorJobSchemaBuilt === true,
  queueJobContractBuilt: manifest.queueJobContractBuilt === true,
  dlqPersistenceBuilt: manifest.dlqPersistenceBuilt === true,
  mirrorWorkerPolicyBuilt: manifest.mirrorWorkerPolicyBuilt === true,
  retryDisciplineBuilt: manifest.retryDisciplineBuilt === true,
  idempotencyBoundaryBuilt: manifest.idempotencyBoundaryBuilt === true,
  missingCredentialsDegradeGracefully: manifest.missingCredentialsDegradeGracefully === true,
  airtableTruthAuthorityBlocked: manifest.airtableTruthAuthorityBlocked === true,
  oracleLiteWorkerLimitsEnforced: manifest.oracleLiteWorkerLimitsEnforced === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N07-AIRTABLE-03 - base/table mapping, mirror transforms, and provider health read model."
    : "Repair N07-AIRTABLE-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n07", { recursive: true });
fs.writeFileSync("reports/n07/n07-airtable-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-02 proof passed.");