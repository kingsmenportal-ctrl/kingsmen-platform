#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/runtime/batch26-approved-oracle-remote-read-only-checks.md",
  "manifests/runtime/batch26-approved-oracle-remote-read-only-checks.json",
  "scripts/runtime/Invoke-Batch26ApprovedOracleRemoteReadOnlyChecks.ps1",
  "scripts/validators/validate-batch26-approved-oracle-remote-read-only-checks.mjs",
  "reports/runtime/batch26-approved-oracle-remote-read-only-checks-latest.json",
  "reports/runtime/batch25-approved-oracle-remote-dry-run-gate-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
let batch25 = null;

try { manifest = readJson("manifests/runtime/batch26-approved-oracle-remote-read-only-checks.json"); } catch { failures.push("BATCH 26 manifest cannot be parsed."); }
try { batch25 = readJson("reports/runtime/batch25-approved-oracle-remote-dry-run-gate-latest.json"); } catch { failures.push("BATCH 25 report cannot be parsed."); }

if (batch25 && batch25.passed !== true) failures.push("BATCH 25 must be validated before BATCH 26.");

if (manifest) {
  if (manifest.module !== "BATCH 26 - Approved Oracle Remote Read-Only Checks") failures.push("Wrong BATCH 26 module name.");
  if (manifest.productionReady !== false) failures.push("BATCH 26 must keep productionReady false.");
  if (manifest.canClaimProduction !== false) failures.push("BATCH 26 must keep canClaimProduction false.");
  if (manifest.deployedToOracle !== false) failures.push("BATCH 26 must keep deployedToOracle false.");
  if (manifest.requiresApprovedReadOnlyFlag !== true) failures.push("BATCH 26 must require ApprovedReadOnly flag.");
  if (manifest.mayRunRemoteReadOnlyCommandsWhenApproved !== true) failures.push("BATCH 26 must explicitly allow only approved read-only commands.");
  if (manifest.runsRemoteCommandsByDefault !== false) failures.push("BATCH 26 must not run remote commands by default.");
  if (manifest.copiesFilesToOracle !== false) failures.push("BATCH 26 must not copy files to Oracle.");
  if (manifest.startsContainers !== false) failures.push("BATCH 26 must not start containers.");
  if (manifest.runsDockerComposeUp !== false) failures.push("BATCH 26 must not run Docker Compose up.");
  if (manifest.runsOracleCommands !== false) failures.push("BATCH 26 must not run Oracle commands.");
  if (manifest.requiresPaidOracle !== false) failures.push("BATCH 26 must not require paid Oracle.");
  if (manifest.usesSecrets !== false) failures.push("BATCH 26 must not use secrets.");

  const blocked = manifest.blocked_actions || [];
  for (const action of ["scp_execution","file_copy_to_oracle","docker_compose_up","production_deployment","oci_compute_instance_launch","secret_commit"]) {
    if (!blocked.includes(action)) failures.push(`Missing blocked action: ${action}`);
  }

  const allowed = manifest.allowed_remote_commands || [];
  for (const command of ["hostname","docker --version","docker compose version","git --version","df -h","free -m"]) {
    if (!allowed.includes(command)) failures.push(`Missing allowed read-only command: ${command}`);
  }
}

const scanFiles = [
  "docs/runtime/batch26-approved-oracle-remote-read-only-checks.md",
  "manifests/runtime/batch26-approved-oracle-remote-read-only-checks.json",
  "scripts/runtime/Invoke-Batch26ApprovedOracleRemoteReadOnlyChecks.ps1"
];

for (const file of scanFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");

  if (/productionReady\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set productionReady true.`);
  if (/deployedToOracle\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set deployedToOracle true.`);
  if (/scp\s+/i.test(text) || /Start-Process\s+scp/i.test(text)) failures.push(`${file} must not execute SCP.`);
  const documentedDockerComposeBlock = /no\s+Docker\s+Compose\s+up\/down/i.test(text) || /blocked_actions/i.test(text);
  if (/docker\s+compose\s+up/i.test(text) && !documentedDockerComposeBlock) failures.push(`${file} must not run docker compose up.`);
  if (/docker\s+compose\s+down/i.test(text) && !documentedDockerComposeBlock) failures.push(`${file} must not run docker compose down.`);
  if (/docker\s+start|docker\s+run/i.test(text)) failures.push(`${file} must not start Docker containers.`);
  if (/oci\s+compute\s+instance\s+launch/i.test(text) && !/blocked_actions|no OCI compute launch|No `?oci compute instance launch`?/i.test(text)) failures.push(`${file} must not launch Oracle compute.`);
  if (/public\s+production\s+URL/i.test(text) && !/no public production URL/i.test(text)) failures.push(`${file} must not claim public production URL.`);
}

const runnerPath = path.join(root, "scripts/runtime/Invoke-Batch26ApprovedOracleRemoteReadOnlyChecks.ps1");
if (fs.existsSync(runnerPath)) {
  const runner = fs.readFileSync(runnerPath, "utf8");
  if (!runner.includes("ApprovedReadOnly")) failures.push("Runner must require ApprovedReadOnly flag.");
  if (!runner.includes("no_write_or_deploy_commands_executed")) failures.push("Runner must record no write/deploy commands.");
  if (!runner.includes("hostname")) failures.push("Runner must include hostname read-only check.");
  if (!runner.includes("docker --version")) failures.push("Runner must include docker version read-only check.");
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 26 - Approved Oracle Remote Read-Only Checks",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "approved_remote_read_only_checks_only",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  next_action: passed ? "Run approved BATCH 26 read-only check only after setting Oracle VM env values." : "Repair BATCH 26."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/runtime/batch26-approved-oracle-remote-read-only-checks-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/runtime/batch26-approved-oracle-remote-read-only-checks-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
