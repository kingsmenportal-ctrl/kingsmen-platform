import fs from "node:fs";

const requiredFiles = [
  "docs/constitution/KINGSMEN_CONSTITUTION.md",
  "manifests/constitution/n00-constitution-doctrine-lock.json",
  "packages/contracts/src/constitution-contract.ts",
  "packages/backend/src/constitution/constitution-loader.ts"
];

const requiredTrue = [
  "oracleLiteDefault",
  "postgresBackendAuthority",
  "proofDisciplineRequired",
  "allSixGatesVisibleToAllUsers",
  "packageControlsIntensityNotGateAccess",
  "caoParentChildRule",
  "submittedRequiresProof",
  "outcomeRequiresProof",
  "emailFirst",
  "whatsappUrgentOnly",
  "smsBackupOnly",
  "playwrightProbeOnly",
  "mapFallbackRequiredOnPortalBlocker",
  "sourceConfidenceRequiredForOfficialInstructions",
  "candidatePartnerSharingRequiresConsent",
  "aiMaySuggestNotGovern",
  "capLimitsVolumeNotCapability",
  "founderApprovalRequiredForHighRiskActions"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifestPath = "manifests/constitution/n00-constitution-doctrine-lock.json";
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};

for (const key of requiredTrue) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.captchaOtpBypassAllowed !== false) failures.push("captchaOtpBypassAllowed must be false");
if (manifest.activeCandidateStartingCap !== 500) failures.push("activeCandidateStartingCap must be 500");

const constitutionText = fs.existsSync("docs/constitution/KINGSMEN_CONSTITUTION.md")
  ? fs.readFileSync("docs/constitution/KINGSMEN_CONSTITUTION.md", "utf8")
  : "";

for (const phrase of [
  "Oracle Free / Oracle Lite",
  "All candidates can see",
  "CAO is one Kingsmen parent application",
  "Submitted requires proof",
  "Email is the primary",
  "WhatsApp is urgent-only",
  "Playwright is probe/scout only",
  "AI may suggest",
  "Growth cap starts at 500"
]) {
  if (!constitutionText.includes(phrase)) failures.push(`Constitution doc missing phrase: ${phrase}`);
}

const report = {
  schema: "kingsmen.n00-constitution-validation.v1",
  module: "N00 - Constitution / Doctrine Lock",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n00-constitution-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N00 constitution doctrine lock validation passed.");