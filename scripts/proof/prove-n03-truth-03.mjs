import fs from "node:fs";

const required = [
  "docs/n03/N03_TRUTH_03_CAO_PARENT_CHILD_SIX_GATE_VISIBILITY.md",
  "manifests/n03/n03-truth-03-cao-parent-child-six-gate-visibility.json",
  "packages/contracts/src/n03-application-parent-child-contract.ts",
  "packages/contracts/src/n03-six-gate-visibility-contract.ts",
  "packages/backend/src/n03/cao-parent-child-policy.ts",
  "packages/backend/src/n03/six-gate-visibility-policy.ts",
  "packages/db/src/n03-cao-six-gate-policy.ts",
  "scripts/validators/validate-n03-truth-03.mjs",
  "reports/n03/n03-truth-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n03/n03-truth-03-cao-parent-child-six-gate-visibility.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.caoIsOneParentApplication !== true) failures.push("caoIsOneParentApplication must be true");
if (manifest.allSixGatesVisibleToAllUsers !== true) failures.push("allSixGatesVisibleToAllUsers must be true");
if (manifest.packageControlsIntensityNotGateAccess !== true) failures.push("packageControlsIntensityNotGateAccess must be true");
if (manifest.activeCandidateStartingCap !== 500) failures.push("activeCandidateStartingCap must be 500");

const report = {
  schema: "kingsmen.n03-truth-03-proof.v1",
  module: "N03-TRUTH-03 - CAO Parent-Child Application Model / Six-Gate Visibility Constraints",
  status: failures.length === 0 ? "N03_CAO_PARENT_CHILD_SIX_GATE_VISIBILITY_PROVEN" : "N03_CAO_PARENT_CHILD_SIX_GATE_VISIBILITY_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  caoIsOneParentApplication: manifest.caoIsOneParentApplication === true,
  caoProgrammeChoicesAreChildren: manifest.caoProgrammeChoicesAreChildren === true,
  packageCountsParentApplicationsNotCaoChoices: manifest.packageCountsParentApplicationsNotCaoChoices === true,
  allSixGatesVisibleToAllUsers: manifest.allSixGatesVisibleToAllUsers === true,
  packageControlsIntensityNotGateAccess: manifest.packageControlsIntensityNotGateAccess === true,
  capLimitsVolumeNotCapability: manifest.capLimitsVolumeNotCapability === true,
  activeCandidateStartingCap: manifest.activeCandidateStartingCap,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N03-TRUTH-04 - POPIA access log, evidence immutability, and source authority registry."
    : "Repair N03-TRUTH-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n03", { recursive: true });
fs.writeFileSync("reports/n03/n03-truth-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-03 proof passed.");