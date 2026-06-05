#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "docs/agents/OPENCLAW_KINGSMEN_BOUNDARY.md",
  "docs/agents/JARVIS_KINGSMEN_BOUNDARY.md",
  "manifests/agents/openclaw-jarvis-boundary.json",
  "scripts/agents/Install-OpenClawSandbox.ps1",
  ".gitignore"
];

const failures = [];

const actualSecretPatterns = [
  {
    name: "private_key_block",
    pattern: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |ENCRYPTED |)PRIVATE KEY-----/i
  },
  {
    name: "github_token_value",
    pattern: /github_pat_[A-Za-z0-9_]{20,}/i
  },
  {
    name: "openai_or_provider_key_value",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}/i
  },
  {
    name: "supabase_service_role_value",
    pattern: /\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*["']?[A-Za-z0-9._-]{30,}/i
  },
  {
    name: "payfast_passphrase_value",
    pattern: /\bPAYFAST_[A-Z_]*PASSPHRASE\s*[:=]\s*["'][^"'\s]{8,}/i
  },
  {
    name: "ssh_private_key_reference_inside_repo",
    pattern: /tools\/agents\/openclaw\/repo\/.*PRIVATE KEY/i
  }
];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, "");
}

for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`);
    continue;
  }

  const text = read(file);

  for (const item of actualSecretPatterns) {
    if (item.pattern.test(text)) {
      failures.push(`${file} contains forbidden actual secret pattern: ${item.name}`);
    }
  }
}

const manifestPath = "manifests/agents/openclaw-jarvis-boundary.json";
if (fs.existsSync(path.join(root, manifestPath))) {
  const manifest = JSON.parse(read(manifestPath));

  if (manifest.productionReady !== false) {
    failures.push("OpenClaw/Jarvis manifest must set productionReady=false.");
  }

  const openclaw = manifest.tools?.find((tool) => tool.name === "OpenClaw");
  const jarvis = manifest.tools?.find((tool) => tool.name === "Jarvis");

  if (!openclaw) failures.push("Manifest missing OpenClaw entry.");
  if (!jarvis) failures.push("Manifest missing Jarvis entry.");

  if (openclaw && openclaw.status !== "RESEARCH_SANDBOX_ONLY") {
    failures.push("OpenClaw must remain RESEARCH_SANDBOX_ONLY.");
  }

  if (jarvis && jarvis.status !== "RESEARCH_ONLY_NOT_CONNECTED") {
    failures.push("Jarvis must remain RESEARCH_ONLY_NOT_CONNECTED.");
  }

  for (const tool of manifest.tools ?? []) {
    const blocked = (tool.blockedUse ?? []).join(" ").toLowerCase();
    for (const required of ["secrets", "candidate data", "payments"]) {
      if (!blocked.includes(required)) {
        failures.push(`${tool.name} blockedUse must include ${required}.`);
      }
    }
  }
}

const gitignore = fs.existsSync(path.join(root, ".gitignore")) ? read(".gitignore") : "";
for (const ignored of ["tools/agents/openclaw/repo/", "tools/agents/jarvis/repo/"]) {
  if (!gitignore.includes(ignored)) {
    failures.push(`.gitignore must ignore ${ignored}`);
  }
}

const passed = failures.length === 0;

const report = {
  schema: "kingsmen.validation-report.v1",
  module: "TOOLS-AGENT-01 - OpenClaw and Jarvis Sandbox Boundary",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  productionReady: false,
  connectedToKingsmenSecrets: false,
  candidateDataAccess: false,
  oracleAccess: false,
  paymentAccess: false,
  files_expected: files,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed
    ? "Proceed to AGENTS-01 Founder Command Agent boundary."
    : "Repair OpenClaw/Jarvis sandbox boundary files."
};

fs.mkdirSync(path.join(root, "reports/agents"), { recursive: true });
fs.writeFileSync(
  path.join(root, "reports/agents/openclaw-jarvis-boundary-validation-latest.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
