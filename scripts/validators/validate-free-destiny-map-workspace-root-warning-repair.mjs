#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "reports/validation/free-destiny-map-workspace-root-warning-repair-latest.json");

const requiredFiles = [
  "docs/runtime/free-destiny-map-workspace-root-warning-repair.md",
  "manifests/runtime/free-destiny-map-workspace-root-warning-repair.json",
  "apps/web/next.config.mjs",
  "packages/contracts/src/free-destiny-map-workspace-root-warning-repair.ts",
  "scripts/proof/prove-free-destiny-map-workspace-root-warning-repair.mjs",
  "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json",
  "scripts/validators/validate-free-destiny-map-workspace-root-warning-repair.mjs",
  "reports/validation/free-destiny-map-workspace-root-warning-repair-latest.json"
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

if (exists("manifests/runtime/free-destiny-map-workspace-root-warning-repair.json")) {
  const manifest = parseJson("manifests/runtime/free-destiny-map-workspace-root-warning-repair.json");
  if (manifest.productionReady !== false) failures.push("Manifest must keep productionReady false.");
  if (manifest.deletesExternalFiles !== false) failures.push("Manifest must declare deletesExternalFiles false.");
  if (manifest.storesProductionData !== false) failures.push("Manifest must declare storesProductionData false.");
  if (manifest.takesPayment !== false) failures.push("Manifest must declare takesPayment false.");
  if (manifest.sendsEmail !== false) failures.push("Manifest must declare sendsEmail false.");
  if (manifest.collectsDocuments !== false) failures.push("Manifest must declare collectsDocuments false.");
  if (manifest.submitsOfficialApplications !== false) failures.push("Manifest must declare submitsOfficialApplications false.");
  if (!String(manifest.oracleLiteImpact ?? "").includes("none_runtime_yet")) failures.push("Manifest must declare none_runtime_yet.");
}

const tokenChecks = [
  ["apps/web/next.config.mjs", ["outputFileTracingRoot", "kingsmenRepoRoot", "../..", "externalDir"]],
  ["packages/contracts/src/free-destiny-map-workspace-root-warning-repair.ts", ["WORKSPACE_ROOT_WARNING_REPAIR_APPLIED", "canClaimProduction: false"]],
  ["scripts/proof/prove-free-destiny-map-workspace-root-warning-repair.mjs", ["WORKSPACE_ROOT_WARNING_REPAIR_APPLIED", "outputFileTracingRoot", "no-external-delete-claim"]],
  ["reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json", ["schema", "module", "status"]]
];

for (const [file, tokens] of tokenChecks) {
  if (!exists(file)) continue;
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${file} missing token: ${token}`);
  }
}

if (exists("reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json")) {
  const proof = parseJson("reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json");
  if (proof.passed !== true) failures.push("Workspace root warning repair proof must pass.");
  if (proof.status !== "WORKSPACE_ROOT_WARNING_REPAIR_APPLIED") failures.push("Workspace root warning repair proof status must be WORKSPACE_ROOT_WARNING_REPAIR_APPLIED.");
  if (proof.productionReady !== false) failures.push("Workspace root warning repair proof must keep productionReady false.");
  if (proof.canClaimProduction !== false) failures.push("Workspace root warning repair proof must keep canClaimProduction false.");
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 15A - Workspace Root / Lockfile Warning Repair",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Repairs Next workspace-root ambiguity before controlled local API integration.",
  runtime_proof: "reports/runtime/free-destiny-map-workspace-root-warning-repair-proof.json",
  next_action: passed ? "Rerun BATCH 14 controlled Next boot proof, then proceed to BATCH 15B if still proven." : "Repair workspace-root warning repair failures."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
