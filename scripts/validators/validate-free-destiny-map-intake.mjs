#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-intake-latest.json");

const requiredFiles = [
  "docs/intake/free-destiny-map-intake-backend-shell.md",
  "manifests/intake/free-destiny-map-intake-shell.json",
  "packages/contracts/src/free-destiny-map-intake.ts",
  "apps/api/src/services/free-destiny-map-intake.service.ts",
  "apps/api/src/routes/free-destiny-map-intake.routes.ts",
  "scripts/validators/validate-free-destiny-map-intake.mjs",
  "reports/validation/free-destiny-map-intake-latest.json"
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

if (exists("manifests/intake/free-destiny-map-intake-shell.json")) {
  const manifest = parseJson("manifests/intake/free-destiny-map-intake-shell.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesData !== false) failures.push("Manifest must declare storesData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
  if (manifest.endpoint !== "/api/public/free-destiny-map/intake") failures.push("Manifest endpoint mismatch.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-intake.ts", ["FreeDestinyMapIntakePayload", "FreeDestinyMapIntakeResult", "FREE_DESTINY_MAP_SAFE_NOTICE", "accommodation", "cv_revamp", "source_check"]],
  ["apps/api/src/services/free-destiny-map-intake.service.ts", ["normalizeFreeDestinyMapIntakePayload", "validateFreeDestinyMapIntakePayload", "processFreeDestinyMapIntakeShell", "CONSENT_REQUIRED", "INTENT_REQUIRED"]],
  ["apps/api/src/routes/free-destiny-map-intake.routes.ts", ["/api/public/free-destiny-map/intake", "officialApplicationSubmitted: false", "paymentInstructionSent: false", "documentUploadAccepted: false", "productionReady: false"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

const forbiddenPatterns = [
  [/\bpassword\s*[:=]/i, "password field assignment"],
  [/\bpassword\s*\?/i, "password optional field"],
  [/\bcardNumber\s*[:=]/i, "card number field assignment"],
  [/\bcardNumber\s*\?/i, "card number optional field"],
  [/\bcvv\s*[:=]/i, "cvv field assignment"],
  [/\bcvv\s*\?/i, "cvv optional field"],
  [/\bdocumentBase64\s*[:=]/i, "document upload payload"],
  [/\bdocumentBase64\s*\?/i, "document upload optional field"],
  [/officialApplicationSubmitted:\s*true/i, "official application submitted true"],
  [/paymentInstructionSent:\s*true/i, "payment instruction sent true"],
  [/productionReady\s*[:=]\s*true/i, "productionReady true"]
];

const filesToScanForForbiddenRuntimeFields = requiredFiles
  .filter((item) => exists(item))
  .filter((item) => !item.includes("validate-free-destiny-map-intake.mjs"));

for (const file of filesToScanForForbiddenRuntimeFields) {
  const content = read(file);
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 05 - Free Destiny Map Intake Contract / Backend Shell",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds backend-ready Free Destiny Map intake boundary.",
  next_action: passed ? "Proceed to BATCH 06 - Intake persistence/local runtime shell or next approved batch." : "Repair Free Destiny Map intake failures and rerun validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
