#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/runtime/batch25-approved-oracle-remote-dry-run-gate.md",
  "manifests/runtime/batch25-approved-oracle-remote-dry-run-gate.json",
  "scripts/runtime/Invoke-Batch25ApprovedOracleRemoteDryRunGate.ps1",
  "scripts/validators/validate-batch25-approved-oracle-remote-dry-run-gate.mjs",
  "reports/runtime/batch25-approved-oracle-remote-dry-run-gate-latest.json",
  "reports/runtime/batch24-oracle-remote-dry-run-readiness-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
let batch24 = null;

try { manifest = readJson("manifests/runtime/batch25-approved-oracle-remote-dry-run-gate.json"); } catch { failures.push("BATCH 25 manifest cannot be parsed."); }
try { batch24 = readJson("reports/runtime/batch24-oracle-remote-dry-run-readiness-latest.json"); } catch { failures.push("BATCH 24 report cannot be parsed."); }

if (batch24 && batch24.passed !== true) failures.push("BATCH 24 must be validated before BATCH 25.");

if (manifest) {
  if (manifest.module !== "BATCH 25 - Approved Oracle Remote Dry-Run Execution Gate") failures.push("Wrong BATCH 25 module name.");
  if (manifest.productionReady !== false) failures.push("BATCH 25 must keep productionReady false.");
  if (manifest.canClaimProduction !== false) failures.push("BATCH 25 must keep canClaimProduction false.");
  if (manifest.deployedToOracle !== false) failures.push("BATCH 25 must keep deployedToOracle false.");
  if (manifest.requiresApprovedDryRunFlag !== true) failures.push("BATCH 25 must require ApprovedDryRun flag.");
  if (manifest.runsOracleCommands !== false) failures.push("BATCH 25 must not run Oracle commands.");
  if (manifest.runsRemoteCommandsByDefault !== false) failures.push("BATCH 25 must not run remote commands by default.");
  if (manifest.copiesFilesToOracle !== false) failures.push("BATCH 25 must not copy files to Oracle.");
  if (manifest.requiresPaidOracle !== false) failures.push("BATCH 25 must not require paid Oracle.");
  if (manifest.usesSecrets !== false) failures.push("BATCH 25 must not use secrets.");

  const env = manifest.required_environment_names || [];
  for (const name of ["ORACLE_VM_HOST","ORACLE_VM_USER","ORACLE_SSH_KEY_PATH","KINGSMEN_REMOTE_PATH"]) {
    if (!env.includes(name)) failures.push(`Missing required env name: ${name}`);
  }

  const blocked = manifest.blocked_actions || [];
  for (const action of ["oci_compute_instance_launch","paid_oracle_resource_creation","production_deployment","secret_commit"]) {
    if (!blocked.includes(action)) failures.push(`Missing blocked action: ${action}`);
  }
}

const scanFiles = [
  "docs/runtime/batch25-approved-oracle-remote-dry-run-gate.md",
  "manifests/runtime/batch25-approved-oracle-remote-dry-run-gate.json",
  "scripts/runtime/Invoke-Batch25ApprovedOracleRemoteDryRunGate.ps1"
];

for (const file of scanFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");

  if (/productionReady\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set productionReady true.`);
  if (/deployedToOracle\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set deployedToOracle true.`);
  if (/oci\s+compute\s+instance\s+launch/i.test(text) && !/blocked_actions|no OCI compute launch|No `?oci compute instance launch`?/i.test(text)) failures.push(`${file} must not launch Oracle compute.`);
  if (/(^|\s)&\s*ssh\b/i.test(text)) failures.push(`${file} must not execute ssh.`);
  if (/Start-Process\s+ssh/i.test(text)) failures.push(`${file} must not start ssh.`);
  if (/(^|\s)&\s*scp\b/i.test(text)) failures.push(`${file} must not execute scp.`);
  if (/Start-Process\s+scp/i.test(text)) failures.push(`${file} must not start scp.`);
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 25 - Approved Oracle Remote Dry-Run Execution Gate",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "approved_remote_dry_run_gate_only",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runsRemoteCommands: false,
  next_action: passed ? "Proceed to BATCH 26 approved remote read-only checks when explicitly approved." : "Repair BATCH 25."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/runtime/batch25-approved-oracle-remote-dry-run-gate-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/runtime/batch25-approved-oracle-remote-dry-run-gate-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
