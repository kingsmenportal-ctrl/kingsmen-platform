import fs from "node:fs";

const requiredFiles = [
  "docs/n07/N07_AIRTABLE_03_BASE_TABLE_MAPPING_TRANSFORMS_PROVIDER_HEALTH.md",
  "manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json",
  "packages/contracts/src/n07-airtable-table-map-contract.ts",
  "packages/contracts/src/n07-airtable-transform-contract.ts",
  "packages/db/src/n07-airtable-table-map.ts",
  "packages/backend/src/n07/airtable-transform-policy.ts",
  "packages/backend/src/n07/airtable-provider-health-read-model.ts",
  "packages/backend/src/n07/airtable-consent-safe-transform.ts",
  "packages/db/src/n07-airtable-provider-health-policy.ts",
  "reports/n07/n07-airtable-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json")
  ? JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-03-base-table-mapping-transforms-provider-health.json", "utf8"))
  : {};

for (const key of [
  "requiresN07Airtable02",
  "baseTableMappingBuilt",
  "mirrorTransformsBuilt",
  "forbiddenTruthFieldsStripped",
  "rawDocumentsBlocked",
  "secretsBlocked",
  "serviceRoleBlocked",
  "consentSafePartnerMirrorBuilt",
  "providerHealthReadModelBuilt",
  "liveProviderClaimRequiresProof"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const tableMap = fs.existsSync("packages/db/src/n07-airtable-table-map.ts")
  ? fs.readFileSync("packages/db/src/n07-airtable-table-map.ts", "utf8")
  : "";

for (const phrase of ["Applications Hub", "Document Vault", "Programs & Intelligence", "Partner Ecosystem Directory", "mirrorOnly: true", "canGovernTruth: false"]) {
  if (!tableMap.includes(phrase)) failures.push(`Table map missing ${phrase}`);
}

const transform = fs.existsSync("packages/backend/src/n07/airtable-transform-policy.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-transform-policy.ts", "utf8")
  : "";

for (const phrase of ["service_role", "raw_document", "mark_paid", "verify_document", "forbidden Airtable field survived transform"]) {
  if (!transform.includes(phrase)) failures.push(`Transform policy missing ${phrase}`);
}

const health = fs.existsSync("packages/backend/src/n07/airtable-provider-health-read-model.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-provider-health-read-model.ts", "utf8")
  : "";

for (const phrase of ["liveProviderClaimAllowed: false", "verifiedHealthCheck", "degraded"]) {
  if (!health.includes(phrase)) failures.push(`Provider health read model missing ${phrase}`);
}

const consent = fs.existsSync("packages/backend/src/n07/airtable-consent-safe-transform.ts")
  ? fs.readFileSync("packages/backend/src/n07/airtable-consent-safe-transform.ts", "utf8")
  : "";

for (const phrase of ["consentGranted", "candidateEmail", "documentRef", "strippedFields"]) {
  if (!consent.includes(phrase)) failures.push(`Consent safe transform missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n07-airtable-03-validation.v1",
  module: "N07-AIRTABLE-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n07-airtable-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-03 validation passed.");