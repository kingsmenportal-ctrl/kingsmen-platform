import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_04_PROFILE_EDIT_REVIEW_DATA_CORRECTION.md",
  "manifests/n04/n04-candidate-04-profile-edit-review-data-correction.json",
  "packages/contracts/src/n04-profile-correction-contract.ts",
  "packages/contracts/src/n04-profile-review-contract.ts",
  "packages/backend/src/n04/profile-correction-policy.ts",
  "packages/backend/src/n04/profile-review-policy.ts",
  "packages/db/src/n04-profile-correction-policy.ts",
  "reports/n04/n04-candidate-03-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-04-profile-edit-review-data-correction.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-04-profile-edit-review-data-correction.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate03",
  "profileCorrectionRequestBuilt",
  "sensitiveChangeReviewRequired",
  "auditRequiredForCorrection",
  "popiaLogRequiredForCorrection",
  "oldValuePreserved",
  "silentOverwriteBlocked",
  "candidateCannotBypassTruthAuthority",
  "candidateCannotChangePaymentSubmissionOutcomeSource"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const correction = fs.existsSync("packages/backend/src/n04/profile-correction-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/profile-correction-policy.ts", "utf8")
  : "";

for (const phrase of [
  "requires auditId",
  "requires POPIA access log",
  "old and new value summaries",
  "sensitive profile change requires review",
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "change_source_confidence"
]) {
  if (!correction.includes(phrase)) failures.push(`Profile correction policy missing phrase: ${phrase}`);
}

const review = fs.existsSync("packages/backend/src/n04/profile-review-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/profile-review-policy.ts", "utf8")
  : "";

for (const phrase of ["Candidate cannot approve own profile correction", "preserve old value", "block silent overwrite"]) {
  if (!review.includes(phrase)) failures.push(`Profile review policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-04-validation.v1",
  module: "N04-CANDIDATE-04",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-04-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-04 validation passed.");