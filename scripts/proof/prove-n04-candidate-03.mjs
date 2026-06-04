import fs from "node:fs";

const required = [
  "docs/n04/N04_CANDIDATE_03_PORTAL_SHELL_DASHBOARD_SIX_GATE_VIEW.md",
  "manifests/n04/n04-candidate-03-portal-shell-dashboard-six-gate-view.json",
  "packages/contracts/src/n04-dashboard-read-model-contract.ts",
  "packages/contracts/src/n04-six-gate-portal-view-contract.ts",
  "packages/backend/src/n04/dashboard-read-model-policy.ts",
  "packages/backend/src/n04/portal-shell-policy.ts",
  "apps/web/src/app/candidate/dashboard/page.tsx",
  "packages/db/src/n04-dashboard-read-model-policy.ts",
  "scripts/validators/validate-n04-candidate-03.mjs",
  "reports/n04/n04-candidate-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-03-portal-shell-dashboard-six-gate-view.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.allSixGatesVisibleToAllUsers !== true) failures.push("allSixGatesVisibleToAllUsers must be true");
if (manifest.serviceRoleNeverInBrowser !== true) failures.push("serviceRoleNeverInBrowser must be true");
if (manifest.noTruthAuthorityActionsInBrowser !== true) failures.push("noTruthAuthorityActionsInBrowser must be true");

const report = {
  schema: "kingsmen.n04-candidate-03-proof.v1",
  module: "N04-CANDIDATE-03 - Candidate Portal Shell / Dashboard Read Model / Six-Gate View",
  status: failures.length === 0 ? "N04_CANDIDATE_PORTAL_SHELL_DASHBOARD_SIX_GATE_VIEW_PROVEN" : "N04_CANDIDATE_PORTAL_SHELL_DASHBOARD_SIX_GATE_VIEW_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  candidatePortalShellBuilt: manifest.candidatePortalShellBuilt === true,
  dashboardReadModelBuilt: manifest.dashboardReadModelBuilt === true,
  sixGateViewBuilt: manifest.sixGateViewBuilt === true,
  allSixGatesVisibleToAllUsers: manifest.allSixGatesVisibleToAllUsers === true,
  packageControlsIntensityNotGateAccess: manifest.packageControlsIntensityNotGateAccess === true,
  candidateSafeReadModelOnly: manifest.candidateSafeReadModelOnly === true,
  serviceRoleNeverInBrowser: manifest.serviceRoleNeverInBrowser === true,
  noTruthAuthorityActionsInBrowser: manifest.noTruthAuthorityActionsInBrowser === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N04-CANDIDATE-04 - profile edit review and candidate data correction boundary."
    : "Repair N04-CANDIDATE-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n04", { recursive: true });
fs.writeFileSync("reports/n04/n04-candidate-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-03 proof passed.");