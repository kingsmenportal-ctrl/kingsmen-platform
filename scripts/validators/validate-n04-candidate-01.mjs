import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_01_IDENTITY_INTAKE_LIFECYCLE.md",
  "manifests/n04/n04-candidate-01-identity-intake-lifecycle.json",
  "packages/contracts/src/n04-candidate-identity-contract.ts",
  "packages/contracts/src/n04-candidate-intake-contract.ts",
  "packages/contracts/src/n04-candidate-lifecycle-contract.ts",
  "packages/backend/src/n04/candidate-intake-policy.ts",
  "packages/backend/src/n04/candidate-lifecycle-policy.ts",
  "packages/db/src/n04-candidate-core-policy.ts",
  "reports/n03/n03-truth-05-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-01-identity-intake-lifecycle.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-01-identity-intake-lifecycle.json", "utf8"))
  : {};

for (const key of [
  "requiresN03Truth05",
  "candidateIdentityBuilt",
  "candidateIntakeTruthBuilt",
  "candidateLifecycleBuilt",
  "sixGatePreferenceCaptureBuilt",
  "allSixGatesVisibleToAllUsers",
  "knownRouteFastLaneSupported",
  "candidateCannotSelfVerifyPaidSubmittedOutcome",
  "popiaSafeCandidateBoundary"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const intake = fs.existsSync("packages/backend/src/n04/candidate-intake-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/candidate-intake-policy.ts", "utf8")
  : "";

for (const gate of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  if (!intake.includes(gate)) failures.push(`N04 intake policy missing gate: ${gate}`);
}

for (const phrase of ["mark_paid", "mark_submitted", "verify_outcome", "package must control intensity"]) {
  if (!intake.includes(phrase)) failures.push(`N04 intake policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-01-validation.v1",
  module: "N04-CANDIDATE-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-01 validation passed.");