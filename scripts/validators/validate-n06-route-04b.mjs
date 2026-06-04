import fs from "node:fs";

const requiredFiles = [
  "docs/n06/N06_ROUTE_04B_API_ROUTES_SERVER_WIRING_PORTAL_INTEGRATION.md",
  "manifests/n06/n06-route-04b-api-routes-server-wiring-portal-integration.json",
  "packages/backend/src/n06/workbench-server-wiring.ts",
  "packages/backend/src/n06/candidate-workbench-read-model.ts",
  "packages/backend/src/n06/cao-parent-child-read-model.ts",
  "apps/web/src/app/candidate/workbench/page.tsx",
  "reports/n06/n06-route-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-04b-api-routes-server-wiring-portal-integration.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-04b-api-routes-server-wiring-portal-integration.json", "utf8"))
  : {};

for (const key of [
  "requiresN06Route04",
  "workbenchRouteRegistryBuilt",
  "candidatePortalWorkbenchPageBuilt",
  "sixGateWorkbenchViewBuilt",
  "caoParentChildPortalViewBuilt",
  "serverWiringSafetyBuilt",
  "candidateSafeReadModelOnly",
  "candidateTruthAuthorityBlocked",
  "serviceRoleNotExposed"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const page = fs.existsSync("apps/web/src/app/candidate/workbench/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/workbench/page.tsx", "utf8")
  : "";

for (const phrase of [
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment",
  "You cannot verify sources",
  "CAO remains one Kingsmen managed application",
  "No acceptance, funding, placement, employment, or success is guaranteed"
]) {
  if (!page.includes(phrase)) failures.push(`Workbench page missing ${phrase}`);
}

const wiring = fs.existsSync("packages/backend/src/n06/workbench-server-wiring.ts")
  ? fs.readFileSync("packages/backend/src/n06/workbench-server-wiring.ts", "utf8")
  : "";

for (const phrase of [
  "/api/candidate/workbench/readiness",
  "/api/candidate/workbench/choice-optimizer",
  "/api/candidate/workbench/cao-optimizer",
  "service_role exposed"
]) {
  if (!wiring.includes(phrase)) failures.push(`Workbench wiring missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n06-route-04b-validation.v1",
  module: "N06-ROUTE-04B",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-04b-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-04B validation passed.");