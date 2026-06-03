#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/runtime/batch23-oracle-vm-environment-checklist.md",
  "manifests/runtime/batch23-oracle-vm-handoff-runner.json",
  "scripts/runtime/Invoke-Batch23OracleVmReadiness.ps1",
  "scripts/validators/validate-batch23-oracle-vm-handoff-runner.mjs",
  "reports/runtime/batch23-oracle-vm-handoff-runner-latest.json",
  "reports/runtime/batch22-oracle-lite-handoff-prep-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
let batch22 = null;

try { manifest = readJson("manifests/runtime/batch23-oracle-vm-handoff-runner.json"); } catch { failures.push("BATCH 23 manifest cannot be parsed."); }
try { batch22 = readJson("reports/runtime/batch22-oracle-lite-handoff-prep-latest.json"); } catch { failures.push("BATCH 22 report cannot be parsed."); }

if (batch22 && batch22.passed !== true) failures.push("BATCH 22 must be validated before BATCH 23.");

if (manifest) {
  if (manifest.module !== "BATCH 23 - Oracle VM Environment Checklist / Remote Handoff Runner") failures.push("Wrong BATCH 23 module name.");
  if (manifest.productionReady !== false) failures.push("BATCH 23 must keep productionReady false.");
  if (manifest.canClaimProduction !== false) failures.push("BATCH 23 must keep canClaimProduction false.");
  if (manifest.deployedToOracle !== false) failures.push("BATCH 23 must keep deployedToOracle false.");
  if (manifest.runsOracleCommands !== false) failures.push("BATCH 23 must not run Oracle commands.");
  if (manifest.runsRemoteCommands !== false) failures.push("BATCH 23 must not run remote commands.");
  if (manifest.requiresPaidOracle !== false) failures.push("BATCH 23 must not require paid Oracle.");
  if (manifest.usesSecrets !== false) failures.push("BATCH 23 must not use secrets.");

  const env = manifest.required_environment_names || [];
  for (const name of ["ORACLE_VM_HOST","ORACLE_VM_USER","ORACLE_SSH_KEY_PATH","KINGSMEN_REMOTE_PATH"]) {
    if (!env.includes(name)) failures.push(`Missing required env name: ${name}`);
  }
}

const scanFiles = [
  "docs/runtime/batch23-oracle-vm-environment-checklist.md",
  "manifests/runtime/batch23-oracle-vm-handoff-runner.json",
  "scripts/runtime/Invoke-Batch23OracleVmReadiness.ps1"
];

for (const file of scanFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  if (/productionReady\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set productionReady true.`);
  if (/deployedToOracle\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set deployedToOracle true.`);
  if (/oci\s+compute\s+instance\s+launch/i.test(text)) failures.push(`${file} must not launch Oracle compute.`);
  if (/ssh\s+.*@/i.test(text)) failures.push(`${file} must not execute SSH remote commands in BATCH 23.`);
  if (/scp\s+/i.test(text)) failures.push(`${file} must not execute SCP in BATCH 23.`);
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 23 - Oracle VM Environment Checklist / Remote Handoff Runner",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "environment_checklist_and_handoff_runner_only",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  next_action: passed ? "Proceed to BATCH 24 - Oracle Remote Dry-Run Readiness when approved." : "Repair BATCH 23."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/runtime/batch23-oracle-vm-handoff-runner-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/runtime/batch23-oracle-vm-handoff-runner-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
