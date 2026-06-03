#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/runtime/batch22-oracle-lite-handoff-prep.md",
  "manifests/runtime/batch22-oracle-lite-handoff-prep.json",
  "scripts/validators/validate-batch22-oracle-lite-handoff-prep.mjs",
  "reports/runtime/batch22-oracle-lite-handoff-prep-latest.json",
  "reports/github-actions/batch21c/runtime/batch21c-docker-runtime-proof.json",
  "reports/github-actions/batch21c/validation/batch21c-docker-runtime-proof-latest.json",
  "reports/agents/kingsmen-agent-system-latest.json",
  "reports/tools/connected-tool-activation-gates-latest.json",
  "reports/providers/connected-apps-provider-map-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
let batch21cProof = null;
let batch21cValidation = null;
let agentsReport = null;
let toolsReport = null;
let providerReport = null;

try { manifest = readJson("manifests/runtime/batch22-oracle-lite-handoff-prep.json"); } catch { failures.push("BATCH 22 manifest cannot be parsed."); }
try { batch21cProof = readJson("reports/github-actions/batch21c/runtime/batch21c-docker-runtime-proof.json"); } catch { failures.push("BATCH 21C runtime proof cannot be parsed."); }
try { batch21cValidation = readJson("reports/github-actions/batch21c/validation/batch21c-docker-runtime-proof-latest.json"); } catch { failures.push("BATCH 21C validation proof cannot be parsed."); }
try { agentsReport = readJson("reports/agents/kingsmen-agent-system-latest.json"); } catch { failures.push("AGENTS-01 report cannot be parsed."); }
try { toolsReport = readJson("reports/tools/connected-tool-activation-gates-latest.json"); } catch { failures.push("TOOLS-01 report cannot be parsed."); }
try { providerReport = readJson("reports/providers/connected-apps-provider-map-latest.json"); } catch { failures.push("N_PROVIDER.5 report cannot be parsed."); }

if (batch21cProof) {
  if (batch21cProof.status !== "GITHUB_ACTIONS_DOCKER_RUNTIME_PROVEN") failures.push("BATCH 21C must be runtime proven.");
  if (batch21cProof.passed !== true) failures.push("BATCH 21C runtime proof must pass.");
  if (batch21cProof.apiHealthStatus !== 200) failures.push("BATCH 21C API health must be 200.");
  if (batch21cProof.webStatus !== 200) failures.push("BATCH 21C web status must be 200.");
  if (batch21cProof.bridgeApiStatus !== 202) failures.push("BATCH 21C bridge status must be 202.");
  if (batch21cProof.backend_bridge_succeeded !== true) failures.push("BATCH 21C backend bridge must succeed.");
  if (batch21cProof.backend_boundary_reached !== true) failures.push("BATCH 21C backend boundary must be reached.");
  if (batch21cProof.backend_local_write_succeeded !== true) failures.push("BATCH 21C backend local write must succeed.");
  if (batch21cProof.productionReady !== false || batch21cProof.canClaimProduction !== false || batch21cProof.deployedToOracle !== false) failures.push("BATCH 21C must not claim production or Oracle deployment.");
}

if (batch21cValidation && batch21cValidation.passed !== true) failures.push("BATCH 21C validation must pass.");
if (agentsReport && agentsReport.passed !== true) failures.push("AGENTS-01 must pass.");
if (toolsReport && toolsReport.passed !== true) failures.push("TOOLS-01 must pass.");
if (providerReport && providerReport.passed !== true) failures.push("N_PROVIDER.5 must pass.");

if (manifest) {
  if (manifest.module !== "BATCH 22 - Docker Runtime Health Hardening / Oracle Lite VM Handoff Preparation") failures.push("Wrong BATCH 22 module name.");
  if (manifest.productionReady !== false) failures.push("BATCH 22 must keep productionReady false.");
  if (manifest.canClaimProduction !== false) failures.push("BATCH 22 must keep canClaimProduction false.");
  if (manifest.deployedToOracle !== false) failures.push("BATCH 22 must keep deployedToOracle false.");
  if (manifest.runsOracleCommands !== false) failures.push("BATCH 22 must not run Oracle commands.");
  if (manifest.requiresPaidOracle !== false) failures.push("BATCH 22 must not require paid Oracle.");
  if (manifest.usesSecrets !== false) failures.push("BATCH 22 must not use secrets.");
  if (manifest.health_expectations?.api_health_status !== 200) failures.push("BATCH 22 must expect API health 200.");
  if (manifest.health_expectations?.web_status !== 200) failures.push("BATCH 22 must expect web 200.");
  if (manifest.health_expectations?.bridge_api_status !== 202) failures.push("BATCH 22 must expect bridge 202.");
}

const forbiddenFiles = [
  "docs/runtime/batch22-oracle-lite-handoff-prep.md",
  "manifests/runtime/batch22-oracle-lite-handoff-prep.json"
];

for (const file of forbiddenFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  if (/productionReady\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set productionReady true.`);
  if (/deployedToOracle\s*[:=]\s*true/i.test(text)) failures.push(`${file} must not set deployedToOracle true.`);
  if (/oci\s+compute\s+instance\s+launch/i.test(text)) failures.push(`${file} must not launch Oracle instance.`);
  if (/oracle\s+paid|paid\s+resource/i.test(text) && !/without founder approval/i.test(text)) failures.push(`${file} paid Oracle language must require founder approval.`);
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 22 - Docker Runtime Health Hardening / Oracle Lite VM Handoff Preparation",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "handoff_preparation_only",
  control_plane_impact: "Prepares Docker runtime health expectations for Oracle Lite VM handoff.",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  next_action: passed ? "Proceed to BATCH 23 - Oracle VM Environment Checklist / Remote Handoff Runner." : "Repair BATCH 22 handoff prep."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/runtime/batch22-oracle-lite-handoff-prep-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/runtime/batch22-oracle-lite-handoff-prep-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
