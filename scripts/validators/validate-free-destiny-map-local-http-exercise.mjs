#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-local-http-exercise-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-local-http-exercise.md",
  "manifests/runtime/free-destiny-map-local-http-exercise.json",
  "packages/contracts/src/free-destiny-map-local-http-exercise.ts",
  "scripts/runtime/Invoke-FreeDestinyMapLocalHttpExercise.ps1",
  "scripts/proof/prove-free-destiny-map-local-http-exercise.mjs",
  "reports/runtime/free-destiny-map-local-http-exercise-proof.json",
  "scripts/validators/validate-free-destiny-map-local-http-exercise.mjs",
  "reports/validation/free-destiny-map-local-http-exercise-latest.json"
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

if (exists("manifests/runtime/free-destiny-map-local-http-exercise.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-local-http-exercise.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.usesDemoPayloadOnly !== true) failures.push("Manifest must declare usesDemoPayloadOnly true.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (manifest.apiEndpoint !== "/api/public/free-destiny-map/intake/local") failures.push("Manifest endpoint mismatch.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["packages/contracts/src/free-destiny-map-local-http-exercise.ts", ["FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_ENDPOINT", "FREE_DESTINY_MAP_LOCAL_HTTP_EXERCISE_WRITE_FLAG", "FreeDestinyMapLocalHttpExerciseResponse", "officialApplicationSubmitted: false"]],
  ["scripts/runtime/Invoke-FreeDestinyMapLocalHttpExercise.ps1", ["KINGSMEN_ENABLE_LOCAL_INTAKE_WRITE", "prove-free-destiny-map-local-http-exercise.mjs", "not production runtime"]],
  ["scripts/proof/prove-free-destiny-map-local-http-exercise.mjs", ["LOCAL_HTTP_ROUTE_EXERCISE_PROVEN", "local-http-server-started", "local-http-post-status-202", "local-http-response-production-false", "local-http-server-closed"]],
  ["reports/runtime/free-destiny-map-local-http-exercise-proof.json", ["schema", "module", "status"]],
  ["data/local/.gitignore", ["*", "!.gitignore"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-local-http-exercise-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-local-http-exercise-proof.json");
  if (proof.passed !== true) failures.push("Runtime proof report must pass.");
  if (proof.status !== "LOCAL_HTTP_ROUTE_EXERCISE_PROVEN") failures.push("Runtime proof status must be LOCAL_HTTP_ROUTE_EXERCISE_PROVEN.");
  if (proof.response_status !== 202) failures.push("Runtime proof must record HTTP 202 response.");
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
  .filter((item) => !item.includes("validate-free-destiny-map-local-http-exercise.mjs"))
  .filter((item) => !item.includes("prove-free-destiny-map-local-http-exercise.mjs"));

for (const file of filesToScan) {
  const content = read(file);
  for (const [pattern, label] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) failures.push(`${file} contains forbidden runtime pattern: ${label}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 09 - Local HTTP API Boot Shell / First End-to-End Local HTTP Route Exercise",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Adds local HTTP route exercise proof for Free Destiny Map intake path.",
  runtime_proof: "reports/runtime/free-destiny-map-local-http-exercise-proof.json",
  next_action: passed ? "Proceed to BATCH 10 - Local web-to-HTTP exercise or minimal app boot proof." : "Repair local HTTP route exercise failures and rerun proof plus validator."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
