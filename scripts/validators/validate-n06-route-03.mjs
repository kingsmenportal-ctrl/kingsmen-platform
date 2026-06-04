import fs from "node:fs";

const requiredFiles = [
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
  "reports/n06/n06-route-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n06/n06-route-03-backend-types-safety-readiness-choice-optimizer.json")
  ? JSON.parse(fs.readFileSync("manifests/n06/n06-route-03-backend-types-safety-readiness-choice-optimizer.json", "utf8"))
  : {};

for (const key of [
  "requiresN06Route02",
  "readinessScoringBuilt",
  "choiceOptimizerBuilt",
  "caoChoiceOptimizerBuilt",
  "knownRouteFastSubmissionReadinessBuilt",
  "sourceConfidenceSafetyBuilt",
  "feeDeadlinePaymentInstructionGateBuilt",
  "noGuaranteeBoundaryBuilt",
  "candidateDocumentReadinessConnected"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const fast = fs.existsSync("packages/backend/src/n06/fast-submission-readiness-policy.ts")
  ? fs.readFileSync("packages/backend/src/n06/fast-submission-readiness-policy.ts", "utf8")
  : "";

for (const phrase of ["30-60", "otp_captcha_or_portal_blocker", "source_not_verified", "documents_not_ready"]) {
  if (!fast.includes(phrase)) failures.push(`Fast submission policy missing ${phrase}`);
}

const safety = fs.existsSync("packages/backend/src/n06/route-instruction-safety-policy.ts")
  ? fs.readFileSync("packages/backend/src/n06/route-instruction-safety-policy.ts", "utf8")
  : "";

for (const phrase of ["fee", "deadline", "payment_channel", "requires source URL", "no-guarantee language"]) {
  if (!safety.includes(phrase)) failures.push(`Instruction safety policy missing ${phrase}`);
}

const cao = fs.existsSync("packages/backend/src/n06/cao-choice-optimizer.ts")
  ? fs.readFileSync("packages/backend/src/n06/cao-choice-optimizer.ts", "utf8")
  : "";

for (const phrase of ["countsAsOneKingsmenApplication", "countsAsSeparateKingsmenApplication: false", "recommendedOrder"]) {
  if (!cao.includes(phrase)) failures.push(`CAO optimizer missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n06-route-03-validation.v1",
  module: "N06-ROUTE-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n06-route-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N06-ROUTE-03 validation passed.");