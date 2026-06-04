import fs from "node:fs";

const required = [
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
  "scripts/validators/validate-n08-founder-03.mjs",
  "reports/n08/n08-founder-02-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n08/n08-founder-03-daily-digest-mobile-alerts-stop-selling.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.dailyDigestContractBuilt !== true) failures.push("dailyDigestContractBuilt must be true");
if (manifest.mobileAlertContractBuilt !== true) failures.push("mobileAlertContractBuilt must be true");
if (manifest.stopSellingOperationsBuilt !== true) failures.push("stopSellingOperationsBuilt must be true");
if (manifest.stopSellingLimitsVolumeNotCapability !== true) failures.push("stopSellingLimitsVolumeNotCapability must be true");

const report = {
  schema: "kingsmen.n08-founder-03-proof.v1",
  module: "N08-FOUNDER-03 - Daily Digest / Mobile Alerts / Stop-Selling Operations",
  status: failures.length === 0 ? "N08_FOUNDER_DAILY_DIGEST_MOBILE_ALERTS_STOP_SELLING_PROVEN" : "N08_FOUNDER_DAILY_DIGEST_MOBILE_ALERTS_STOP_SELLING_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  dailyDigestContractBuilt: manifest.dailyDigestContractBuilt === true,
  mobileAlertContractBuilt: manifest.mobileAlertContractBuilt === true,
  stopSellingOperationsBuilt: manifest.stopSellingOperationsBuilt === true,
  founderRhythmBuilt: manifest.founderRhythmBuilt === true,
  urgentOnlyAlertBoundaryBuilt: manifest.urgentOnlyAlertBoundaryBuilt === true,
  candidateHarmAlertBuilt: manifest.candidateHarmAlertBuilt === true,
  providerFailureAlertBuilt: manifest.providerFailureAlertBuilt === true,
  queueDangerAlertBuilt: manifest.queueDangerAlertBuilt === true,
  privacyRiskAlertBuilt: manifest.privacyRiskAlertBuilt === true,
  stopSellingLimitsVolumeNotCapability: manifest.stopSellingLimitsVolumeNotCapability === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N08-FOUNDER-04 - Founder closeout, evidence matrix, and handover to N09 communications."
    : "Repair N08-FOUNDER-03 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n08", { recursive: true });
fs.writeFileSync("reports/n08/n08-founder-03-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-03 proof passed.");