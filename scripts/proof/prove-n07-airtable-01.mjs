import fs from "node:fs";

const required = [
  "docs/n07/N07_AIRTABLE_01_MIRROR_BOUNDARY_ASYNC_SYNC_PROVIDER_GATE.md",
  "manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json",
  "packages/contracts/src/n07-airtable-provider-contract.ts",
  "packages/contracts/src/n07-airtable-base-map-contract.ts",
  "packages/backend/src/n07/airtable-mirror-policy.ts",
  "packages/backend/src/n07/airtable-sync-queue-policy.ts",
  "packages/backend/src/n07/airtable-provider-gate.ts",
  "packages/db/src/n07-airtable-base-map.ts",
  "packages/db/src/n07-airtable-sync-policy.ts",
  "scripts/validators/validate-n07-airtable-01.mjs",
  "reports/n06/n06-route-05-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-01-mirror-boundary-async-sync-provider-gate.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.postgresTruthPreserved !== true) failures.push("postgresTruthPreserved must be true");
if (manifest.airtableMirrorOnly !== true) failures.push("airtableMirrorOnly must be true");
if (manifest.airtableCannotGovernTruth !== true) failures.push("airtableCannotGovernTruth must be true");
if (manifest.twelveBaseMapBuilt !== true) failures.push("twelveBaseMapBuilt must be true");

const report = {
  schema: "kingsmen.n07-airtable-01-proof.v1",
  module: "N07-AIRTABLE-01 - Airtable Mirror Boundary / Async Sync Doctrine / Provider Proof Gate",
  status: failures.length === 0 ? "N07_AIRTABLE_MIRROR_BOUNDARY_ASYNC_SYNC_PROVIDER_GATE_PROVEN" : "N07_AIRTABLE_MIRROR_BOUNDARY_ASYNC_SYNC_PROVIDER_GATE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  postgresTruthPreserved: manifest.postgresTruthPreserved === true,
  airtableMirrorOnly: manifest.airtableMirrorOnly === true,
  airtableCannotGovernTruth: manifest.airtableCannotGovernTruth === true,
  asyncQueueSyncBuilt: manifest.asyncQueueSyncBuilt === true,
  batchSyncDisciplineBuilt: manifest.batchSyncDisciplineBuilt === true,
  missingCredentialsDegradeGracefully: manifest.missingCredentialsDegradeGracefully === true,
  providerProofGateBuilt: manifest.providerProofGateBuilt === true,
  oracleLiteSyncLimitsEnforced: manifest.oracleLiteSyncLimitsEnforced === true,
  twelveBaseMapBuilt: manifest.twelveBaseMapBuilt === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N07-AIRTABLE-02 - mirror job schema, queue worker, and DLQ persistence boundary."
    : "Repair N07-AIRTABLE-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n07", { recursive: true });
fs.writeFileSync("reports/n07/n07-airtable-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-01 proof passed.");