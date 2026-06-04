import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_02_AUTH_SESSIONS_ACCOUNT_RECOVERY.md",
  "manifests/n04/n04-candidate-02-auth-sessions-account-recovery.json",
  "packages/contracts/src/n04-auth-session-contract.ts",
  "packages/contracts/src/n04-account-recovery-contract.ts",
  "packages/contracts/src/n04-own-data-boundary-contract.ts",
  "packages/backend/src/n04/auth-session-policy.ts",
  "packages/backend/src/n04/account-recovery-policy.ts",
  "packages/backend/src/n04/own-data-boundary-policy.ts",
  "packages/db/src/n04-auth-session-policy.ts",
  "reports/n04/n04-candidate-01-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-02-auth-sessions-account-recovery.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-02-auth-sessions-account-recovery.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate01",
  "candidateAuthBoundaryBuilt",
  "sessionBoundaryBuilt",
  "accountRecoveryBoundaryBuilt",
  "sessionAuditRequired",
  "serviceRoleBackendOnly",
  "anonBrowserOwnDataOnly",
  "candidateCannotBypassTruthAuthority",
  "popiaSafeAccountRecovery"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const session = fs.existsSync("packages/backend/src/n04/auth-session-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/auth-session-policy.ts", "utf8")
  : "";

for (const phrase of ["own_data_only", "service_role must never be visible", "requires auditId"]) {
  if (!session.includes(phrase)) failures.push(`Session policy missing phrase: ${phrase}`);
}

const recovery = fs.existsSync("packages/backend/src/n04/account-recovery-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/account-recovery-policy.ts", "utf8")
  : "";

for (const phrase of ["POPIA access log", "cannot auto-approve"]) {
  if (!recovery.includes(phrase)) failures.push(`Recovery policy missing phrase: ${phrase}`);
}

const ownData = fs.existsSync("packages/backend/src/n04/own-data-boundary-policy.ts")
  ? fs.readFileSync("packages/backend/src/n04/own-data-boundary-policy.ts", "utf8")
  : "";

for (const phrase of ["own data", "mark_paid", "mark_submitted", "verify_outcome", "change_source_confidence"]) {
  if (!ownData.includes(phrase)) failures.push(`Own-data policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-02-validation.v1",
  module: "N04-CANDIDATE-02",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-02-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-02 validation passed.");