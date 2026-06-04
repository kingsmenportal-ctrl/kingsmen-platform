import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_10_SUCCESS_LOOP_FEEDBACK_OUTCOMES_LEARNING.md",
  "manifests/n04/n04-candidate-10-success-loop-feedback-outcomes-learning.json",
  "packages/contracts/src/n04-outcome-capture-contract.ts",
  "packages/contracts/src/n04-feedback-contract.ts",
  "packages/contracts/src/n04-learning-signal-contract.ts",
  "packages/contracts/src/n04-success-transition-contract.ts",
  "packages/backend/src/n04/outcome-capture-policy.ts",
  "packages/backend/src/n04/feedback-learning-policy.ts",
  "packages/backend/src/n04/success-transition-policy.ts",
  "apps/web/src/app/candidate/outcomes/page.tsx",
  "packages/db/src/n04-success-learning-policy.ts",
  "reports/n04/n04-candidate-09-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-10-success-loop-feedback-outcomes-learning.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-10-success-loop-feedback-outcomes-learning.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate09",
  "outcomeCaptureBuilt",
  "feedbackCaptureBuilt",
  "successTransitionBuilt",
  "learningSignalsBuilt",
  "outcomeRequiresProof",
  "successStoryRequiresProofAndConsent",
  "aiMaySuggestNotGovern",
  "noGuaranteeLanguageRequired",
  "candidateNotExperiment"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const outcome = fs.existsSync("packages/backend/src/n04/outcome-capture-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/outcome-capture-policy.ts", "utf8")
  : "";

for (const phrase of ["requires proof and evidence", "requires proof and consent", "no guarantee language allowed"]) {
  if (!outcome.includes(phrase)) failures.push(`Outcome policy missing phrase: ${phrase}`);
}

const learning = fs.existsSync("packages/backend/src/n04/feedback-learning-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/feedback-learning-policy.ts", "utf8")
  : "";

for (const phrase of ["AI may suggest, not govern", "harm learning signal requires founder review", "confusion signal requires review"]) {
  if (!learning.includes(phrase)) failures.push(`Learning policy missing phrase: ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/candidate/outcomes/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/outcomes/page.tsx", "utf8")
  : "";

for (const phrase of ["does not guarantee", "You are not an experiment", "proof-backed outcomes"]) {
  if (!page.includes(phrase)) failures.push(`Outcomes page missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-10-validation.v1",
  module: "N04-CANDIDATE-10",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-10-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-10 validation passed.");