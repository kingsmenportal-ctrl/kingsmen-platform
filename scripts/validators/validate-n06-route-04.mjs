import fs from "node:fs";

const requiredFiles = [
  "docs/n06/N06_ROUTE_04_REPOSITORY_ROUTES_WORKBENCH_API.md",
  "manifests/n06/n06-route-04-repository-routes-workbench-api.json",
  "packages/backend/src/n06/route-repository.ts",
  "packages/backend/src/n06/readiness-repository.ts",
  "packages/backend/src/n06/cao-choice-repository.ts",
  "packages/backend/src/n06/workbench-api-policy.ts",
  "apps/web/src/app/api/candidate/workbench/readiness/route.ts",
  "apps/web/src/app/api/candidate/workbench/choice-optimizer/route.ts",
  "apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts",
  "reports/n06/n06-route-03-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-04-repository-routes-workbench-api.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-04-repository-routes-workbench-api.json", "utf8"))
  : {};

for (const key of [
  "requiresN06Route03",
  "routeRepositoryBuilt",
  "readinessRepositoryBuilt",
  "caoChoiceRepositoryBuilt",
  "workbenchApiRoutesBuilt",
  "knownRouteReadinessRouteBuilt",
  "choiceOptimizerRouteBuilt",
  "caoChoiceOptimizerRouteBuilt",
  "candidateTruthAuthorityBlocked",
  "candidateSafeReadModelOnly"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const apiPolicy = fs.existsSync("packages/backend/src/n06/workbench-api-policy.ts")
  ? fs.readFileSync("packages/backend/src/n06/workbench-api-policy.ts", "utf8")
  : "";

for (const phrase of ["verify_source", "mark_paid", "mark_submitted", "verify_outcome", "service_role must never be visible"]) {
  if (!apiPolicy.includes(phrase)) failures.push(`Workbench API policy missing ${phrase}`);
}

const routes = [
  "apps/web/src/app/api/candidate/workbench/readiness/route.ts",
  "apps/web/src/app/api/candidate/workbench/choice-optimizer/route.ts",
  "apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts"
];

for (const route of routes) {
  const content = fs.existsSync(route) ? fs.readFileSync(route, "utf8") : "";
  for (const phrase of ["productionReady: false", "serviceRoleVisibleToBrowser: false"]) {
    if (!content.includes(phrase)) failures.push(`${route} missing ${phrase}`);
  }
}

const caoRoute = fs.existsSync("apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts")
  ? fs.readFileSync("apps/web/src/app/api/candidate/workbench/cao-optimizer/route.ts", "utf8")
  : "";

for (const phrase of ["countsAsOneKingsmenApplication: true", "childChoiceCountsAsSeparateKingsmenApplication: false"]) {
  if (!caoRoute.includes(phrase)) failures.push(`CAO optimizer route missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n06-route-04-validation.v1",
  module: "N06-ROUTE-04",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-04-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-04 validation passed.");