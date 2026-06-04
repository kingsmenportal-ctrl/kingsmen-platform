import fs from "node:fs";

const requiredFiles = [
  "docs/n08/N08_FOUNDER_03_DAILY_DIGEST_MOBILE_ALERTS_STOP_SELLING.md",
  "manifests/n08/n08-founder-03-daily-digest-mobile-alerts-stop-selling.json",
  "packages/contracts/src/n08-founder-digest-contract.ts",
  "packages/contracts/src/n08-mobile-alert-contract.ts",
  "packages/contracts/src/n08-stop-selling-operations-contract.ts",
  "packages/backend/src/n08/founder-digest-policy.ts",
  "packages/backend/src/n08/mobile-alert-policy.ts",
  "packages/backend/src/n08/stop-selling-operations-policy.ts",
  "apps/web/src/app/api/founder/digest/route.ts",
  "apps/web/src/app/api/founder/alerts/mobile/route.ts",
  "apps/web/src/app/api/founder/stop-selling/route.ts",
  "apps/web/src/app/founder/control-plane/digest/page.tsx",
  "reports/n08/n08-founder-02-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n08/n08-founder-03-daily-digest-mobile-alerts-stop-selling.json")
  ? JSON.parse(fs.readFileSync("manifests/n08/n08-founder-03-daily-digest-mobile-alerts-stop-selling.json", "utf8"))
  : {};

for (const key of [
  "requiresN08Founder02",
  "dailyDigestContractBuilt",
  "mobileAlertContractBuilt",
  "stopSellingOperationsBuilt",
  "founderRhythmBuilt",
  "urgentOnlyAlertBoundaryBuilt",
  "candidateHarmAlertBuilt",
  "providerFailureAlertBuilt",
  "queueDangerAlertBuilt",
  "privacyRiskAlertBuilt",
  "stopSellingLimitsVolumeNotCapability"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const alertPolicy = fs.existsSync("packages/backend/src/n08/mobile-alert-policy.ts")
  ? fs.readFileSync("packages/backend/src/n08/mobile-alert-policy.ts", "utf8")
  : "";

for (const phrase of ["candidate_harm", "provider_failure", "queue_danger", "privacy_risk", "urgentOnly: true"]) {
  if (!alertPolicy.includes(phrase)) failures.push(`Mobile alert policy missing ${phrase}`);
}

const stopSelling = fs.existsSync("packages/backend/src/n08/stop-selling-operations-policy.ts")
  ? fs.readFileSync("packages/backend/src/n08/stop-selling-operations-policy.ts", "utf8")
  : "";

for (const phrase of ["capLimitsVolumeNotCapability: true", "gatesRemainVisibleAndAssessable: true", "founderApprovalRequired"]) {
  if (!stopSelling.includes(phrase)) failures.push(`Stop-selling policy missing ${phrase}`);
}

const page = fs.existsSync("apps/web/src/app/founder/control-plane/digest/page.tsx")
  ? fs.readFileSync("apps/web/src/app/founder/control-plane/digest/page.tsx", "utf8")
  : "";

for (const phrase of ["Founder Daily Digest", "Mobile alerts", "Stop-selling operations", "Founder rhythm"]) {
  if (!page.includes(phrase)) failures.push(`Founder digest page missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n08-founder-03-validation.v1",
  module: "N08-FOUNDER-03",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n08-founder-03-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-03 validation passed.");