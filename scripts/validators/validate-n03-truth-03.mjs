import fs from "node:fs";

const requiredFiles = [
  "docs/n03/N03_TRUTH_03_CAO_PARENT_CHILD_SIX_GATE_VISIBILITY.md",
  "manifests/n03/n03-truth-03-cao-parent-child-six-gate-visibility.json",
  "packages/contracts/src/n03-application-parent-child-contract.ts",
  "packages/contracts/src/n03-six-gate-visibility-contract.ts",
  "packages/backend/src/n03/cao-parent-child-policy.ts",
  "packages/backend/src/n03/six-gate-visibility-policy.ts",
  "packages/db/src/n03-cao-six-gate-policy.ts",
  "reports/n03/n03-truth-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n03/n03-truth-03-cao-parent-child-six-gate-visibility.json")
  ? JSON.parse(fs.readFileSync("manifests/n03/n03-truth-03-cao-parent-child-six-gate-visibility.json", "utf8"))
  : {};

for (const key of [
  "requiresN03Truth02",
  "caoIsOneParentApplication",
  "caoProgrammeChoicesAreChildren",
  "packageCountsParentApplicationsNotCaoChoices",
  "allSixGatesVisibleToAllUsers",
  "packageControlsIntensityNotGateAccess",
  "capLimitsVolumeNotCapability"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.activeCandidateStartingCap !== 500) failures.push("activeCandidateStartingCap must be 500");

const sixGate = fs.existsSync("packages/backend/src/n03/six-gate-visibility-policy.ts")
  ? fs.readFileSync("packages/backend/src/n03/six-gate-visibility-policy.ts", "utf8")
  : "";

for (const gate of ["higher_education", "tvet", "seta_learnership", "internship", "apprenticeship", "employment"]) {
  if (!sixGate.includes(gate)) failures.push(`Six-gate policy missing gate: ${gate}`);
}

const caoPolicy = fs.existsSync("packages/backend/src/n03/cao-parent-child-policy.ts")
  ? fs.readFileSync("packages/backend/src/n03/cao-parent-child-policy.ts", "utf8")
  : "";

for (const phrase of ["one Kingsmen parent application", "child choices", "separate Kingsmen managed applications"]) {
  if (!caoPolicy.includes(phrase)) failures.push(`CAO policy missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n03-truth-03-validation.v1",
  module: "N03-TRUTH-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n03-truth-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-03 validation passed.");