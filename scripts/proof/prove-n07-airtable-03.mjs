import fs from "node:fs";

const required = [
  "docs/n07/N07_AIRTABLE_03_BASE_TABLE_MAPPING_TRANSFORMS_PROVIDER_HEALTH.md",
  "manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json",
  "packages/contracts/src/n07-airtable-table-map-contract.ts",
  "packages/contracts/src/n07-airtable-transform-contract.ts",
  "packages/db/src/n07-airtable-table-map.ts",
  "packages/backend/src/n07/airtable-transform-policy.ts",
  "packages/backend/src/n07/airtable-provider-health-read-model.ts",
  "packages/backend/src/n07/airtable-consent-safe-transform.ts",
  "packages/db/src/n07-airtable-provider-health-policy.ts",
  "scripts/validators/validate-n07-airtable-03.mjs",
  "reports/n07/n07-airtable-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.baseTableMappingBuilt !== true) failures.push("baseTableMappingBuilt must be true");
if (manifest.mirrorTransformsBuilt !== true) failures.push("mirrorTransformsBuilt must be true");
if (manifest.forbiddenTruthFieldsStripped !== true) failures.push("forbiddenTruthFieldsStripped must be true");
if (manifest.providerHealthReadModelBuilt !== true) failures.push("providerHealthReadModelBuilt must be true");

const report = {
  schema: "kingsmen.n07-airtable-03-proof.v1",
  module: "N07-AIRTABLE-03 - Base/Table Mapping / Mirror Transforms / Provider Health Read Model",
  status: failures.length === 0 ? "N07_AIRTABLE_BASE_TABLE_MAPPING_TRANSFORMS_PROVIDER_HEALTH_PROVEN" : "N07_AIRTABLE_BASE_TABLE_MAPPING_TRANSFORMS_PROVIDER_HEALTH_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  baseTableMappingBuilt: manifest.baseTableMappingBuilt === true,
  mirrorTransformsBuilt: manifest.mirrorTransformsBuilt === true,
  forbiddenTruthFieldsStripped: manifest.forbiddenTruthFieldsStripped === true,
  rawDocumentsBlocked: manifest.rawDocumentsBlocked === true,
  secretsBlocked: manifest.secretsBlocked === true,
  serviceRoleBlocked: manifest.serviceRoleBlocked === true,
  consentSafePartnerMirrorBuilt: manifest.consentSafePartnerMirrorBuilt === true,
  providerHealthReadModelBuilt: manifest.providerHealthReadModelBuilt === true,
  liveProviderClaimRequiresProof: manifest.liveProviderClaimRequiresProof === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N07-AIRTABLE-04 - sync API routes, founder health view, and closeout."
    : "Repair N07-AIRTABLE-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n07", { recursive: true });
fs.writeFileSync("reports/n07/n07-airtable-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-03 proof passed.");