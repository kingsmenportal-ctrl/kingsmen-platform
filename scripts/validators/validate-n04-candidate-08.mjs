import fs from "node:fs";

const requiredFiles = [
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
  "reports/n04/n04-candidate-07-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-08-support-tribunal-intake.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-08-support-tribunal-intake.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate07",
  "supportCentreBuilt",
  "helpRequestBuilt",
  "manualAssistanceBuilt",
  "tribunalIntakeBuilt",
  "emailFirstSupport",
  "evidenceRequiredForSupport",
  "candidateHarmPriorityBuilt",
  "tribunalRequiresReview",
  "founderOperatorReviewRequired"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const support = fs.existsSync("packages/backend/src/n04/support-centre-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/support-centre-policy.ts", "utf8")
  : "";

for (const phrase of ["requires evidence", "requires auditId", "email-first", "candidate harm or deadline risk"]) {
  if (!support.includes(phrase)) failures.push(`Support policy missing phrase: ${phrase}`);
}

const manual = fs.existsSync("packages/backend/src/n04/manual-assistance-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/manual-assistance-policy.ts", "utf8")
  : "";

for (const phrase of ["captcha_or_otp", "portal_down", "source_uncertain", "MAP fallback", "founder/operator review"]) {
  if (!manual.includes(phrase)) failures.push(`Manual assistance policy missing phrase: ${phrase}`);
}

const tribunal = fs.existsSync("packages/backend/src/n04/tribunal-intake-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/tribunal-intake-policy.ts", "utf8")
  : "";

for (const phrase of ["requires auditId", "requires evidence", "founder/operator review", "candidate-visible"]) {
  if (!tribunal.includes(phrase)) failures.push(`Tribunal policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-08-validation.v1",
  module: "N04-CANDIDATE-08",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-08-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-08 validation passed.");