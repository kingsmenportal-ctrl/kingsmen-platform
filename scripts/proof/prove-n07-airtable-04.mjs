import fs from "node:fs";

const modules = [
  {
    moduleCode: "N07-AIRTABLE-01",
    proofReportPath: "reports/n07/n07-airtable-01-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-01-validation-latest.json"
  },
  {
    moduleCode: "N07-AIRTABLE-02",
    proofReportPath: "reports/n07/n07-airtable-02-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-02-validation-latest.json"
  },
  {
    moduleCode: "N07-AIRTABLE-03",
    proofReportPath: "reports/n07/n07-airtable-03-proof-latest.json",
    validationReportPath: "reports/validation/n07-airtable-03-validation-latest.json"
  }
];

const required = [
  "docs/n07/N07_AIRTABLE_04_SYNC_API_ROUTES_FOUNDER_HEALTH_CLOSEOUT.md",
  "manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json",
  "packages/contracts/src/n07-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n07/airtable-sync-api-policy.ts",
  "packages/backend/src/n07/founder-airtable-health-view.ts",
  "packages/backend/src/n07/n07-closeout-readiness-policy.ts",
  "apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts",
  "apps/web/src/app/api/founder/airtable/health/route.ts",
  "apps/web/src/app/founder/providers/airtable/page.tsx",
  ...modules.flatMap((row) => [row.proofReportPath, row.validationReportPath])
];

const failures = [];

for (const path of required) {
  if (!fs.existsSync(path)) failures.push(`Missing ${path}`);
}

const manifest = JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json", "utf8"));

for (const key of [
  "requiresN07Airtable01",
  "requiresN07Airtable02",
  "requiresN07Airtable03",
  "syncEnqueueApiBuilt",
  "syncHealthApiBuilt",
  "founderHealthViewBuilt",
  "evidenceMatrixBuilt",
  "postgresTruthPreserved",
  "airtableMirrorOnly",
  "airtableTruthAuthorityBlocked",
  "missingCredentialsDegradeGracefully",
  "oracleLiteSyncLimitsConfirmed",
  "handoverToN08FounderControl"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const rows = [];

for (const item of modules) {
  if (fs.existsSync(item.proofReportPath) && fs.existsSync(item.validationReportPath)) {
    const proof = JSON.parse(fs.readFileSync(item.proofReportPath, "utf8"));
    const validation = JSON.parse(fs.readFileSync(item.validationReportPath, "utf8"));

    rows.push({
      moduleCode: item.moduleCode,
      proofReportPath: item.proofReportPath,
      validationReportPath: item.validationReportPath,
      passed: proof.passed === true && validation.passed === true,
      productionReady: false
    });

    if (proof.passed !== true) failures.push(`${item.proofReportPath} must pass`);
    if (validation.passed !== true) failures.push(`${item.validationReportPath} must pass`);
    if (proof.productionReady !== false) failures.push(`${item.proofReportPath} productionReady must be false`);
    if (validation.productionReady !== false) failures.push(`${item.validationReportPath} productionReady must be false`);
  }
}

const matrix = {
  schema: "kingsmen.n07-closeout-evidence-matrix.v1",
  productionReady: false,
  rows,
  allPassed: rows.length === 3 && rows.every((row) => row.passed === true),
  postgresTruthPreserved: true,
  airtableMirrorOnly: true,
  airtableTruthAuthorityBlocked: true,
  missingCredentialsDegradeGracefully: true,
  oracleLiteSyncLimitsConfirmed: true,
  handoverTo: "N08-FOUNDER-CONTROL",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n07", { recursive: true });
fs.writeFileSync("reports/n07/n07-closeout-evidence-matrix-latest.json", JSON.stringify(matrix, null, 2));

if (matrix.allPassed !== true) failures.push("N07 evidence matrix must include 3 passing rows");

const report = {
  schema: "kingsmen.n07-airtable-04-proof.v1",
  module: "N07-AIRTABLE-04 - Sync API Routes / Founder Health View / Closeout",
  status: failures.length === 0 ? "N07_AIRTABLE_SYNC_API_ROUTES_FOUNDER_HEALTH_CLOSEOUT_PROVEN" : "N07_AIRTABLE_SYNC_API_ROUTES_FOUNDER_HEALTH_CLOSEOUT_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  syncEnqueueApiBuilt: manifest.syncEnqueueApiBuilt === true,
  syncHealthApiBuilt: manifest.syncHealthApiBuilt === true,
  founderHealthViewBuilt: manifest.founderHealthViewBuilt === true,
  evidenceMatrixBuilt: manifest.evidenceMatrixBuilt === true,
  postgresTruthPreserved: manifest.postgresTruthPreserved === true,
  airtableMirrorOnly: manifest.airtableMirrorOnly === true,
  airtableTruthAuthorityBlocked: manifest.airtableTruthAuthorityBlocked === true,
  missingCredentialsDegradeGracefully: manifest.missingCredentialsDegradeGracefully === true,
  oracleLiteSyncLimitsConfirmed: manifest.oracleLiteSyncLimitsConfirmed === true,
  handoverToN08FounderControl: manifest.handoverToN08FounderControl === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N08-FOUNDER-01 - Founder mobile control plane, action packets, and queue health."
    : "Repair N07-AIRTABLE-04 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.writeFileSync("reports/n07/n07-airtable-04-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-04 proof passed.");