import fs from "node:fs";

const required = [
  "docs/n06/N06_ROUTE_03_BACKEND_TYPES_SAFETY_READINESS_CHOICE_OPTIMIZER.md",
  "manifests/n06/n06-route-03-backend-types-safety-readiness-choice-optimizer.json",
  "packages/contracts/src/n06-choice-optimizer-contract.ts",
  "packages/contracts/src/n06-cao-optimizer-contract.ts",
  "packages/backend/src/n06/readiness-scoring-policy.ts",
  "packages/backend/src/n06/choice-optimizer.ts",
  "packages/backend/src/n06/cao-choice-optimizer.ts",
  "packages/backend/src/n06/fast-submission-readiness-policy.ts",
  "packages/backend/src/n06/route-instruction-safety-policy.ts",
  "packages/db/src/n06-choice-optimizer-policy.ts",
  "scripts/validators/validate-n06-route-03.mjs",
  "reports/n06/n06-route-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n06/n06-route-03-backend-types-safety-readiness-choice-optimizer.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.readinessScoringBuilt !== true) failures.push("readinessScoringBuilt must be true");
if (manifest.choiceOptimizerBuilt !== true) failures.push("choiceOptimizerBuilt must be true");
if (manifest.caoChoiceOptimizerBuilt !== true) failures.push("caoChoiceOptimizerBuilt must be true");
if (manifest.noGuaranteeBoundaryBuilt !== true) failures.push("noGuaranteeBoundaryBuilt must be true");

const report = {
  schema: "kingsmen.n06-route-03-proof.v1",
  module: "N06-ROUTE-03 - Backend Types / Safety Policies / Readiness Scoring / Choice Optimizer Boundary",
  status: failures.length === 0 ? "N06_ROUTE_BACKEND_TYPES_SAFETY_READINESS_CHOICE_OPTIMIZER_PROVEN" : "N06_ROUTE_BACKEND_TYPES_SAFETY_READINESS_CHOICE_OPTIMIZER_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  readinessScoringBuilt: manifest.readinessScoringBuilt === true,
  choiceOptimizerBuilt: manifest.choiceOptimizerBuilt === true,
  caoChoiceOptimizerBuilt: manifest.caoChoiceOptimizerBuilt === true,
  knownRouteFastSubmissionReadinessBuilt: manifest.knownRouteFastSubmissionReadinessBuilt === true,
  sourceConfidenceSafetyBuilt: manifest.sourceConfidenceSafetyBuilt === true,
  feeDeadlinePaymentInstructionGateBuilt: manifest.feeDeadlinePaymentInstructionGateBuilt === true,
  noGuaranteeBoundaryBuilt: manifest.noGuaranteeBoundaryBuilt === true,
  candidateDocumentReadinessConnected: manifest.candidateDocumentReadinessConnected === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N06-ROUTE-04 - repository, routes, and workbench API."
    : "Repair N06-ROUTE-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n06", { recursive: true });
fs.writeFileSync("reports/n06/n06-route-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-03 proof passed.");