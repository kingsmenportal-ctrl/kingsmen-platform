import fs from "node:fs";

const required = [
  "docs/n06/N06_ROUTE_02_POSTGRES_RLS_VIEWS_SEEDS.md",
  "manifests/n06/n06-route-02-postgres-rls-views-seeds.json",
  "packages/db/src/n06-route-schema.sql",
  "packages/db/src/n06-route-rls-policy.ts",
  "packages/db/src/n06-route-seeds.ts",
  "packages/db/src/n06-route-view-contract.ts",
  "scripts/validators/validate-n06-route-02.mjs",
  "reports/n06/n06-route-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-02-postgres-rls-views-seeds.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.postgresSchemaBuilt !== true) failures.push("postgresSchemaBuilt must be true");
if (manifest.rlsBoundaryBuilt !== true) failures.push("rlsBoundaryBuilt must be true");
if (manifest.caoParentChildTablesBuilt !== true) failures.push("caoParentChildTablesBuilt must be true");
if (manifest.candidateSafeViewsBuilt !== true) failures.push("candidateSafeViewsBuilt must be true");

const report = {
  schema: "kingsmen.n06-route-02-proof.v1",
  module: "N06-ROUTE-02 - PostgreSQL Schema / RLS / Views / Seeds for Route Universe",
  status: failures.length === 0 ? "N06_ROUTE_POSTGRES_RLS_VIEWS_SEEDS_PROVEN" : "N06_ROUTE_POSTGRES_RLS_VIEWS_SEEDS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  postgresSchemaBuilt: manifest.postgresSchemaBuilt === true,
  rlsBoundaryBuilt: manifest.rlsBoundaryBuilt === true,
  routeGateSeedsBuilt: manifest.routeGateSeedsBuilt === true,
  routeSystemsBuilt: manifest.routeSystemsBuilt === true,
  routeUniverseTableBuilt: manifest.routeUniverseTableBuilt === true,
  sourceAuthorityTableBuilt: manifest.sourceAuthorityTableBuilt === true,
  candidateReadinessTableBuilt: manifest.candidateReadinessTableBuilt === true,
  caoParentChildTablesBuilt: manifest.caoParentChildTablesBuilt === true,
  candidateSafeViewsBuilt: manifest.candidateSafeViewsBuilt === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-03 - backend types, safety policies, readiness scoring, and choice optimizer boundary."
    : "Repair N06-ROUTE-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-route-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-02 proof passed.");