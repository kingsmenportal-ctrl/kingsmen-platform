import fs from "node:fs";

const requiredFiles = [
  "docs/n06/N06_ROUTE_02_POSTGRES_RLS_VIEWS_SEEDS.md",
  "manifests/n06/n06-route-02-postgres-rls-views-seeds.json",
  "packages/db/src/n06-route-schema.sql",
  "packages/db/src/n06-route-rls-policy.ts",
  "packages/db/src/n06-route-seeds.ts",
  "packages/db/src/n06-route-view-contract.ts",
  "reports/n06/n06-route-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-02-postgres-rls-views-seeds.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-02-postgres-rls-views-seeds.json", "utf8"))
  : {};

for (const key of [
  "requiresN06Route01",
  "postgresSchemaBuilt",
  "rlsBoundaryBuilt",
  "routeGateSeedsBuilt",
  "routeSystemsBuilt",
  "routeUniverseTableBuilt",
  "sourceAuthorityTableBuilt",
  "candidateReadinessTableBuilt",
  "caoParentChildTablesBuilt",
  "candidateSafeViewsBuilt"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const sql = fs.existsSync("packages/db/src/n06-route-schema.sql")
  ? fs.readFileSync("packages/db/src/n06-route-schema.sql", "utf8")
  : "";

for (const table of [
  "route_gates",
  "route_systems",
  "route_universe",
  "route_source_authorities",
  "candidate_route_readiness",
  "cao_parent_applications",
  "cao_programme_choices"
]) {
  if (!sql.includes(`create table if not exists ${table}`)) failures.push(`Missing table declaration: ${table}`);
  if (!sql.includes(`alter table ${table} enable row level security`)) failures.push(`Missing RLS declaration: ${table}`);
}

for (const view of ["candidate_route_readiness_view", "candidate_cao_choices_view"]) {
  if (!sql.includes(`create or replace view ${view}`)) failures.push(`Missing view declaration: ${view}`);
}

for (const gate of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  if (!sql.includes(gate)) failures.push(`Missing gate seed: ${gate}`);
}

const report = {
  schema: "kingsmen.n06-route-02-validation.v1",
  module: "N06-ROUTE-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-02 validation passed.");