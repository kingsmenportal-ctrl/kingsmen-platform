import fs from "node:fs";

const required = [
  "docs/n03/N03_TRUTH_05_DATABASE_READINESS_MIGRATION_HANDOFF.md",
  "manifests/n03/n03-truth-05-database-readiness-migration-handoff.json",
  "packages/backend/src/n03/database-readiness-report.ts",
  "packages/backend/src/n03/migration-handoff-boundary.ts",
  "packages/db/src/n03-database-readiness-policy.ts",
  "scripts/validators/validate-n03-truth-05.mjs",
  "reports/n03/n03-truth-01-proof-latest.json",
  "reports/n03/n03-truth-02-proof-latest.json",
  "reports/n03/n03-truth-03-proof-latest.json",
  "reports/n03/n03-truth-04-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n03/n03-truth-05-database-readiness-migration-handoff.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.directProductionMutationBlocked !== true) failures.push("directProductionMutationBlocked must be true");
if (manifest.migrationRequiresApproval !== true) failures.push("migrationRequiresApproval must be true");
if (manifest.migrationRequiresReport !== true) failures.push("migrationRequiresReport must be true");

const report = {
  schema: "kingsmen.n03-truth-05-proof.v1",
  module: "N03-TRUTH-05 - Database Readiness Report / Migration Handoff Boundary",
  status: failures.length === 0 ? "N03_DATABASE_READINESS_MIGRATION_HANDOFF_PROVEN" : "N03_DATABASE_READINESS_MIGRATION_HANDOFF_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  databaseReadinessReportBuilt: manifest.databaseReadinessReportBuilt === true,
  migrationHandoffBoundaryBuilt: manifest.migrationHandoffBoundaryBuilt === true,
  directProductionMutationBlocked: manifest.directProductionMutationBlocked === true,
  migrationRequiresApproval: manifest.migrationRequiresApproval === true,
  migrationRequiresReport: manifest.migrationRequiresReport === true,
  schemaDeclaredNotAutoApplied: manifest.schemaDeclaredNotAutoApplied === true,
  oracleLiteDisciplineRequired: manifest.oracleLiteDisciplineRequired === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-01 - Candidate identity, intake truth, and lifecycle foundation."
    : "Repair N03-TRUTH-05 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n03", { recursive: true });
fs.writeFileSync("reports/n03/n03-truth-05-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-05 proof passed.");