import fs from "node:fs";

const required = [
  "docs/n06/N06_ROUTE_04_REPOSITORY_ROUTES_WORKBENCH_API.md",
  "manifests/n06/n06-route-04-repository-routes-workbench-api.json",
  "packages/backend/src/n06/route-repository.ts",
  "packages/backend/src/n06/readiness-repository.ts",
  "packages/backend/src/n06/cao-choice-repository.ts",
  "packages/backend/src/n06/workbench-api-policy.ts",
  "apps/web/src/app/api/candidate/workbench/readiness/route.ts",
  "apps/web/src/app/api/candidate/workbench/choice-optimizer/route.ts",
  "apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts",
  "scripts/validators/validate-n06-route-04.mjs",
  "reports/n06/n06-route-03-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-04-repository-routes-workbench-api.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.routeRepositoryBuilt !== true) failures.push("routeRepositoryBuilt must be true");
if (manifest.workbenchApiRoutesBuilt !== true) failures.push("workbenchApiRoutesBuilt must be true");
if (manifest.candidateTruthAuthorityBlocked !== true) failures.push("candidateTruthAuthorityBlocked must be true");
if (manifest.candidateSafeReadModelOnly !== true) failures.push("candidateSafeReadModelOnly must be true");

const report = {
  schema: "kingsmen.n06-route-04-proof.v1",
  module: "N06-ROUTE-04 - Repository / Routes / Workbench API",
  status: failures.length === 0 ? "N06_ROUTE_REPOSITORY_ROUTES_WORKBENCH_API_PROVEN" : "N06_ROUTE_REPOSITORY_ROUTES_WORKBENCH_API_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  routeRepositoryBuilt: manifest.routeRepositoryBuilt === true,
  readinessRepositoryBuilt: manifest.readinessRepositoryBuilt === true,
  caoChoiceRepositoryBuilt: manifest.caoChoiceRepositoryBuilt === true,
  workbenchApiRoutesBuilt: manifest.workbenchApiRoutesBuilt === true,
  knownRouteReadinessRouteBuilt: manifest.knownRouteReadinessRouteBuilt === true,
  choiceOptimizerRouteBuilt: manifest.choiceOptimizerRouteBuilt === true,
  caoChoiceOptimizerRouteBuilt: manifest.caoChoiceOptimizerRouteBuilt === true,
  candidateTruthAuthorityBlocked: manifest.candidateTruthAuthorityBlocked === true,
  candidateSafeReadModelOnly: manifest.candidateSafeReadModelOnly === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-04B - API routes, server wiring, and candidate portal workbench integration."
    : "Repair N06-ROUTE-04 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-route-04-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-04 proof passed.");