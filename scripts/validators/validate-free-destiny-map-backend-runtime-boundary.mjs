#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-backend-runtime-boundary-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-backend-runtime-boundary.md",
  "manifests/runtime/free-destiny-map-backend-runtime-boundary.json",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "packages/contracts/src/free-destiny-map-backend-runtime-boundary.ts",
  "scripts/runtime/Invoke-FreeDestinyMapBackendRuntimeBoundary.ps1",
  "scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs",
  "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json",
  "scripts/validators/validate-free-destiny-map-backend-runtime-boundary.mjs",
  "reports/validation/free-destiny-map-backend-runtime-boundary-latest.json"
];

const upstreamFiles = [
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts",
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

if (exists("manifests/runtime/free-destiny-map-backend-runtime-boundary.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-backend-runtime-boundary.json");
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
  ["apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs", ["createFreeDestinyMapBackendLocalServer", "buildFreeDestinyMapBackendResponse", "backendBoundaryReached: true", "productionReady: false", "deployedToOracle: false", "paymentInstructionSent: false", "emailSent: false", "documentUploadAccepted: false"]],
  ["packages/contracts/src/free-destiny-map-backend-runtime-boundary.ts", ["BACKEND_RUNTIME_BOUNDARY_PROVEN", "FREE_DESTINY_MAP_BACKEND_RUNTIME_INTAKE_ENDPOINT", "deployedToOracle: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapBackendRuntimeBoundary.ps1", ["BackendRuntimeBoundary", "KINGSMEN_ENABLE_LOCAL_BACKEND_WRITE", "does not deploy to Oracle"]],
  ["scripts/proof/prove-free-destiny-map-backend-runtime-boundary.mjs", ["BACKEND_RUNTIME_BOUNDARY_PROVEN", "backend-boundary-health-status-200", "backend-boundary-intake-status-202", "backend-boundary-local-write-succeeded"]],
  ["reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json");
  if (proof.passed !== true) failures.push("Backend runtime boundary proof must pass.");
  if (proof.status !== "BACKEND_RUNTIME_BOUNDARY_PROVEN") failures.push("Backend runtime boundary proof status must be BACKEND_RUNTIME_BOUNDARY_PROVEN.");
  if (proof.productionReady !== false) failures.push("Backend runtime boundary proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Backend runtime boundary proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Backend runtime boundary proof must keep deployedToOracle false.");
  if (proof.serverStarted !== true) failures.push("Backend runtime boundary proof must start server.");
  if (proof.serverStopped !== true) failures.push("Backend runtime boundary proof must stop server.");
  if (proof.healthStatus !== 200) failures.push("Backend runtime boundary proof must record healthStatus 200.");
  if (proof.intakeStatus !== 202) failures.push("Backend runtime boundary proof must record intakeStatus 202.");
  if (proof.backend_boundary_reached !== true) failures.push("Backend runtime boundary proof must record backend boundary reached.");
  if (proof.backend_local_write_succeeded !== true) failures.push("Backend runtime boundary proof must record local write success.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 20) failures.push("Backend runtime boundary proof must include detailed checks.");
}

const forbiddenFiles = [
  "docs/runtime/free-destiny-map-backend-runtime-boundary.md",
  "manifests/runtime/free-destiny-map-backend-runtime-boundary.json",
  "apps/api/src/runtime/free-destiny-map-backend-local-runtime.mjs",
  "packages/contracts/src/free-destiny-map-backend-runtime-boundary.ts",
  "scripts/runtime/Invoke-FreeDestinyMapBackendRuntimeBoundary.ps1"
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
  module: "BATCH 17 - Backend Runtime Integration Shell / Local API Service Boundary",
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
  control_plane_impact: "Adds the first backend runtime service boundary before Next-to-backend bridge proof.",
  runtime_proof: "reports/runtime/free-destiny-map-backend-runtime-boundary-proof.json",
  next_action: passed ? "Proceed to BATCH 18 - Controlled Next-to-backend bridge proof." : "Repair backend runtime boundary proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
