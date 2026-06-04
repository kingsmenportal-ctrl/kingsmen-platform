import fs from "node:fs";

const requiredFiles = [
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
  "reports/n05/n05-document-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-01-service-overview-readiness-engine.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-01-service-overview-readiness-engine.json", "utf8"))
  : {};

for (const key of [
  "requiresN05Document05",
  "routeUniverseOverviewBuilt",
  "sixGateRouteUniverseBuilt",
  "readinessEngineBuilt",
  "knownRouteFastLaneSupported",
  "caoParentChildRulePreserved",
  "packageControlsIntensityNotGateAccess",
  "capLimitsVolumeNotCapability",
  "sourceConfidenceRequired",
  "documentReadinessConnectsToN05"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const routePolicy = fs.existsSync("packages/backend/src/n06/route-universe-policy.ts")
  ? fs.readFileSync("packages/backend/src/n06/route-universe-policy.ts", "utf8")
  : "";

for (const gate of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  if (!routePolicy.includes(gate)) failures.push(`Route policy missing gate: ${gate}`);
}

const readiness = fs.existsSync("packages/backend/src/n06/readiness-engine.ts")
  ? fs.readFileSync("packages/backend/src/n06/readiness-engine.ts", "utf8")
  : "";

for (const phrase of ["needs_documents", "needs_source_verification", "ready_for_submission", "deadline_risk"]) {
  if (!readiness.includes(phrase)) failures.push(`Readiness engine missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n06-route-01-validation.v1",
  module: "N06-ROUTE-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-01 validation passed.");