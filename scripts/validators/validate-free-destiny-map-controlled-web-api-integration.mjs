#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-controlled-web-api-integration-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-controlled-web-api-integration-proof.md",
  "manifests/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "packages/contracts/src/free-destiny-map-controlled-web-api-integration.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledWebApiIntegration.ps1",
  "scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs",
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "scripts/validators/validate-free-destiny-map-controlled-web-api-integration.mjs",
  "reports/validation/free-destiny-map-controlled-web-api-integration-latest.json"
];

const upstreamFiles = [
  "reports/runtime/free-destiny-map-controlled-next-boot-proof.json",
  "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json",
  "apps/web/package.json",
  "apps/web/next.config.mjs",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx"
];

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

function parseJson(rel) {
  return JSON.parse(read(rel));
}

const failures = [];
const warnings = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty required file: ${file}`);
}

for (const file of upstreamFiles) {
  checked.push(file);
  if (!exists(file)) failures.push(`Missing upstream file: ${file}`);
  else if (fs.statSync(path.join(root, file)).size === 0) failures.push(`Empty upstream file: ${file}`);
}

if (exists("manifests/runtime/free-destiny-map-controlled-web-api-integration-proof.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-controlled-web-api-integration-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.webRoute !== "/free-destiny-map") failures.push("Manifest web route mismatch.");
  if (manifest.apiEndpoint !== "/api/public/free-destiny-map/intake/local") failures.push("Manifest API endpoint mismatch.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", ["export async function POST", "runtime = \"nodejs\"", "next-api-demo-intakes.jsonl", "productionReady: false", "officialApplicationSubmitted: false", "paymentInstructionSent: false", "documentUploadAccepted: false", "emailSent: false"]],
  ["packages/contracts/src/free-destiny-map-controlled-web-api-integration.ts", ["CONTROLLED_WEB_API_INTEGRATION_PROVEN", "FREE_DESTINY_MAP_CONTROLLED_LOCAL_API_ENDPOINT", "canClaimProduction: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapControlledWebApiIntegration.ps1", ["KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE", "ControlledWebApiIntegration", "does not claim production"]],
  ["scripts/proof/prove-free-destiny-map-controlled-web-api-integration.mjs", ["CONTROLLED_WEB_API_INTEGRATION_PROVEN", "controlled-web-api-post-status-202", "controlled-web-api-local-write-succeeded", "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE"]],
  ["reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json");
  if (proof.passed !== true) failures.push("Controlled web API integration proof must pass.");
  if (proof.status !== "CONTROLLED_WEB_API_INTEGRATION_PROVEN") failures.push("Controlled web API integration proof status must be CONTROLLED_WEB_API_INTEGRATION_PROVEN.");
  if (proof.productionReady !== false) failures.push("Controlled web API integration proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Controlled web API integration proof must keep canClaimProduction false.");
  if (proof.serverStarted !== true) failures.push("Controlled web API integration proof must start server.");
  if (proof.serverStopped !== true) failures.push("Controlled web API integration proof must stop server.");
  if (proof.webStatus !== 200) failures.push("Controlled web API integration proof must record webStatus 200.");
  if (proof.apiStatus !== 202) failures.push("Controlled web API integration proof must record apiStatus 202.");
  if (proof.api_local_write_succeeded !== true) failures.push("Controlled web API integration proof must record local write success.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 15) failures.push("Controlled web API integration proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/free-destiny-map-controlled-web-api-integration-proof.md",
  "manifests/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "packages/contracts/src/free-destiny-map-controlled-web-api-integration.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledWebApiIntegration.ps1"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/documentUploadAccepted:\s*true/i, "document upload accepted true"],
  [/\bidentityNumber\s*[:=]/i, "identity number assignment"],
  [/\bidNumber\s*[:=]/i, "id number assignment"],
  [/\bpassportNumber\s*[:=]/i, "passport number assignment"],
  [/\bcardNumber\s*[:=]/i, "card number assignment"],
  [/\bcvv\s*[:=]/i, "cvv assignment"]
];

for (const file of forbiddenFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 15B - Controlled Local Web + Local API Integration Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  upstream_files_checked: upstreamFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds controlled same-origin local web plus API intake proof.",
  runtime_proof: "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  next_action: passed ? "Proceed to BATCH 16 - Production build proof or backend runtime integration." : "Repair controlled local web plus API integration proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
