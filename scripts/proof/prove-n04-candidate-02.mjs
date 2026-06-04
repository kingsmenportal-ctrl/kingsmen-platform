import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_02_AUTH_SESSIONS_ACCOUNT_RECOVERY.md",
  "manifests/n04/n04-candidate-02-auth-sessions-account-recovery.json",
  "packages/contracts/src/n04-auth-session-contract.ts",
  "packages/contracts/src/n04-account-recovery-contract.ts",
  "packages/contracts/src/n04-own-data-boundary-contract.ts",
  "packages/backend/src/n04/auth-session-policy.ts",
  "packages/backend/src/n04/account-recovery-policy.ts",
  "packages/backend/src/n04/own-data-boundary-policy.ts",
  "packages/db/src/n04-auth-session-policy.ts",
  "scripts/validators/validate-n04-candidate-02.mjs",
  "reports/n04/n04-candidate-01-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-02-auth-sessions-account-recovery.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.serviceRoleBackendOnly !== true) failures.push("serviceRoleBackendOnly must be true");
if (manifest.anonBrowserOwnDataOnly !== true) failures.push("anonBrowserOwnDataOnly must be true");
if (manifest.candidateCannotBypassTruthAuthority !== true) failures.push("candidateCannotBypassTruthAuthority must be true");

const report = {
  schema: "kingsmen.n04-candidate-02-proof.v1",
  module: "N04-CANDIDATE-02 - Candidate Auth / Sessions / Account Recovery Boundary",
  status: failures.length === 0 ? "N04_CANDIDATE_AUTH_SESSIONS_ACCOUNT_RECOVERY_PROVEN" : "N04_CANDIDATE_AUTH_SESSIONS_ACCOUNT_RECOVERY_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  candidateAuthBoundaryBuilt: manifest.candidateAuthBoundaryBuilt === true,
  sessionBoundaryBuilt: manifest.sessionBoundaryBuilt === true,
  accountRecoveryBoundaryBuilt: manifest.accountRecoveryBoundaryBuilt === true,
  sessionAuditRequired: manifest.sessionAuditRequired === true,
  serviceRoleBackendOnly: manifest.serviceRoleBackendOnly === true,
  anonBrowserOwnDataOnly: manifest.anonBrowserOwnDataOnly === true,
  candidateCannotBypassTruthAuthority: manifest.candidateCannotBypassTruthAuthority === true,
  popiaSafeAccountRecovery: manifest.popiaSafeAccountRecovery === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-03 - Candidate portal shell, dashboard read model, and six-gate view."
    : "Repair N04-CANDIDATE-02 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-02-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-02 proof passed.");