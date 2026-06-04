import fs from "node:fs";

const requiredFiles = [
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
  "reports/n07/n07-airtable-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n08/n08-founder-01-mobile-control-plane-action-packets-queue-health.json")
  ? JSON.parse(fs.readFileSync("manifests/n08/n08-founder-01-mobile-control-plane-action-packets-queue-health.json", "utf8"))
  : {};

for (const key of [
  "requiresN07Airtable04",
  "founderMobileControlPlaneBuilt",
  "actionPacketContractBuilt",
  "queueHealthReadModelBuilt",
  "providerHealthSummaryBuilt",
  "stopSellingSignalSurfaceBuilt",
  "exceptionOnlyFounderModeBuilt",
  "proofAuditRequiredForTruthChange",
  "oracleLiteCapacityVisible"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const page = fs.existsSync("apps/web/src/app/founder/control-plane/page.tsx")
  ? fs.readFileSync("apps/web/src/app/founder/control-plane/page.tsx", "utf8")
  : "";

for (const phrase of ["Mobile-first founder console", "Action packets", "Queue health", "Stop-selling", "Truth boundary"]) {
  if (!page.includes(phrase)) failures.push(`Founder control page missing ${phrase}`);
}

const queue = fs.existsSync("packages/backend/src/n08/queue-health-policy.ts")
  ? fs.readFileSync("packages/backend/src/n08/queue-health-policy.ts", "utf8")
  : "";

for (const phrase of ["maxWaiting: 500", "maxActive: 25", "stopSellingRecommended", "oracleLiteSafe"]) {
  if (!queue.includes(phrase)) failures.push(`Queue health policy missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n08-founder-01-validation.v1",
  module: "N08-FOUNDER-01",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n08-founder-01-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N08-FOUNDER-01 validation passed.");