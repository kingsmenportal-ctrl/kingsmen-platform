#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-controlled-production-build-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-controlled-production-build-proof.md",
  "manifests/runtime/free-destiny-map-controlled-production-build-proof.json",
  "packages/contracts/src/free-destiny-map-controlled-production-build.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledProductionBuild.ps1",
  "scripts/proof/prove-free-destiny-map-controlled-production-build.mjs",
  "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  "scripts/validators/validate-free-destiny-map-controlled-production-build.mjs",
  "reports/validation/free-destiny-map-controlled-production-build-latest.json"
];

const upstreamFiles = [
  "reports/runtime/free-destiny-map-controlled-web-api-integration-proof.json",
  "apps/web/package.json",
  "apps/web/package-lock.json",
  "apps/web/next.config.mjs",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts"
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

if (exists("manifests/runtime/free-destiny-map-controlled-production-build-proof.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-controlled-production-build-proof.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.deploysToOracle !== false) failures.push("Manifest must declare deploysToOracle false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-controlled-production-build.ts", ["CONTROLLED_PRODUCTION_BUILD_PROVEN", "deployedToOracle: false", "canClaimProduction: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapControlledProductionBuild.ps1", ["ControlledProductionBuild", "does not deploy to Oracle", "does not submit official applications"]],
  ["scripts/proof/prove-free-destiny-map-controlled-production-build.mjs", ["CONTROLLED_PRODUCTION_BUILD_PROVEN", "controlled-production-build-exit-code-zero", "controlled-production-build-output-directory-exists", "deployedToOracle: false"]],
  ["reports/runtime/free-destiny-map-controlled-production-build-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-controlled-production-build-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-controlled-production-build-proof.json");
  if (proof.passed !== true) failures.push("Controlled production build proof must pass.");
  if (proof.status !== "CONTROLLED_PRODUCTION_BUILD_PROVEN") failures.push("Controlled production build proof status must be CONTROLLED_PRODUCTION_BUILD_PROVEN.");
  if (proof.productionReady !== false) failures.push("Controlled production build proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Controlled production build proof must keep canClaimProduction false.");
  if (proof.deployedToOracle !== false) failures.push("Controlled production build proof must keep deployedToOracle false.");
  if (proof.buildStarted !== true) failures.push("Controlled production build proof must start build.");
  if (proof.buildExited !== true) failures.push("Controlled production build proof must exit build.");
  if (proof.buildExitCode !== 0) failures.push("Controlled production build proof must record buildExitCode 0.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 20) failures.push("Controlled production build proof must include detailed checks.");
}

if (!exists("apps/web/.next")) failures.push("apps/web/.next must exist after controlled production build.");

const forbiddenFiles = [
  "docs/runtime/free-destiny-map-controlled-production-build-proof.md",
  "manifests/runtime/free-destiny-map-controlled-production-build-proof.json",
  "packages/contracts/src/free-destiny-map-controlled-production-build.ts",
  "scripts/runtime/Invoke-FreeDestinyMapControlledProductionBuild.ps1",
  "apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts"
];

const forbiddenPatterns = [
  [/productionReady\s*[:=]\s*true/i, "productionReady true"],
  [/canClaimProduction\s*[:=]\s*true/i, "canClaimProduction true"],
  [/deployedToOracle\s*[:=]\s*true/i, "deployedToOracle true"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/documentUploadAccepted:\s*true/i, "document upload accepted true"]
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
  module: "BATCH 16 - Controlled Production Build Proof",
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
  control_plane_impact: "Adds controlled local production build proof for apps/web.",
  runtime_proof: "reports/runtime/free-destiny-map-controlled-production-build-proof.json",
  next_action: passed ? "Proceed to BATCH 17 - Backend runtime integration or Oracle Lite container preparation." : "Repair controlled production build proof failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
