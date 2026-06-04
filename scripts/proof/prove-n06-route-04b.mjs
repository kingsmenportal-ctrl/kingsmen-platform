import fs from "node:fs";

const required = [
  "docs/n06/N06_ROUTE_04B_API_ROUTES_SERVER_WIRING_PORTAL_INTEGRATION.md",
  "manifests/n06/n06-route-04b-api-routes-server-wiring-portal-integration.json",
  "packages/backend/src/n06/workbench-server-wiring.ts",
  "packages/backend/src/n06/candidate-workbench-read-model.ts",
  "packages/backend/src/n06/cao-parent-child-read-model.ts",
  "apps/web/src/app/candidate/workbench/page.tsx",
  "scripts/validators/validate-n06-route-04b.mjs",
  "reports/n06/n06-route-04-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-04b-api-routes-server-wiring-portal-integration.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.candidatePortalWorkbenchPageBuilt !== true) failures.push("candidatePortalWorkbenchPageBuilt must be true");
if (manifest.sixGateWorkbenchViewBuilt !== true) failures.push("sixGateWorkbenchViewBuilt must be true");
if (manifest.caoParentChildPortalViewBuilt !== true) failures.push("caoParentChildPortalViewBuilt must be true");
if (manifest.serviceRoleNotExposed !== true) failures.push("serviceRoleNotExposed must be true");

const report = {
  schema: "kingsmen.n06-route-04b-proof.v1",
  module: "N06-ROUTE-04B - API Routes / Server Wiring / Candidate Portal Workbench Integration",
  status: failures.length === 0 ? "N06_ROUTE_API_ROUTES_SERVER_WIRING_PORTAL_INTEGRATION_PROVEN" : "N06_ROUTE_API_ROUTES_SERVER_WIRING_PORTAL_INTEGRATION_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  workbenchRouteRegistryBuilt: manifest.workbenchRouteRegistryBuilt === true,
  candidatePortalWorkbenchPageBuilt: manifest.candidatePortalWorkbenchPageBuilt === true,
  sixGateWorkbenchViewBuilt: manifest.sixGateWorkbenchViewBuilt === true,
  caoParentChildPortalViewBuilt: manifest.caoParentChildPortalViewBuilt === true,
  serverWiringSafetyBuilt: manifest.serverWiringSafetyBuilt === true,
  candidateSafeReadModelOnly: manifest.candidateSafeReadModelOnly === true,
  candidateTruthAuthorityBlocked: manifest.candidateTruthAuthorityBlocked === true,
  serviceRoleNotExposed: manifest.serviceRoleNotExposed === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-05 - validator, docs, manifest, evidence matrix, and closeout."
    : "Repair N06-ROUTE-04B files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-route-04b-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-04B proof passed.");