#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = [
  "docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md",
  "docs/agents/JARVIS_KINGSMEN_BOUNDARY.md",
  "manifests/agents/openclaw-jarvis-boundary.json",
  "scripts/agents/Install-OpenClawSandbox.ps1"
];

const forbidden = [
  /-----BEGIN .*PRIVATE KEY-----/i,
  /service_role/i,
  /github_pat_/i,
  /PAYFAST.*PASSPHRASE/i,
  /sk-live/i
];

const failures = [];

for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) failures.push(`Missing ${file}`);
  else {
    const text = fs.readFileSync(full, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(text)) failures.push(`${file} contains forbidden secret-like token: ${pattern}`);
    }
  }
}

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "TOOLS-AGENT-01 - OpenClaw and Jarvis Sandbox Boundary",
  status: failures.length ? "BUILT_PENDING_VALIDATION" : "VALIDATED",
  passed: failures.length === 0,
  productionReady: false,
  failed_checks: failures,
  files_expected: files,
  generated_at: new Date().toISOString(),
  next_action: failures.length
    ? "Repair boundary files."
    : "Run scripts/agents/Install-OpenClawSandbox.ps1, then commit reports only after review."
};

fs.mkdirSync(path.join(root, "reports/agents"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/agents/openclaw-jarvis-boundary-validation-latest.json"),
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
