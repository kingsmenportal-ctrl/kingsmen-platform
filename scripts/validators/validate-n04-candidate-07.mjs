import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_07_PORTAL_SECURITY_DEVICE_TRUST_RLS.md",
  "manifests/n04/n04-candidate-07-portal-security-device-trust-rls.json",
  "packages/contracts/src/n04-device-trust-contract.ts",
  "packages/contracts/src/n04-session-risk-contract.ts",
  "packages/contracts/src/n04-rls-enforcement-contract.ts",
  "packages/backend/src/n04/device-trust-policy.ts",
  "packages/backend/src/n04/session-risk-policy.ts",
  "packages/backend/src/n04/rls-enforcement-policy.ts",
  "packages/db/src/n04-rls-security-policy.ts",
  "reports/n04/n04-candidate-06-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-07-portal-security-device-trust-rls.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-07-portal-security-device-trust-rls.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate06",
  "deviceTrustBuilt",
  "sessionRiskBuilt",
  "accountRecoverySecurityBuilt",
  "candidateOwnDataRlsBuilt",
  "serviceRoleBackendOnly",
  "browserCannotAccessOtherCandidateData",
  "suspiciousSessionRequiresReview",
  "popiaAccessLogRequired"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const rls = fs.existsSync("packages/backend/src/n04/rls-enforcement-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/rls-enforcement-policy.ts", "utf8")
  : "";

for (const phrase of [
  "public candidate data access is not allowed",
  "service_role must never be visible",
  "own_data_only",
  "candidate cannot access another candidate"
]) {
  if (!rls.includes(phrase)) failures.push(`RLS policy missing phrase: ${phrase}`);
}

const session = fs.existsSync("packages/backend/src/n04/session-risk-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/session-risk-policy.ts", "utf8")
  : "";

for (const phrase of ["suspicious/high-risk session requires review", "blocked session/device cannot continue"]) {
  if (!session.includes(phrase)) failures.push(`Session risk policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-07-validation.v1",
  module: "N04-CANDIDATE-07",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-07-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-07 validation passed.");