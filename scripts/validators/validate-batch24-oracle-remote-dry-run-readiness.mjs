#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/runtime/batch24-oracle-remote-dry-run-readiness.md",
  "manifests/runtime/batch24-oracle-remote-dry-run-readiness.json",
  "scripts/runtime/Invoke-Batch24OracleRemoteDryRunReadiness.ps1",
  "scripts/validators/validate-batch24-oracle-remote-dry-run-readiness.mjs",
  "reports/runtime/batch24-oracle-remote-dry-run-readiness-latest.json",
  "reports/runtime/batch23-oracle-vm-handoff-runner-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
let batch23 = null;

try { manifest = readJson("manifests/runtime/batch24-oracle-remote-dry-run-readiness.json"); } catch { failures.push("BATCH 24 manifest cannot be parsed."); }
try { batch23 = readJson("reports/runtime/batch23-oracle-vm-handoff-runner-latest.json"); } catch { failures.push("BATCH 23 report cannot be parsed."); }

if (batch23 && batch23.passed !== true) failures.push("BATCH 23 must be validated before BATCH 24.");

if (manifest) {
  if (manifest.module !== "BATCH 24 - Oracle Remote Dry-Run Readiness") failures.push("Wrong BATCH 24 module name.");
  if (manifest.productionReady !== false) failures.push("BATCH 24 must keep productionReady false.");
  if (manifest.canClaimProduction !== false) failures.push("BATCH 24 must keep canClaimProduction false.");
  if (manifest.deployedToOracle !== false) failures.push("BATCH 24 must keep deployedToOracle false.");
  if (manifest.runsOracleCommands !== false) failures.push("BATCH 24 must not run Oracle commands.");
  if (manifest.runsRemoteCommands !== false) failures.push("BATCH 24 must not run remote commands.");
  if (manifest.copiesFilesToOracle !== false) failures.push("BATCH 24 must not copy files to Oracle.");
  if (manifest.requiresPaidOracle !== false) failures.push("BATCH 24 must not require paid Oracle.");
  if (manifest.usesSecrets !== false) failures.push("BATCH 24 must not use secrets.");

  const env = manifest.required_environment_names || [];
  for (const name of ["ORACLE_VM_HOST","ORACLE_VM_USER","ORACLE_SSH_KEY_PATH","KINGSMEN_REMOTE_PATH"]) {
    if (!env.includes(name)) failures.push(`Missing required env name: ${name}`);
  }

  const blocked = manifest.blocked_actions || [];
  for (const action of ["ssh_execution","scp_execution","oci_compute_instance_launch","production_claim","secret_commit"]) {
    if (!blocked.includes(action)) failures.push(`Missing blocked action: ${action}`);
  }
}

const scanFiles = [
  "docs/runtime/batch24-oracle-remote-dry-run-readiness.md",
  "manifests/runtime/batch24-oracle-remote-dry-run-readiness.json",
  "scripts/runtime/Invoke-Batch24OracleRemoteDryRunReadiness.ps1"
];

for (const file of scanFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");

  if (/productionReady\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set productionReady true.`);
  if (/deployedToOracle\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set deployedToOracle true.`);
  if (/oci\s+compute\s+instance\s+launch/i.test(text) && !/blocked_actions|no `?oci compute instance launch`?/i.test(text)) failures.push(`${file} must not launch Oracle compute.`);
  if (/(^|\s)&\s*ssh\b/i.test(text)) failures.push(`${file} must not execute ssh.`);
  if (/Start-Process\s+ssh/i.test(text)) failures.push(`${file} must not start ssh.`);
  if (/(^|\s)&\s*scp\b/i.test(text)) failures.push(`${file} must not execute scp.`);
  if (/Start-Process\s+scp/i.test(text)) failures.push(`${file} must not start scp.`);
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 24 - Oracle Remote Dry-Run Readiness",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "remote_dry_run_readiness_only",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  runsRemoteCommands: false,
  next_action: passed ? "Proceed to BATCH 25 only when remote dry-run execution is approved." : "Repair BATCH 24."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/runtime/batch24-oracle-remote-dry-run-readiness-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/runtime/batch24-oracle-remote-dry-run-readiness-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
