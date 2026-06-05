#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/agents/KINGSMEN_AGENT_SYSTEM.md",
  "docs/agents/AGENT_AUTHORITY_BOUNDARY.md",
  "manifests/agents/kingsmen-agent-system.json",
  "scripts/agents/Invoke-KingsmenFounderCommand.ps1",
  "scripts/agents/validate-kingsmen-agent-system.mjs"
];

const failures = [];

function full(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(full(rel), "utf8").replace(/^\uFEFF/, "");
}

for (const file of requiredFiles) {
  if (!fs.existsSync(full(file))) {
    failures.push(`Missing required file: ${file}`);
  } else if (fs.statSync(full(file)).size === 0) {
    failures.push(`Empty required file: ${file}`);
  }
}

const secretPatterns = [
  /-----BEGIN .*PRIVATE KEY-----/i,
  /github_pat_[A-Za-z0-9_]{20,}/i,
  /\bsk-[A-Za-z0-9_-]{20,}/i,
  /\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*["']?[A-Za-z0-9._-]{30,}/i
];

for (const file of requiredFiles.filter((file) => fs.existsSync(full(file)))) {
  // Do not treat the validator file itself as a secret leak just because it contains regex definitions.
  if (file === "scripts/agents/validate-kingsmen-agent-system.mjs") continue;

  const text = read(file);
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) {
      failures.push(`${file} contains forbidden secret pattern: ${pattern}`);
    }
  }
}

if (fs.existsSync(full("manifests/agents/kingsmen-agent-system.json"))) {
  const manifest = JSON.parse(read("manifests/agents/kingsmen-agent-system.json"));

  if (manifest.productionReady !== false) {
    failures.push("Agent system manifest must set productionReady=false.");
  }

  const agentIds = new Set((manifest.agents ?? []).map((agent) => agent.id));

  for (const expected of [
    "founder_command_agent",
    "doctrine_guardian_agent",
    "provider_gate_agent",
    "proof_honesty_agent",
    "oracle_lite_agent",
    "candidate_safety_agent",
    "finance_guard_agent",
    "communications_guard_agent"
  ]) {
    if (!agentIds.has(expected)) failures.push(`Missing agent: ${expected}`);
  }

  const blocked = manifest.commandClasses?.BLOCKED ?? [];
  for (const required of ["raw-shell", "export-candidate-data", "approve-refund", "mark-payment-paid", "claim-official-submission"]) {
    if (!blocked.includes(required)) failures.push(`BLOCKED command class missing ${required}`);
  }

  const approvalRequired = manifest.commandClasses?.APPROVAL_REQUIRED ?? [];
  for (const required of ["deploy", "enable-live-payment", "send-bulk-email", "change-dns", "raise-cap"]) {
    if (!approvalRequired.includes(required)) failures.push(`APPROVAL_REQUIRED command class missing ${required}`);
  }
}

if (fs.existsSync(full("docs/agents/KINGSMEN_AGENT_SYSTEM.md"))) {
  const doc = read("docs/agents/KINGSMEN_AGENT_SYSTEM.md");
  for (const token of [
    "AI may recommend",
    "Scripts must validate",
    "Backend must enforce",
    "Founder must approve high-risk actions",
    "WhatsApp urgent-only",
    "MAP fallback"
  ]) {
    if (!doc.includes(token)) failures.push(`Agent system doc missing token: ${token}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "AGENTS-01 - Founder Command Agent / Agent Registry / Tool Permission Boundary",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  productionReady: false,
  files_expected: requiredFiles,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed
    ? "Proceed to MASTER-INDEX-01 or BATCH 21C depending on active build order."
    : "Repair AGENTS-01 files."
};

fs.mkdirSync(full("reports/agents"), { recursive: true });
fs.writeFileSync(
  full("reports/agents/kingsmen-agent-system-validation-latest.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
