import fs from "node:fs";

const required = [
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
  "scripts/validators/validate-n04-candidate-10.mjs",
  "reports/n04/n04-candidate-09-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-10-success-loop-feedback-outcomes-learning.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.outcomeRequiresProof !== true) failures.push("outcomeRequiresProof must be true");
if (manifest.successStoryRequiresProofAndConsent !== true) failures.push("successStoryRequiresProofAndConsent must be true");
if (manifest.aiMaySuggestNotGovern !== true) failures.push("aiMaySuggestNotGovern must be true");

const report = {
  schema: "kingsmen.n04-candidate-10-proof.v1",
  module: "N04-CANDIDATE-10 - Success Loop / Feedback / Outcomes / Learning Signals",
  status: failures.length === 0 ? "N04_SUCCESS_LOOP_FEEDBACK_OUTCOMES_LEARNING_PROVEN" : "N04_SUCCESS_LOOP_FEEDBACK_OUTCOMES_LEARNING_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  outcomeCaptureBuilt: manifest.outcomeCaptureBuilt === true,
  feedbackCaptureBuilt: manifest.feedbackCaptureBuilt === true,
  successTransitionBuilt: manifest.successTransitionBuilt === true,
  learningSignalsBuilt: manifest.learningSignalsBuilt === true,
  outcomeRequiresProof: manifest.outcomeRequiresProof === true,
  successStoryRequiresProofAndConsent: manifest.successStoryRequiresProofAndConsent === true,
  aiMaySuggestNotGovern: manifest.aiMaySuggestNotGovern === true,
  noGuaranteeLanguageRequired: manifest.noGuaranteeLanguageRequired === true,
  candidateNotExperiment: manifest.candidateNotExperiment === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-11 - N04 closeout evidence matrix and readiness gate."
    : "Repair N04-CANDIDATE-10 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-10-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-10 proof passed.");