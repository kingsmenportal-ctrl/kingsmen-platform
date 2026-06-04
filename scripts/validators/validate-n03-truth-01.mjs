import fs from "node:fs";

const requiredFiles = [
  "docs/n03/N03_TRUTH_01_POSTGRES_TRUTH_VAULT_CORE_TABLES_RLS_PROOF.md",
  "manifests/n03/n03-truth-01-postgres-truth-vault-core-tables-rls-proof.json",
  "packages/contracts/src/n03-truth-vault-contract.ts",
  "packages/contracts/src/n03-rls-boundary-contract.ts",
  "packages/contracts/src/n03-core-table-contract.ts",
  "packages/db/src/n03-core-schema.sql",
  "packages/db/src/n03-rls-boundary-policy.ts",
  "packages/backend/src/n03/truth-authority-policy.ts",
  "reports/n02/n02-kernel-03-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n03/n03-truth-01-postgres-truth-vault-core-tables-rls-proof.json")
  ? JSON.parse(fs.readFileSync("manifests/n03/n03-truth-01-postgres-truth-vault-core-tables-rls-proof.json", "utf8"))
  : {};

for (const key of [
  "postgresIsTruth",
  "airtableMirrorOnly",
  "n8nThinWrapperOnly",
  "candidateOwnDataBoundary",
  "candidateCannotMarkPaid",
  "candidateCannotMarkSubmitted",
  "candidateCannotVerifyOutcome",
  "evidenceAppendFirst",
  "auditAppendFirst",
  "sourceConfidenceRequired"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const sql = fs.existsSync("packages/db/src/n03-core-schema.sql")
  ? fs.readFileSync("packages/db/src/n03-core-schema.sql", "utf8")
  : "";

for (const table of ["candidates", "service_orders", "payment_events", "applications", "application_choices", "candidate_documents", "evidence_ledger", "audit_events", "source_authorities", "outcomes"]) {
  if (!sql.includes(`create table if not exists ${table}`)) failures.push(`Missing table declaration: ${table}`);
  if (!sql.includes(`alter table ${table} enable row level security`)) failures.push(`Missing RLS enable for: ${table}`);
}

const authority = fs.existsSync("packages/backend/src/n03/truth-authority-policy.ts")
  ? fs.readFileSync("packages/backend/src/n03/truth-authority-policy.ts", "utf8")
  : "";

for (const phrase of ["mark_paid", "mark_submitted", "verify_outcome", "publish_success_story", "change_source_confidence"]) {
  if (!authority.includes(phrase)) failures.push(`Authority policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n03-truth-01-validation.v1",
  module: "N03-TRUTH-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n03-truth-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-01 validation passed.");