import fs from "node:fs";

const requiredFiles = [
  "docs/n05/N05_DOCUMENT_02_POSTGRES_RLS_STATUS_VIEWS_SEEDS.md",
  "manifests/n05/n05-document-02-postgres-rls-status-views-seeds.json",
  "packages/db/src/n05-document-schema.sql",
  "packages/db/src/n05-document-rls-policy.ts",
  "packages/db/src/n05-document-status-view-contract.ts",
  "packages/db/src/n05-document-seeds.ts",
  "packages/backend/src/n05/document-status-read-model-policy.ts",
  "reports/n05/n05-document-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n05/n05-document-02-postgres-rls-status-views-seeds.json")
  ? JSON.parse(fs.readFileSync("manifests/n05/n05-document-02-postgres-rls-status-views-seeds.json", "utf8"))
  : {};

for (const key of [
  "requiresN05Document01",
  "postgresSchemaBuilt",
  "rlsBoundaryBuilt",
  "documentStatusViewsBuilt",
  "documentTypeSeedsBuilt",
  "candidateOwnDocumentReadBuilt",
  "candidateDocumentVerificationBlocked",
  "evidenceLinksBuilt",
  "ocrFraudReviewTablesBuilt"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const sql = fs.existsSync("packages/db/src/n05-document-schema.sql")
  ? fs.readFileSync("packages/db/src/n05-document-schema.sql", "utf8")
  : "";

for (const table of ["document_types", "document_requests", "candidate_documents", "document_reviews", "document_ocr_fraud_reviews", "document_evidence_links"]) {
  if (!sql.includes(`create table if not exists ${table}`)) failures.push(`Missing table declaration: ${table}`);
  if (!sql.includes(`alter table ${table} enable row level security`)) failures.push(`Missing RLS declaration: ${table}`);
}

if (!sql.includes("create or replace view candidate_document_status_view")) failures.push("Missing candidate_document_status_view");
if (!sql.includes("on conflict (code) do nothing")) failures.push("Seeds must be idempotent");

const rls = fs.existsSync("packages/db/src/n05-document-rls-policy.ts")
  ? fs.readFileSync("packages/db/src/n05-document-rls-policy.ts", "utf8")
  : "";

for (const phrase of ["public access not allowed", "candidate cannot verify documents", "candidateCanReadOwn"]) {
  if (!rls.includes(phrase)) failures.push(`RLS policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n05-document-02-validation.v1",
  module: "N05-DOCUMENT-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n05-document-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N05-DOCUMENT-02 validation passed.");