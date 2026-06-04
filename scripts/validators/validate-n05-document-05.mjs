import fs from "node:fs";

const requiredFiles = [
  "docs/n05/N05_DOCUMENT_05_VALIDATOR_MANIFEST_EVIDENCE_MATRIX_CLOSEOUT.md",
  "manifests/n05/n05-document-05-validator-manifest-evidence-matrix-closeout.json",
  "packages/contracts/src/n05-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n05/n05-closeout-readiness-policy.ts",
  "reports/n05/n05-closeout-evidence-matrix-latest.json",
  "reports/n05/n05-document-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-05-validator-manifest-evidence-matrix-closeout.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-05-validator-manifest-evidence-matrix-closeout.json", "utf8"))
  : {};

for (const key of [
  "evidenceMatrixBuilt",
  "allN05ProofReportsRequired",
  "allN05ValidationReportsRequired",
  "signedUploadReadBoundaryConfirmed",
  "privateStorageConfirmed",
  "rawPublicUrlBlocked",
  "ocrAiAssistiveOnly",
  "candidateCannotVerifyRejectDelete",
  "documentStatusIntegrationConfirmed",
  "handoverToN06RouteUniverse"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const matrix = fs.existsSync("reports/n05/n05-closeout-evidence-matrix-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n05/n05-closeout-evidence-matrix-latest.json", "utf8"))
  : {};

if (matrix.productionReady !== false) failures.push("matrix productionReady must be false");
if (matrix.allPassed !== true) failures.push("matrix allPassed must be true");
if (!Array.isArray(matrix.rows) || matrix.rows.length !== 5) failures.push("matrix must have 5 rows");
if (matrix.handoverTo !== "N06-ROUTE-UNIVERSE") failures.push("matrix must hand over to N06-ROUTE-UNIVERSE");

const proof = fs.existsSync("reports/n05/n05-document-05-proof-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n05/n05-document-05-proof-latest.json", "utf8"))
  : {};

if (proof.passed !== true) failures.push("N05-DOCUMENT-05 proof must pass");
if (proof.productionReady !== false) failures.push("N05-DOCUMENT-05 proof productionReady must be false");

const report = {
  schema: "kingsmen.n05-document-05-validation.v1",
  module: "N05-DOCUMENT-05",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-05-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-05 validation passed.");