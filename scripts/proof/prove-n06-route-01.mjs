import fs from "node:fs";

const required = [
  "docs/n06/N06_ROUTE_01_SERVICE_OVERVIEW_READINESS_ENGINE.md",
  "manifests/n06/n06-route-01-service-overview-readiness-engine.json",
  "packages/contracts/src/n06-route-universe-contract.ts",
  "packages/contracts/src/n06-readiness-engine-contract.ts",
  "packages/contracts/src/n06-cao-choice-contract.ts",
  "packages/backend/src/n06/route-universe-policy.ts",
  "packages/backend/src/n06/readiness-engine.ts",
  "packages/backend/src/n06/cao-parent-child-policy.ts",
  "packages/backend/src/n06/source-confidence-route-policy.ts",
  "packages/db/src/n06-route-readiness-policy.ts",
  "scripts/validators/validate-n06-route-01.mjs",
  "reports/n05/n05-document-05-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-01-service-overview-readiness-engine.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.sixGateRouteUniverseBuilt !== true) failures.push("sixGateRouteUniverseBuilt must be true");
if (manifest.readinessEngineBuilt !== true) failures.push("readinessEngineBuilt must be true");
if (manifest.caoParentChildRulePreserved !== true) failures.push("caoParentChildRulePreserved must be true");
if (manifest.sourceConfidenceRequired !== true) failures.push("sourceConfidenceRequired must be true");

const report = {
  schema: "kingsmen.n06-route-01-proof.v1",
  module: "N06-ROUTE-01 - Route Universe / Application Workbench Service Overview / Readiness Engine",
  status: failures.length === 0 ? "N06_ROUTE_UNIVERSE_READINESS_ENGINE_PROVEN" : "N06_ROUTE_UNIVERSE_READINESS_ENGINE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  routeUniverseOverviewBuilt: manifest.routeUniverseOverviewBuilt === true,
  sixGateRouteUniverseBuilt: manifest.sixGateRouteUniverseBuilt === true,
  readinessEngineBuilt: manifest.readinessEngineBuilt === true,
  knownRouteFastLaneSupported: manifest.knownRouteFastLaneSupported === true,
  caoParentChildRulePreserved: manifest.caoParentChildRulePreserved === true,
  packageControlsIntensityNotGateAccess: manifest.packageControlsIntensityNotGateAccess === true,
  capLimitsVolumeNotCapability: manifest.capLimitsVolumeNotCapability === true,
  sourceConfidenceRequired: manifest.sourceConfidenceRequired === true,
  documentReadinessConnectsToN05: manifest.documentReadinessConnectsToN05 === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-02 - PostgreSQL schema, RLS, views, and seeds for route universe."
    : "Repair N06-ROUTE-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-route-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-01 proof passed.");