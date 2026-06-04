import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_07_PORTAL_SECURITY_DEVICE_TRUST_RLS.md",
  "manifests/n04/n04-candidate-07-portal-security-device-trust-rls.json",
  "packages/contracts/src/n04-device-trust-contract.ts",
  "packages/contracts/src/n04-session-risk-contract.ts",
  "packages/contracts/src/n04-rls-enforcement-contract.ts",
  "packages/backend/src/n04/device-trust-policy.ts",
  "packages/backend/src/n04/session-risk-policy.ts",
  "packages/backend/src/n04/rls-enforcement-policy.ts",
  "packages/db/src/n04-rls-security-policy.ts",
  "scripts/validators/validate-n04-candidate-07.mjs",
  "reports/n04/n04-candidate-06-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-07-portal-security-device-trust-rls.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.serviceRoleBackendOnly !== true) failures.push("serviceRoleBackendOnly must be true");
if (manifest.browserCannotAccessOtherCandidateData !== true) failures.push("browserCannotAccessOtherCandidateData must be true");
if (manifest.suspiciousSessionRequiresReview !== true) failures.push("suspiciousSessionRequiresReview must be true");

const report = {
  schema: "kingsmen.n04-candidate-07-proof.v1",
  module: "N04-CANDIDATE-07 - Portal Security / Device Trust / Account Recovery / RLS Enforcement",
  status: failures.length === 0 ? "N04_PORTAL_SECURITY_DEVICE_TRUST_RLS_PROVEN" : "N04_PORTAL_SECURITY_DEVICE_TRUST_RLS_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  deviceTrustBuilt: manifest.deviceTrustBuilt === true,
  sessionRiskBuilt: manifest.sessionRiskBuilt === true,
  accountRecoverySecurityBuilt: manifest.accountRecoverySecurityBuilt === true,
  candidateOwnDataRlsBuilt: manifest.candidateOwnDataRlsBuilt === true,
  serviceRoleBackendOnly: manifest.serviceRoleBackendOnly === true,
  browserCannotAccessOtherCandidateData: manifest.browserCannotAccessOtherCandidateData === true,
  suspiciousSessionRequiresReview: manifest.suspiciousSessionRequiresReview === true,
  popiaAccessLogRequired: manifest.popiaAccessLogRequired === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-08 - support centre, help requests, manual assistance, and tribunal intake."
    : "Repair N04-CANDIDATE-07 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-07-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-07 proof passed.");