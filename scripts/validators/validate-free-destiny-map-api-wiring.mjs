#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-api-wiring-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-public-api-wiring.md",
  "manifests/runtime/free-destiny-map-api-wiring-shell.json",
  "packages/contracts/src/free-destiny-map-api-wiring.ts",
  "apps/web/src/lib/kingsmen/free-destiny-map-client.ts",
  "apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx",
  "apps/web/src/app/free-destiny-map/page.tsx",
  "scripts/proof/prove-free-destiny-map-api-wiring.mjs",
  "reports/runtime/free-destiny-map-api-wiring-proof.json",
  "scripts/validators/validate-free-destiny-map-api-wiring.mjs",
  "reports/validation/free-destiny-map-api-wiring-latest.json"
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

if (exists("manifests/runtime/free-destiny-map-api-wiring-shell.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-api-wiring-shell.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.apiEndpoint !== "/api/public/free-destiny-map/intake/local") failures.push("Manifest endpoint mismatch.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-api-wiring.ts", ["FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT", "FREE_DESTINY_MAP_API_WIRING_NOTICE", "FreeDestinyMapClientSubmission", "FreeDestinyMapClientResponse"]],
  ["apps/web/src/lib/kingsmen/free-destiny-map-client.ts", ["buildFreeDestinyMapClientPayload", "submitFreeDestinyMapClientPayload", "FREE_DESTINY_MAP_LOCAL_INTAKE_ENDPOINT", "application/json"]],
  ["apps/web/src/components/kingsmen/FreeDestinyMapApiForm.tsx", ['"use client"', "submitFreeDestinyMapClientPayload", "consentToBeContacted", "consentToProcessBasicInfo", "Production storage"]],
  ["apps/web/src/app/free-destiny-map/page.tsx", ["FreeDestinyMapApiForm"]],
  ["scripts/proof/prove-free-destiny-map-api-wiring.mjs", ["RUNTIME_SHELL_PROVEN", "client-posts-local-endpoint", "route-local-endpoint-exists"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-api-wiring-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-api-wiring-proof.json");
  if (proof.passed !== true) failures.push("Runtime proof report must pass.");
  if (proof.status !== "RUNTIME_SHELL_PROVEN") failures.push("Runtime proof status must be RUNTIME_SHELL_PROVEN.");
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

const filesToScan = requiredFiles
  .filter((item) => exists(item))
  .filter((item) => !item.includes("validate-free-destiny-map-api-wiring.mjs"))
  .filter((item) => !item.includes("prove-free-destiny-map-api-wiring.mjs"));

for (const file of filesToScan) {
  const content = read(file);
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden runtime pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 07 - Public Form to Intake API Wiring / Local API Boot Proof",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds public form wiring to local Free Destiny Map intake API shell.",
  runtime_proof: "reports/runtime/free-destiny-map-api-wiring-proof.json",
  next_action: passed ? "Proceed to BATCH 08 - Local API boot command/proof or first end-to-end local route exercise." : "Repair public form API wiring failures and rerun proof plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
