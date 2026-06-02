#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-next-backend-bridge-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-next-backend-bridge-proof.md",
  "manifests/runtime/free-destiny-map-next-backend-bridge-proof.json",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "packages/contracts/src/free-destiny-map-next-backend-bridge.ts",
  "scripts/runtime/Invoke-FreeDestinyMapNextBackendBridge.ps1",
  "scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs",
  "reports/runtime/free-destiny-map-next-backend-bridge-proof.json",
  "scripts/validators/validate-free-destiny-map-next-backend-bridge.mjs",
  "reports/validation/free-destiny-map-next-backend-bridge-latest.json"
];

const upstreamFiles = [
  "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/package.json",
  "data/local/.gitignore"
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

if (exists("manifests/runtime/free-destiny-map-next-backend-bridge-proof.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-next-backend-bridge-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.deploysToOracle !== false) failures.push("Manifest must declare deploysToOracle false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts", ["KINGSMEN_ENABLE_BACKEND_BRIDGE", "KINGSMEN_BACKEND_BASE_URL", "postToBackendBoundary", "backendBridgeSucceeded", "backendBoundaryReached", "KM-FDM-NEXT18-BRIDGE", "productionReady: false", "deployedToOracle: false"]],
  ["packages/contracts/src/free-destiny-map-next-backend-bridge.ts", ["NEXT_BACKEND_BRIDGE_PROVEN", "FREE_DESTINY_MAP_NEXT_BACKEND_BRIDGE_BACKEND_INTAKE_ENDPOINT", "deployedToOracle: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapNextBackendBridge.ps1", ["NextBackendBridge", "does not deploy to Oracle", "does not submit official applications"]],
  ["scripts/proof/prove-free-destiny-map-next-backend-bridge.mjs", ["NEXT_BACKEND_BRIDGE_PROVEN", "bridge-next-api-status-202", "bridge-response-backend-succeeded", "bridge-response-backend-boundary-reached", "KINGSMEN_ENABLE_BACKEND_BRIDGE"]],
  ["reports/runtime/free-destiny-map-next-backend-bridge-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-next-backend-bridge-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-next-backend-bridge-proof.json");
  if (proof.passed !== true) failures.push("Next-to-backend bridge proof must pass.");
  if (proof.status !== "NEXT_BACKEND_BRIDGE_PROVEN") failures.push("Next-to-backend bridge proof status must be NEXT_BACKEND_BRIDGE_PROVEN.");
  if (proof.productionReady !== false) failures.push("Next-to-backend bridge proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Next-to-backend bridge proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Next-to-backend bridge proof must keep deployedToOracle false.");
  if (proof.nextServerStarted !== true) failures.push("Next-to-backend bridge proof must start Next server.");
  if (proof.nextServerStopped !== true) failures.push("Next-to-backend bridge proof must stop Next server.");
  if (proof.backendServerStarted !== true) failures.push("Next-to-backend bridge proof must start backend server.");
  if (proof.backendServerStopped !== true) failures.push("Next-to-backend bridge proof must stop backend server.");
  if (proof.webStatus !== 200) failures.push("Next-to-backend bridge proof must record webStatus 200.");
  if (proof.backendHealthStatus !== 200) failures.push("Next-to-backend bridge proof must record backendHealthStatus 200.");
  if (proof.bridgeApiStatus !== 202) failures.push("Next-to-backend bridge proof must record bridgeApiStatus 202.");
  if (proof.backend_bridge_succeeded !== true) failures.push("Next-to-backend bridge proof must record backend_bridge_succeeded true.");
  if (proof.backend_boundary_reached !== true) failures.push("Next-to-backend bridge proof must record backend boundary reached.");
  if (proof.backend_local_write_succeeded !== true) failures.push("Next-to-backend bridge proof must record backend local write success.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 30) failures.push("Next-to-backend bridge proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/free-destiny-map-next-backend-bridge-proof.md",
  "manifests/runtime/free-destiny-map-next-backend-bridge-proof.json",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
  "packages/contracts/src/free-destiny-map-next-backend-bridge.ts",
  "scripts/runtime/Invoke-FreeDestinyMapNextBackendBridge.ps1"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/deployedToOracle\s*[:=]\s*true/i, "deployedToOracle true"],
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
  module: "BATCH 18 - Controlled Next-to-Backend Bridge Proof",
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
  control_plane_impact: "Adds controlled local Next API to backend runtime boundary bridge proof.",
  runtime_proof: "reports/runtime/free-destiny-map-next-backend-bridge-proof.json",
  next_action: passed ? "Proceed to BATCH 19 - Docker/Oracle Lite local runtime container preparation." : "Repair Next-to-backend bridge proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
