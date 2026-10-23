import fs from "node:fs";

const requiredFiles = [
  "docs/n07/N07_AIRTABLE_04_SYNC_API_ROUTES_FOUNDER_HEALTH_CLOSEOUT.md",
  "manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json",
  "packages/contracts/src/n07-closeout-evidence-matrix-contract.ts",
  "packages/backend/src/n07/airtable-sync-api-policy.ts",
  "packages/backend/src/n07/founder-airtable-health-view.ts",
  "packages/backend/src/n07/n07-closeout-readiness-policy.ts",
  "apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts",
  "apps/web/src/app/api/founder/airtable/health/route.ts",
  "apps/web/src/app/founder/providers/airtable/page.tsx",
  "reports/n07/n07-closeout-evidence-matrix-latest.json",
  "reports/n07/n07-airtable-04-proof-latest.json"
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const manifest = fs.existsSync("manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json")
  ? JSON.parse(fs.readFileSync("manifests/n07/n07-airtable-04-sync-api-routes-founder-health-closeout.json", "utf8"))
  : {};

for (const key of [
  "syncEnqueueApiBuilt",
  "syncHealthApiBuilt",
  "founderHealthViewBuilt",
  "evidenceMatrixBuilt",
  "postgresTruthPreserved",
  "airtableMirrorOnly",
  "airtableTruthAuthorityBlocked",
  "missingCredentialsDegradeGracefully",
  "oracleLiteSyncLimitsConfirmed",
  "handoverToN08FounderControl"
]) {
  if (manifest[key] !== true) failures.push(`${key} must be true`);
}

if (manifest.productionReady !== false) failures.push("productionReady must be false");

const matrix = fs.existsSync("reports/n07/n07-closeout-evidence-matrix-latest.json")
  ? JSON.parse(fs.readFileSync("reports/n07/n07-closeout-evidence-matrix-latest.json", "utf8"))
  : {};

if (matrix.productionReady !== false) failures.push("matrix productionReady must be false");
if (matrix.allPassed !== true) failures.push("matrix allPassed must be true");
if (!Array.isArray(matrix.rows) || matrix.rows.length !== 3) failures.push("matrix must have 3 rows");
if (matrix.handoverTo !== "N08-FOUNDER-CONTROL") failures.push("matrix must hand over to N08-FOUNDER-CONTROL");

const enqueueRoute = fs.existsSync("apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts")
  ? fs.readFileSync("apps/web/src/app/api/founder/airtable/sync/enqueue/route.ts", "utf8")
  : "";

for (const phrase of [
  "QUEUE_ADAPTER_NOT_CONFIGURED",
  "queued: false",
  "status: 503",
  "productionReady: false"
]) {
  if (!enqueueRoute.includes(phrase)) failures.push(`enqueue route must contain fail-closed marker: ${phrase}`);
}
if (enqueueRoute.includes("queued: true")) {
  failures.push("enqueue route must never claim queued=true without a durable queue write");
}

const page = fs.existsSync("apps/web/src/app/founder/providers/airtable/page.tsx")
  ? fs.readFileSync("apps/web/src/app/founder/providers/airtable/page.tsx", "utf8")
  : "";

for (const phrase of ["PostgreSQL remains the truth", "Airtable is an async mirror only", "Oracle Lite discipline", "Airtable cannot govern"]) {
  if (!page.includes(phrase)) failures.push(`Founder Airtable page missing ${phrase}`);
}

const report = {
  schema: "kingsmen.n07-airtable-04-validation.v1",
  module: "N07-AIRTABLE-04",
  passed: failures.length === 0,
  productionReady: false,
  failures,
  checkedAt: new Date().toISOString()
};

fs.mkdirSync("reports/validation", { recursive: true });
fs.writeFileSync("reports/validation/n07-airtable-04-validation-latest.json", JSON.stringify(report, null, 2));

if (!report.passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log("N07-AIRTABLE-04 validation passed.");