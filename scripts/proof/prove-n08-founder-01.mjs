import fs from "node:fs";

const required = [
  "docs/n08/N08_FOUNDER_01_MOBILE_CONTROL_PLANE_ACTION_PACKETS_QUEUE_HEALTH.md",
  "manifests/n08/n08-founder-01-mobile-control-plane-action-packets-queue-health.json",
  "packages/contracts/src/n08-founder-action-packet-contract.ts",
  "packages/contracts/src/n08-queue-health-contract.ts",
  "packages/backend/src/n08/founder-action-packet-policy.ts",
  "packages/backend/src/n08/queue-health-policy.ts",
  "packages/backend/src/n08/founder-provider-health-summary.ts",
  "packages/backend/src/n08/stop-selling-signal-policy.ts",
  "apps/web/src/app/founder/control-plane/page.tsx",
  "apps/web/src/app/api/founder/control-plane/health/route.ts",
  "scripts/validators/validate-n08-founder-01.mjs",
  "reports/n07/n07-airtable-04-proof-latest.json"
];

const failures = required.filter((path) => !fs.existsSync(path)).map((path) => `Missing ${path}`);
const manifest = JSON.parse(fs.readFileSync("manifests/n08/n08-founder-01-mobile-control-plane-action-packets-queue-health.json", "utf8"));

if (manifest.productionReady !== false) failures.push("productionReady must be false");
if (manifest.founderMobileControlPlaneBuilt !== true) failures.push("founderMobileControlPlaneBuilt must be true");
if (manifest.actionPacketContractBuilt !== true) failures.push("actionPacketContractBuilt must be true");
if (manifest.queueHealthReadModelBuilt !== true) failures.push("queueHealthReadModelBuilt must be true");
if (manifest.proofAuditRequiredForTruthChange !== true) failures.push("proofAuditRequiredForTruthChange must be true");

const report = {
  schema: "kingsmen.n08-founder-01-proof.v1",
  module: "N08-FOUNDER-01 - Founder Mobile Control Plane / Action Packets / Queue Health",
  status: failures.length === 0 ? "N08_FOUNDER_MOBILE_CONTROL_PLANE_ACTION_PACKETS_QUEUE_HEALTH_PROVEN" : "N08_FOUNDER_MOBILE_CONTROL_PLANE_ACTION_PACKETS_QUEUE_HEALTH_BLOCKED",
  passed: failures.length === 0,
  productionReady: false,
  founderMobileControlPlaneBuilt: manifest.founderMobileControlPlaneBuilt === true,
  actionPacketContractBuilt: manifest.actionPacketContractBuilt === true,
  queueHealthReadModelBuilt: manifest.queueHealthReadModelBuilt === true,
  providerHealthSummaryBuilt: manifest.providerHealthSummaryBuilt === true,
  stopSellingSignalSurfaceBuilt: manifest.stopSellingSignalSurfaceBuilt === true,
  exceptionOnlyFounderModeBuilt: manifest.exceptionOnlyFounderModeBuilt === true,
  proofAuditRequiredForTruthChange: manifest.proofAuditRequiredForTruthChange === true,
  oracleLiteCapacityVisible: manifest.oracleLiteCapacityVisible === true,
  failures,
  nextAction: failures.length === 0
    ? "Continue to N08-FOUNDER-02 - Approval workflows, command execution, and audit trail."
    : "Repair N08-FOUNDER-01 files and rerun validators.",
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/n08", { recursive: true });
fs.writeFileSync("reports/n08/n08-founder-01-proof-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-01 proof passed.");