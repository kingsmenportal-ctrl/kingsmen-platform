import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_08_SUPPORT_TRIBUNAL_INTAKE.md",
  "manifests/n04/n04-candidate-08-support-tribunal-intake.json",
  "packages/contracts/src/n04-help-request-contract.ts",
  "packages/contracts/src/n04-manual-assistance-contract.ts",
  "packages/contracts/src/n04-tribunal-intake-contract.ts",
  "packages/backend/src/n04/support-centre-policy.ts",
  "packages/backend/src/n04/manual-assistance-policy.ts",
  "packages/backend/src/n04/tribunal-intake-policy.ts",
  "apps/web/src/app/candidate/support/page.tsx",
  "packages/db/src/n04-support-tribunal-policy.ts",
  "scripts/validators/validate-n04-candidate-08.mjs",
  "reports/n04/n04-candidate-07-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-08-support-tribunal-intake.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.supportCentreBuilt !== true) failures.push("supportCentreBuilt must be true");
if (manifest.manualAssistanceBuilt !== true) failures.push("manualAssistanceBuilt must be true");
if (manifest.tribunalIntakeBuilt !== true) failures.push("tribunalIntakeBuilt must be true");
if (manifest.founderOperatorReviewRequired !== true) failures.push("founderOperatorReviewRequired must be true");

const report = {
  schema: "kingsmen.n04-candidate-08-proof.v1",
  module: "N04-CANDIDATE-08 - Support Centre / Help Requests / Manual Assistance / Tribunal Intake",
  status: failures.length === 0 ? "N04_SUPPORT_TRIBUNAL_INTAKE_PROVEN" : "N04_SUPPORT_TRIBUNAL_INTAKE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  supportCentreBuilt: manifest.supportCentreBuilt === true,
  helpRequestBuilt: manifest.helpRequestBuilt === true,
  manualAssistanceBuilt: manifest.manualAssistanceBuilt === true,
  tribunalIntakeBuilt: manifest.tribunalIntakeBuilt === true,
  emailFirstSupport: manifest.emailFirstSupport === true,
  evidenceRequiredForSupport: manifest.evidenceRequiredForSupport === true,
  candidateHarmPriorityBuilt: manifest.candidateHarmPriorityBuilt === true,
  tribunalRequiresReview: manifest.tribunalRequiresReview === true,
  founderOperatorReviewRequired: manifest.founderOperatorReviewRequired === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-09 - financial view, service orders, payment status, and refund visibility."
    : "Repair N04-CANDIDATE-08 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-08-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-08 proof passed.");