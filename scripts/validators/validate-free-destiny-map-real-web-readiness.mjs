#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-real-web-readiness-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-real-web-readiness-gate.md",
  "manifests/runtime/free-destiny-map-real-web-readiness-gate.json",
  "packages/contracts/src/free-destiny-map-real-web-readiness.ts",
  "scripts/runtime/Invoke-FreeDestinyMapRealWebReadinessGate.ps1",
  "scripts/proof/prove-free-destiny-map-real-web-readiness.mjs",
  "reports/runtime/free-destiny-map-real-web-readiness-proof.json",
  "scripts/validators/validate-free-destiny-map-real-web-readiness.mjs",
  "reports/validation/free-destiny-map-real-web-readiness-latest.json"
];

const upstreamFiles = [
  "apps/web/src/app/free-destiny-map/page.tsx",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
  "packages/contracts/src/free-destiny-map-api-wiring.ts",
  "reports/runtime/free-destiny-map-browser-style-submit-proof.json"
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

if (exists("manifests/runtime/free-destiny-map-real-web-readiness-gate.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-real-web-readiness-gate.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.webRoute !== "/free-destiny-map") failures.push("Manifest web route mismatch.");
  if (manifest.apiEndpoint !== "/api/public/free-destiny-map/intake/local") failures.push("Manifest endpoint mismatch.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-real-web-readiness.ts", ["FREE_DESTINY_MAP_REAL_WEB_READINESS_WEB_ROUTE", "FreeDestinyMapRealWebReadinessReport", "canClaimProduction: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapRealWebReadinessGate.ps1", ["prove-free-destiny-map-real-web-readiness.mjs", "does not claim production"]],
  ["scripts/proof/prove-free-destiny-map-real-web-readiness.mjs", ["READY_FOR_CONTROLLED_LOCAL_BOOT", "BLOCKED_WITH_REPAIR_ACTIONS", "canAttemptLocalWebBoot", "dependency-install-evidence-present"]],
  ["reports/runtime/free-destiny-map-real-web-readiness-proof.json", ["schema", "module", "status", "canClaimProduction"]],
  ["apps/web/src/app/free-destiny-map/page.tsx", ["FreeDestinyMapApiForm"]],
  ["apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx", ['"use client"', "submitFreeDestinyMapClientPayload", "consentToBeContacted", "consentToProcessBasicInfo", "routeInterests"]],
  ["apps/web/src/lib/kingsmen/free-destiny-map-client.ts", ["buildFreeDestinyMapClientPayload", "FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT", "application/json"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-real-web-readiness-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-real-web-readiness-proof.json");
  if (proof.passed !== true) failures.push("Readiness proof report must set passed true after execution.");
  if (proof.productionReady !== false) failures.push("Readiness proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Readiness proof must keep canClaimProduction false.");
  if (!Array.isArray(proof.checks) || proof.checks.length < 10) failures.push("Readiness proof must include detailed checks.");
  if (!["READY_FOR_CONTROLLED_LOCAL_BOOT", "BLOCKED_WITH_REPAIR_ACTIONS"].includes(proof.status)) failures.push("Readiness proof status is invalid.");
  if (proof.status === "BLOCKED_WITH_REPAIR_ACTIONS" && (!Array.isArray(proof.blockers) || proof.blockers.length === 0)) {
    failures.push("Blocked readiness proof must list blockers.");
  }
}

const forbiddenRuntimePatterns = [
  [/\bidentityNumber\s*[:=]/i, "identity number field assignment"],
  [/\bidNumber\s*[:=]/i, "id number field assignment"],
  [/\bpassportNumber\s*[:=]/i, "passport number field assignment"],
  [/\bpassword\s*[:=]/i, "password field assignment"],
  [/\bcardNumber\s*[:=]/i, "card number field assignment"],
  [/\bcvv\s*[:=]/i, "cvv field assignment"],
  [/\bdocumentBase64\s*[:=]/i, "document payload assignment"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/emailSent:\s*true/i, "email sent true"],
  [/productionReady\s*[:=]\s*true/i, "productionReady true"]
];

const filesToScan = [...requiredFiles, ...upstreamFiles]
  .filter((item) => exists(item))
  .filter((item) => !item.includes("validate-free-destiny-map-real-web-readiness.mjs"))
  .filter((item) => !item.includes("prove-free-destiny-map-real-web-readiness.mjs"));

for (const file of filesToScan) {
  const content = read(file);
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden runtime pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 12 - Real Local Web Build / Dev-Server Readiness Gate",
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
  control_plane_impact: "Adds honest real web build/dev-server readiness gate for Free Destiny Map.",
  runtime_proof: "reports/runtime/free-destiny-map-real-web-readiness-proof.json",
  next_action: passed ? "Proceed based on readiness proof: repair blockers or run controlled local web boot proof." : "Repair readiness gate failures and rerun proof plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
