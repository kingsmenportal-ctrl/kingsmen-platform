import fs from "node:fs";

const requiredFiles = [
  "docs/n06/N06_ROUTE_05_VALIDATOR_DOCS_MANIFEST_EVIDENCE_MATRIX_CLOSEOUT.md",
  "manifests/n06/n06-route-05-validator-docs-manifest-evidence-matrix-closeout.json",
  "packages/contracts/src/n06-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n06/n06-closeout-readiness-policy.ts",
  "reports/n06/n06-closeout-evidence-matrix-latest.json",
  "reports/n06/n06-route-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-05-validator-docs-manifest-evidence-matrix-closeout.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-05-validator-docs-manifest-evidence-matrix-closeout.json", "utf8"))
  : {};

for (const key of [
  "evidenceMatrixBuilt",
  "allN06ProofReportsRequired",
  "allN06ValidationReportsRequired",
  "sixGateWorkbenchConfirmed",
  "caoParentChildRuleConfirmed",
  "sourceConfidenceGateConfirmed",
  "readinessScoringConfirmed",
  "choiceOptimizerConfirmed",
  "candidateSafeWorkbenchPortalConfirmed",
  "handoverToN07AirtableSync"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const matrix = fs.existsSync("reports/n06/n06-closeout-evidence-matrix-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n06/n06-closeout-evidence-matrix-latest.json", "utf8"))
  : {};

if (matrix.productionReady !== false) failures.push("matrix productionReady must be false");
if (matrix.allPassed !== true) failures.push("matrix allPassed must be true");
if (!Array.isArray(matrix.rows) || matrix.rows.length !== 5) failures.push("matrix must have 5 rows");
if (matrix.handoverTo !== "N07-AIRTABLE-SYNC") failures.push("matrix must hand over to N07-AIRTABLE-SYNC");

const proof = fs.existsSync("reports/n06/n06-route-05-proof-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n06/n06-route-05-proof-latest.json", "utf8"))
  : {};

if (proof.passed !== true) failures.push("N06-ROUTE-05 proof must pass");
if (proof.productionReady !== false) failures.push("N06-ROUTE-05 proof productionReady must be false");

const report = {
  schema: "kingsmen.n06-route-05-validation.v1",
  module: "N06-ROUTE-05",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-05-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-05 validation passed.");