import fs from "node:fs";

const required = [
  "docs/constitution/KINGSMEN_CONSTITUTION.md",
  "manifests/constitution/n00-constitution-doctrine-lock.json",
  "packages/contracts/src/constitution-contract.ts",
  "packages/backend/src/constitution/constitution-loader.ts",
  "scripts/validators/validate-n00-constitution-doctrine-lock.mjs"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);

const manifestPath = "manifests/constitution/n00-constitution-doctrine-lock.json";
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.oracleLiteDefault !== true) failures.push("oracleLiteDefault must be true");
if (manifest.allSixGatesVisibleToAllUsers !== true) failures.push("allSixGatesVisibleToAllUsers must be true");
if (manifest.packageControlsIntensityNotGateAccess !== true) failures.push("packageControlsIntensityNotGateAccess must be true");
if (manifest.caoParentChildRule !== true) failures.push("caoParentChildRule must be true");
if (manifest.submittedRequiresProof !== true) failures.push("submittedRequiresProof must be true");
if (manifest.captchaOtpBypassAllowed !== false) failures.push("captchaOtpBypassAllowed must be false");
if (manifest.activeCandidateStartingCap !== 500) failures.push("activeCandidateStartingCap must be 500");

const report = {
  schema: "kingsmen.n00-constitution-proof.v1",
  module: "N00 - Constitution / Doctrine Lock",
  status: failures.length === 0
    ? "N00_CONSTITUTION_DOCTRINE_LOCK_PROVEN"
    : "N00_CONSTITUTION_DOCTRINE_LOCK_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  oracleLiteDefault: manifest.oracleLiteDefault === true,
  allSixGatesVisibleToAllUsers: manifest.allSixGatesVisibleToAllUsers === true,
  packageControlsIntensityNotGateAccess: manifest.packageControlsIntensityNotGateAccess === true,
  caoParentChildRule: manifest.caoParentChildRule === true,
  noProofNoSubmitted: manifest.submittedRequiresProof === true,
  emailFirst: manifest.emailFirst === true,
  whatsappUrgentOnly: manifest.whatsappUrgentOnly === true,
  playwrightProbeOnly: manifest.playwrightProbeOnly === true,
  captchaOtpBypassAllowed: manifest.captchaOtpBypassAllowed === true,
  sourceConfidenceRequired: manifest.sourceConfidenceRequiredForOfficialInstructions === true,
  aiMaySuggestNotGovern: manifest.aiMaySuggestNotGovern === true,
  activeCandidateStartingCap: manifest.activeCandidateStartingCap,
  failures,
  nextAction: failures.length === 0
    ? "Continue to the next missing foundational layer after N00."
    : "Repair N00 constitution files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/constitution", { recursive: true });
fs.writeFileSync("reports/constitution/n00-constitution-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N00 constitution doctrine lock proof passed.");