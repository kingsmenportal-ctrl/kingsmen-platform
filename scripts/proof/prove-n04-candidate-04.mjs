import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_04_PROFILE_EDIT_REVIEW_DATA_CORRECTION.md",
  "manifests/n04/n04-candidate-04-profile-edit-review-data-correction.json",
  "packages/contracts/src/n04-profile-correction-contract.ts",
  "packages/contracts/src/n04-profile-review-contract.ts",
  "packages/backend/src/n04/profile-correction-policy.ts",
  "packages/backend/src/n04/profile-review-policy.ts",
  "packages/db/src/n04-profile-correction-policy.ts",
  "scripts/validators/validate-n04-candidate-04.mjs",
  "reports/n04/n04-candidate-03-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-04-profile-edit-review-data-correction.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.sensitiveChangeReviewRequired !== true) failures.push("sensitiveChangeReviewRequired must be true");
if (manifest.auditRequiredForCorrection !== true) failures.push("auditRequiredForCorrection must be true");
if (manifest.popiaLogRequiredForCorrection !== true) failures.push("popiaLogRequiredForCorrection must be true");
if (manifest.silentOverwriteBlocked !== true) failures.push("silentOverwriteBlocked must be true");

const report = {
  schema: "kingsmen.n04-candidate-04-proof.v1",
  module: "N04-CANDIDATE-04 - Profile Edit Review / Candidate Data Correction Boundary",
  status: failures.length === 0 ? "N04_PROFILE_EDIT_REVIEW_DATA_CORRECTION_PROVEN" : "N04_PROFILE_EDIT_REVIEW_DATA_CORRECTION_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  profileCorrectionRequestBuilt: manifest.profileCorrectionRequestBuilt === true,
  sensitiveChangeReviewRequired: manifest.sensitiveChangeReviewRequired === true,
  auditRequiredForCorrection: manifest.auditRequiredForCorrection === true,
  popiaLogRequiredForCorrection: manifest.popiaLogRequiredForCorrection === true,
  oldValuePreserved: manifest.oldValuePreserved === true,
  silentOverwriteBlocked: manifest.silentOverwriteBlocked === true,
  candidateCannotBypassTruthAuthority: manifest.candidateCannotBypassTruthAuthority === true,
  candidateCannotChangePaymentSubmissionOutcomeSource: manifest.candidateCannotChangePaymentSubmissionOutcomeSource === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-05 - mobile portal journey, email-first experience, and urgent WhatsApp boundary."
    : "Repair N04-CANDIDATE-04 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-04-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-04 proof passed.");