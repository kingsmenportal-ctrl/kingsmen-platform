import fs from "node:fs";

const requiredFiles = [
  "docs/n04/N04_CANDIDATE_03_PORTAL_SHELL_DASHBOARD_SIX_GATE_VIEW.md",
  "manifests/n04/n04-candidate-03-portal-shell-dashboard-six-gate-view.json",
  "packages/contracts/src/n04-dashboard-read-model-contract.ts",
  "packages/contracts/src/n04-six-gate-portal-view-contract.ts",
  "packages/backend/src/n04/dashboard-read-model-policy.ts",
  "packages/backend/src/n04/portal-shell-policy.ts",
  "apps/web/src/app/candidate/dashboard/page.tsx",
  "packages/db/src/n04-dashboard-read-model-policy.ts",
  "reports/n04/n04-candidate-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n04/n04-candidate-03-portal-shell-dashboard-six-gate-view.json")
  ? JSON.parse(fs.readFileSync("manifests/n04/n04-candidate-03-portal-shell-dashboard-six-gate-view.json", "utf8"))
  : {};

for (const key of [
  "requiresN04Candidate02",
  "candidatePortalShellBuilt",
  "dashboardReadModelBuilt",
  "sixGateViewBuilt",
  "allSixGatesVisibleToAllUsers",
  "packageControlsIntensityNotGateAccess",
  "candidateSafeReadModelOnly",
  "serviceRoleNeverInBrowser",
  "noTruthAuthorityActionsInBrowser"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const dashboard = fs.existsSync("apps/web/src/app/candidate/dashboard/page.tsx")
  ? fs.readFileSync("apps/web/src/app/candidate/dashboard/page.tsx", "utf8")
  : "";

for (const gate of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  if (!dashboard.includes(gate)) failures.push(`Candidate dashboard missing gate: ${gate}`);
}

for (const phrase of [
  '"use client"',
  "Readiness checklist",
  "localStorage",
  "Your current priority",
  "Make this my priority",
  "not an official verification result",
  "not yet synced to your Kingsmen account",
  "does not claim that your identity",
  "An order or payment return page alone does not activate a paid service",
  "higher_education",
  "tvet",
  "seta_learnership",
  "internship",
  "apprenticeship",
  "employment"
]) {
  if (!dashboard.includes(phrase)) failures.push(`Candidate dashboard missing required behaviour or safety copy: ${phrase}`);
}

const report = {
  schema: "kingsmen.n04-candidate-03-validation.v1",
  module: "N04-CANDIDATE-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n04-candidate-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N04-CANDIDATE-03 validation passed.");