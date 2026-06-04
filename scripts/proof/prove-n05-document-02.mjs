import fs from "node:fs";

const required = [
  "docs/n05/N05_DOCUMENT_02_POSTGRES_RLS_STATUS_VIEWS_SEEDS.md",
  "manifests/n05/n05-document-02-postgres-rls-status-views-seeds.json",
  "packages/db/src/n05-document-schema.sql",
  "packages/db/src/n05-document-rls-policy.ts",
  "packages/db/src/n05-document-status-view-contract.ts",
  "packages/db/src/n05-document-seeds.ts",
  "packages/backend/src/n05/document-status-read-model-policy.ts",
  "scripts/validators/validate-n05-document-02.mjs",
  "reports/n05/n05-document-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n05/n05-document-02-postgres-rls-status-views-seeds.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.postgresSchemaBuilt !== true) failures.push("postgresSchemaBuilt must be true");
if (manifest.rlsBoundaryBuilt !== true) failures.push("rlsBoundaryBuilt must be true");
if (manifest.candidateDocumentVerificationBlocked !== true) failures.push("candidateDocumentVerificationBlocked must be true");

const report = {
  schema: "kingsmen.n05-document-02-proof.v1",
  module: "N05-DOCUMENT-02 - PostgreSQL Schema / RLS / Document Status Views / Seeds",
  status: failures.length === 0 ? "N05_DOCUMENT_POSTGRES_RLS_STATUS_VIEWS_SEEDS_PROVEN" : "N05_DOCUMENT_POSTGRES_RLS_STATUS_VIEWS_SEEDS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  postgresSchemaBuilt: manifest.postgresSchemaBuilt === true,
  rlsBoundaryBuilt: manifest.rlsBoundaryBuilt === true,
  documentStatusViewsBuilt: manifest.documentStatusViewsBuilt === true,
  documentTypeSeedsBuilt: manifest.documentTypeSeedsBuilt === true,
  candidateOwnDocumentReadBuilt: manifest.candidateOwnDocumentReadBuilt === true,
  candidateDocumentVerificationBlocked: manifest.candidateDocumentVerificationBlocked === true,
  evidenceLinksBuilt: manifest.evidenceLinksBuilt === true,
  ocrFraudReviewTablesBuilt: manifest.ocrFraudReviewTablesBuilt === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N05-DOCUMENT-03 - backend types, safety policies, and storage signer boundary."
    : "Repair N05-DOCUMENT-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n05", { recursive: true });
fs.writeFileSync("reports/n05/n05-document-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-02 proof passed.");