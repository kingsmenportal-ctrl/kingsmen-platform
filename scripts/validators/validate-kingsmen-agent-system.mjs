#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
}

const failures = [];
const requiredFiles = [
  "docs/agents/KINGSMEN_AGENT_SYSTEM.md",
  "docs/agents/AGENT_AUTHORITY_BOUNDARY.md",
  "docs/agents/AGENT_HANDOFF_RULES.md",
  "docs/agents/AGENT_RISK_REGISTER.md",
  "manifests/agents/kingsmen-agent-system.json",
  "scripts/validators/validate-kingsmen-agent-system.mjs",
  "reports/agents/kingsmen-agent-system-latest.json",
  "reports/tools/connected-tool-activation-gates-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let toolsReport = null;
let manifest = null;

try { toolsReport = readJson("reports/tools/connected-tool-activation-gates-latest.json"); } catch { failures.push("TOOLS-01 report cannot be parsed."); }
try { manifest = readJson("manifests/agents/kingsmen-agent-system.json"); } catch { failures.push("Agent manifest cannot be parsed."); }

if (toolsReport && toolsReport.passed !== true) failures.push("TOOLS-01 must be validated before AGENTS-01.");

if (manifest) {
  const agents = Array.isArray(manifest.agents) ? manifest.agents : [];
  const allowed = new Set([
    "AI_REASONING_AGENT",
    "RULE_VALIDATOR_AGENT",
    "BACKEND_AUTHORITY_AGENT",
    "POWERSHELL_BUILD_AGENT"
  ]);

  if (manifest.module !== "AGENTS-01 - Kingsmen Agent System") failures.push("Wrong module name.");
  if (manifest.production_enabled !== false) failures.push("AGENTS-01 must not enable production.");
  if (manifest.runtime_autonomy_enabled !== false) failures.push("AGENTS-01 must not enable runtime autonomy.");
  if (manifest.agent_count !== agents.length) failures.push("agent_count must match agents length.");
  if (agents.length < 25) failures.push(`Expected at least 25 agents, found ${agents.length}.`);

  const classes = new Set(agents.map((a) => a.class));
  for (const cls of allowed) {
    if (!classes.has(cls)) failures.push(`Missing agent class: ${cls}`);
  }

  const names = agents.map((a) => a.name);
  if (new Set(names).size !== names.length) failures.push("Agent names must be unique.");

  for (const agent of agents) {
    if (!allowed.has(agent.class)) failures.push(`${agent.name} has invalid class.`);
    if (agent.production_enabled !== false) failures.push(`${agent.name} must keep production_enabled false.`);
    if (agent.proof_required !== true) failures.push(`${agent.name} must require proof.`);
    if (agent.git_preservation_required !== true) failures.push(`${agent.name} must require Git preservation.`);
    if (agent.high_risk === true && agent.founder_approval_required !== true) failures.push(`${agent.name} high-risk agent must require founder approval.`);
    if (agent.class === "AI_REASONING_AGENT" && agent.may_enforce === true) failures.push(`${agent.name} AI agent must not enforce.`);
    if (agent.class === "BACKEND_AUTHORITY_AGENT" && agent.may_enforce !== true) failures.push(`${agent.name} backend authority agent must enforce.`);
    if (agent.class === "RULE_VALIDATOR_AGENT" && agent.may_validate !== true) failures.push(`${agent.name} validator agent must validate.`);
    if (agent.class === "POWERSHELL_BUILD_AGENT" && agent.may_materialize !== true) failures.push(`${agent.name} PowerShell build agent must materialize.`);
  }

  const requiredAgents = [
    "Doctrine Guardian",
    "No-Secrets Validator",
    "Proof Honesty Validator",
    "Backend Command Bus",
    "Payment Verification Policy",
    "Partner Consent Policy",
    "KINGSMEN_CREATOR.ps1",
    "Oracle Access Tester"
  ];

  for (const required of requiredAgents) {
    if (!names.includes(required)) failures.push(`Missing required agent: ${required}`);
  }
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "AGENTS-01 - Kingsmen Agent System",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  agent_count: manifest?.agents?.length ?? 0,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "none_agent_map_only",
  control_plane_impact: "Creates Kingsmen agent authority and handoff system before Oracle Lite handoff.",
  next_action: passed ? "Proceed to BATCH 22 - Docker Runtime Health Hardening / Oracle Lite VM Handoff Preparation." : "Repair AGENTS-01."
};

fs.mkdirSync(path.dirname(path.join(root, "reports/agents/kingsmen-agent-system-latest.json")), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/agents/kingsmen-agent-system-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
