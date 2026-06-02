#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-persistence-latest.json");

const requiredFiles = [
  "docs/intake/free-destiny-map-local-runtime-shell.md",
  "manifests/intake/free-destiny-map-persistence-shell.json",
  "packages/contracts/src/free-destiny-map-persistence.ts",
  "apps/api/src/repositories/free-destiny-map-local.repository.ts",
  "apps/api/src/services/free-destiny-map-persistence.service.ts",
  "apps/api/src/routes/free-destiny-map-persistence.routes.ts",
  "data/local/.gitignore",
  "scripts/validators/validate-free-destiny-map-persistence.mjs",
  "reports/validation/free-destiny-map-persistence-latest.json"
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

if (exists("manifests/intake/free-destiny-map-persistence-shell.json")) {
  const manifest = parseJson("manifests/intake/free-destiny-map-persistence-shell.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.storesLocalShellData !== true) failures.push("Manifest must declare storesLocalShellData true.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.endpoint !== "/api/public/free-destiny-map/intake/local") failures.push("Manifest endpoint mismatch.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-persistence.ts", ["StoredFreeDestinyMapIntakeSummary", "FreeDestinyMapPersistenceResult", "FREE_DESTINY_MAP_LOCAL_PERSISTENCE_NOTICE", "storesProductionData: false"]],
  ["apps/api/src/repositories/free-destiny-map-local.repository.ts", ["FreeDestinyMapLocalRepository", "appendIntake", "intakes.jsonl", "fs.appendFile"]],
  ["apps/api/src/services/free-destiny-map-persistence.service.ts", ["persistFreeDestinyMapIntakeShell", "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE", "localPersistenceEnabled", "storesProductionData: false"]],
  ["apps/api/src/routes/free-destiny-map-persistence.routes.ts", ["/api/public/free-destiny-map/intake/local", "KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE", "officialApplicationSubmitted: false", "paymentInstructionSent: false", "documentUploadAccepted: false", "emailSent: false", "productionReady: false"]],
  ["data/local/.gitignore", ["*", "!.gitignore"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
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

const filesToScan = requiredFiles
  .filter((item) => exists(item))
  .filter((item) => !item.includes("validate-free-destiny-map-persistence.mjs"));

for (const file of filesToScan) {
  const content = read(file);
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden runtime pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 06 - Intake Persistence / Local Runtime Shell",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds local Free Destiny Map intake persistence boundary for runtime proof.",
  next_action: passed ? "Proceed to BATCH 07 - Public form to intake API wiring or local API boot proof." : "Repair Free Destiny Map persistence failures and rerun validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
