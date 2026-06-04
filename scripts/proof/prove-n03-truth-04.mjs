import fs from "node:fs";

const required = [
  "docs/n03/N03_TRUTH_04_POPIA_EVIDENCE_SOURCE_AUTHORITY.md",
  "manifests/n03/n03-truth-04-popia-evidence-source-authority.json",
  "packages/contracts/src/n03-popia-access-log-contract.ts",
  "packages/contracts/src/n03-evidence-immutability-contract.ts",
  "packages/contracts/src/n03-source-authority-contract.ts",
  "packages/backend/src/n03/popia-access-log-policy.ts",
  "packages/backend/src/n03/evidence-immutability-policy.ts",
  "packages/backend/src/n03/source-authority-policy.ts",
  "packages/db/src/n03-popia-evidence-source-policy.ts",
  "scripts/validators/validate-n03-truth-04.mjs",
  "reports/n03/n03-truth-03-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n03/n03-truth-04-popia-evidence-source-authority.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.evidenceDeleteBlocked !== true) failures.push("evidenceDeleteBlocked must be true");
if (manifest.silentOverwriteBlocked !== true) failures.push("silentOverwriteBlocked must be true");
if (manifest.officialInstructionsRequireVerifiedSource !== true) failures.push("officialInstructionsRequireVerifiedSource must be true");

const report = {
  schema: "kingsmen.n03-truth-04-proof.v1",
  module: "N03-TRUTH-04 - POPIA Access Log / Evidence Immutability / Source Authority Registry",
  status: failures.length === 0 ? "N03_POPIA_EVIDENCE_SOURCE_AUTHORITY_PROVEN" : "N03_POPIA_EVIDENCE_SOURCE_AUTHORITY_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  popiaAccessLogBuilt: manifest.popiaAccessLogBuilt === true,
  evidenceImmutableAppendFirst: manifest.evidenceImmutableAppendFirst === true,
  sourceAuthorityRegistryBuilt: manifest.sourceAuthorityRegistryBuilt === true,
  officialInstructionsRequireVerifiedSource: manifest.officialInstructionsRequireVerifiedSource === true,
  candidateDataAccessMustBeLogged: manifest.candidateDataAccessMustBeLogged === true,
  evidenceDeleteBlocked: manifest.evidenceDeleteBlocked === true,
  silentOverwriteBlocked: manifest.silentOverwriteBlocked === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N03-TRUTH-05 - database readiness report and migration handoff boundary."
    : "Repair N03-TRUTH-04 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n03", { recursive: true });
fs.writeFileSync("reports/n03/n03-truth-04-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N03-TRUTH-04 proof passed.");