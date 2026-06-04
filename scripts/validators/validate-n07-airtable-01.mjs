import fs from "node:fs";

const requiredFiles = [
  "docs/n07/N07_AIRTABLE_01_MIRROR_BOUNDARY_ASYNC_SYNC_PROVIDER_GATE.md",
  "manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json",
  "packages/contracts/src/n07-airtable-provider-contract.ts",
  "packages/contracts/src/n07-airtable-base-map-contract.ts",
  "packages/backend/src/n07/airtable-mirror-policy.ts",
  "packages/backend/src/n07/airtable-sync-queue-policy.ts",
  "packages/backend/src/n07/airtable-provider-gate.ts",
  "packages/db/src/n07-airtable-base-map.ts",
  "packages/db/src/n07-airtable-sync-policy.ts",
  "reports/n06/n06-route-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json")
  ? JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json", "utf8"))
  : {};

for (const key of [
  "requiresN06Route05",
  "postgresTruthPreserved",
  "airtableMirrorOnly",
  "airtableCannotGovernTruth",
  "asyncQueueSyncBuilt",
  "batchSyncDisciplineBuilt",
  "missingCredentialsDegradeGracefully",
  "providerProofGateBuilt",
  "oracleLiteSyncLimitsEnforced",
  "twelveBaseMapBuilt"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const mirrorPolicy = fs.existsSync("packages/backend/src/n07/airtable-mirror-policy.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-mirror-policy.ts", "utf8")
  : "";

for (const phrase of ["PostgreSQL must remain truth", "Airtable is async mirror only", "mirror cannot govern truth action", "provider live claim requires proof gate"]) {
  if (!mirrorPolicy.includes(phrase)) failures.push(`Mirror policy missing ${phrase}`);
}

const queuePolicy = fs.existsSync("packages/backend/src/n07/airtable-sync-queue-policy.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-sync-queue-policy.ts", "utf8")
  : "";

for (const phrase of ["minBatchIntervalMinutes: 15", "maxRecordsPerBatch: 50", "maxConcurrentSyncWorkers: 1", "DLQ is required"]) {
  if (!queuePolicy.includes(phrase)) failures.push(`Queue policy missing ${phrase}`);
}

const baseMap = fs.existsSync("packages/db/src/n07-airtable-base-map.ts")
  ? fs.readFileSync("packages/db/src/n07-airtable-base-map.ts", "utf8")
  : "";

for (const baseName of [
  "Kingsman Nexus-7",
  "Applications Hub",
  "Document Vault",
  "Partner Ecosystem Directory",
  "Kingsmen Financial Operations"
]) {
  if (!baseMap.includes(baseName)) failures.push(`Base map missing ${baseName}`);
}

if (!baseMap.includes("N07_AIRTABLE_BASE_MAP.length !== 12")) {
  failures.push("Base map must validate exactly 12 bases");
}

const report = {
  schema: "kingsmen.n07-airtable-01-validation.v1",
  module: "N07-AIRTABLE-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n07-airtable-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-01 validation passed.");