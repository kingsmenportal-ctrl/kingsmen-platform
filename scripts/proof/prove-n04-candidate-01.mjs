import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_01_IDENTITY_INTAKE_LIFECYCLE.md",
  "manifests/n04/n04-candidate-01-identity-intake-lifecycle.json",
  "packages/contracts/src/n04-candidate-identity-contract.ts",
  "packages/contracts/src/n04-candidate-intake-contract.ts",
  "packages/contracts/src/n04-candidate-lifecycle-contract.ts",
  "packages/backend/src/n04/candidate-intake-policy.ts",
  "packages/backend/src/n04/candidate-lifecycle-policy.ts",
  "packages/db/src/n04-candidate-core-policy.ts",
  "scripts/validators/validate-n04-candidate-01.mjs",
  "reports/n03/n03-truth-05-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-01-identity-intake-lifecycle.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.allSixGatesVisibleToAllUsers !== true) failures.push("allSixGatesVisibleToAllUsers must be true");
if (manifest.candidateCannotSelfVerifyPaidSubmittedOutcome !== true) failures.push("candidateCannotSelfVerifyPaidSubmittedOutcome must be true");

const report = {
  schema: "kingsmen.n04-candidate-01-proof.v1",
  module: "N04-CANDIDATE-01 - Candidate Identity / Intake Truth / Lifecycle Foundation",
  status: failures.length === 0 ? "N04_CANDIDATE_IDENTITY_INTAKE_LIFECYCLE_PROVEN" : "N04_CANDIDATE_IDENTITY_INTAKE_LIFECYCLE_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  candidateIdentityBuilt: manifest.candidateIdentityBuilt === true,
  candidateIntakeTruthBuilt: manifest.candidateIntakeTruthBuilt === true,
  candidateLifecycleBuilt: manifest.candidateLifecycleBuilt === true,
  sixGatePreferenceCaptureBuilt: manifest.sixGatePreferenceCaptureBuilt === true,
  allSixGatesVisibleToAllUsers: manifest.allSixGatesVisibleToAllUsers === true,
  knownRouteFastLaneSupported: manifest.knownRouteFastLaneSupported === true,
  candidateCannotSelfVerifyPaidSubmittedOutcome: manifest.candidateCannotSelfVerifyPaidSubmittedOutcome === true,
  popiaSafeCandidateBoundary: manifest.popiaSafeCandidateBoundary === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-02 - Candidate auth/session/account recovery boundary."
    : "Repair N04-CANDIDATE-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-01 proof passed.");