#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/tools/TOOLS_01_CONNECTED_TOOL_ACTIVATION_GATES.md",
  "manifests/tools/connected-tool-activation-gates.json",
  "scripts/validators/validate-connected-tool-activation-gates.mjs",
  "reports/tools/connected-tool-activation-gates-latest.json",
  "manifests/providers/connected-apps-provider-map.json",
  "reports/providers/connected-apps-provider-map-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let providerMap = null;
let providerReport = null;
let gates = null;

try { providerMap = readJson("manifests/providers/connected-apps-provider-map.json"); } catch { failures.push("Provider map cannot be parsed."); }
try { providerReport = readJson("reports/providers/connected-apps-provider-map-latest.json"); } catch { failures.push("Provider report cannot be parsed."); }
try { gates = readJson("manifests/tools/connected-tool-activation-gates.json"); } catch { failures.push("Tool gates manifest cannot be parsed."); }

if (providerReport && providerReport.passed !== true) failures.push("N_PROVIDER.5 must be validated before TOOLS-01.");

if (providerMap && gates) {
  const providers = providerMap.providers || [];
  const toolGates = gates.gates || [];
  const providerNames = providers.map((p) => p.name).sort();
  const gateNames = toolGates.map((g) => g.tool_name).sort();

  if (providerMap.provider_count !== 25) failures.push("Provider map provider_count must be 25.");
  if (providers.length !== 25) failures.push(`Provider map must contain 25 providers, found ${providers.length}.`);
  if (gates.tool_gate_count !== 25) failures.push("Tool gate count must be 25.");
  if (toolGates.length !== 25) failures.push(`Expected 25 tool gates, found ${toolGates.length}.`);
  if (JSON.stringify(providerNames) !== JSON.stringify(gateNames)) failures.push("Tool gates must exactly match provider names.");

  if (gates.production_enabled !== false) failures.push("TOOLS-01 must not enable production.");
  if (gates.runtime_use_enabled !== false) failures.push("TOOLS-01 must not enable runtime use.");

  const allowedStatuses = new Set([
    "CALLABLE_NOW_PRODUCTION_GATED",
    "VISIBLE_UNTESTED",
    "OFF_UNTIL_GATED"
  ]);

  for (const gate of toolGates) {
    if (!allowedStatuses.has(gate.activation_status)) failures.push(`${gate.tool_name} has invalid activation_status.`);
    if (gate.production_enabled !== false) failures.push(`${gate.tool_name} must keep production_enabled false.`);
    if (gate.runtime_use_enabled !== false) failures.push(`${gate.tool_name} must keep runtime_use_enabled false.`);
    if (gate.secrets_boundary_required !== true) failures.push(`${gate.tool_name} must require secrets boundary.`);
    if (gate.candidate_data_boundary_required !== true) failures.push(`${gate.tool_name} must require candidate-data boundary.`);
    if (gate.validator_required !== true) failures.push(`${gate.tool_name} must require validator.`);
    if (gate.proof_report_required !== true) failures.push(`${gate.tool_name} must require proof report.`);
    if (gate.high_risk === true && gate.founder_approval_required !== true) failures.push(`${gate.tool_name} high-risk gate must require founder approval.`);
    if (!Array.isArray(gate.blocked_until_gated) || !gate.blocked_until_gated.includes("production_use")) failures.push(`${gate.tool_name} must block production_use.`);
  }
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "TOOLS-01 - Connected Tool Activation Gates",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  provider_count: providerMap?.providers?.length ?? 0,
  tool_gate_count: gates?.gates?.length ?? 0,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "none_tool_gate_map_only",
  control_plane_impact: "Creates activation gates for connected tools before production use.",
  next_action: passed ? "Proceed to AGENTS-01 - Kingsmen Agent System." : "Repair TOOLS-01 gates."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/tools/connected-tool-activation-gates-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/tools/connected-tool-activation-gates-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
