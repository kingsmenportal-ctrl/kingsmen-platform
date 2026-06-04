import fs from "node:fs";

const requiredFiles = [
  "docs/n03/N03_TRUTH_05_DATABASE_READINESS_MIGRATION_HANDOFF.md",
  "manifests/n03/n03-truth-05-database-readiness-migration-handoff.json",
  "packages/contracts/src/n03-database-readiness-contract.ts",
  "packages/contracts/src/n03-migration-handoff-contract.ts",
  "packages/backend/src/n03/database-readiness-report.ts",
  "packages/backend/src/n03/migration-handoff-boundary.ts",
  "packages/db/src/n03-database-readiness-policy.ts",
  "reports/n03/n03-truth-01-proof-latest.json",
  "reports/n03/n03-truth-02-proof-latest.json",
  "reports/n03/n03-truth-03-proof-latest.json",
  "reports/n03/n03-truth-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n03/n03-truth-05-database-readiness-migration-handoff.json")
  ? JSON.parse(fs.readFileSync("manifests/n03/n03-truth-05-database-readiness-migration-handoff.json", "utf8"))
  : {};

for (const key of [
  "requiresN03Truth01",
  "requiresN03Truth02",
  "requiresN03Truth03",
  "requiresN03Truth04",
  "databaseReadinessReportBuilt",
  "migrationHandoffBoundaryBuilt",
  "directProductionMutationBlocked",
  "migrationRequiresApproval",
  "migrationRequiresReport",
  "schemaDeclaredNotAutoApplied",
  "oracleLiteDisciplineRequired"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const handoff = fs.existsSync("packages/backend/src/n03/migration-handoff-boundary.ts")
  ? fs.readFileSync("packages/backend/src/n03/migration-handoff-boundary.ts", "utf8")
  : "";

for (const phrase of [
  "Direct production migration is blocked",
  "requires founder approval",
  "requires reportPath",
  "dry run completion"
]) {
  if (!handoff.includes(phrase)) failures.push(`Migration handoff missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n03-truth-05-validation.v1",
  module: "N03-TRUTH-05",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n03-truth-05-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-05 validation passed.");