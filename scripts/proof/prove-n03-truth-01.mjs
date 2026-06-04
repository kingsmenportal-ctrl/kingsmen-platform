import fs from "node:fs";

const required = [
  "docs/n03/N03_TRUTH_01_POSTGRES_TRUTH_VAULT_CORE_TABLES_RLS_PROOF.md",
  "manifests/n03/n03-truth-01-postgres-truth-vault-core-tables-rls-proof.json",
  "packages/db/src/n03-core-schema.sql",
  "packages/db/src/n03-rls-boundary-policy.ts",
  "packages/backend/src/n03/truth-authority-policy.ts",
  "scripts/validators/validate-n03-truth-01.mjs",
  "reports/n02/n02-kernel-03-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);

const manifest = JSON.parse(fs.readFileSync("manifests/n03/n03-truth-01-postgres-truth-vault-core-tables-rls-proof.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.postgresIsTruth !== true) failures.push("postgresIsTruth must be true");
if (manifest.candidateCannotMarkPaid !== true) failures.push("candidateCannotMarkPaid must be true");
if (manifest.candidateCannotMarkSubmitted !== true) failures.push("candidateCannotMarkSubmitted must be true");

const report = {
  schema: "kingsmen.n03-truth-01-proof.v1",
  module: "N03-TRUTH-01 - PostgreSQL Truth Vault / Core Tables / RLS Boundary / Proof",
  status: failures.length === 0 ? "N03_POSTGRES_TRUTH_VAULT_CORE_TABLES_RLS_PROVEN" : "N03_POSTGRES_TRUTH_VAULT_CORE_TABLES_RLS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  postgresIsTruth: manifest.postgresIsTruth === true,
  candidateOwnDataBoundary: manifest.candidateOwnDataBoundary === true,
  candidateCannotMarkPaid: manifest.candidateCannotMarkPaid === true,
  candidateCannotMarkSubmitted: manifest.candidateCannotMarkSubmitted === true,
  candidateCannotVerifyOutcome: manifest.candidateCannotVerifyOutcome === true,
  evidenceAppendFirst: manifest.evidenceAppendFirst === true,
  auditAppendFirst: manifest.auditAppendFirst === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N03-TRUTH-02 - payment/application/evidence status transition guards."
    : "Repair N03-TRUTH-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n03", { recursive: true });
fs.writeFileSync("reports/n03/n03-truth-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-01 proof passed.");