#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports/validation/merge-foundation-latest.json");

const requiredFiles = [
  "docs/constitution/reality-trained-kingsmen-constitution.md",
  "manifests/proof/proof-standard.json",
  "manifests/tools/tool-registry.json",
  "manifests/credentials/credentials.registry.json",
  "manifests/providers/provider-registry.json",
  "manifests/reality/source-confidence-bands.json",
  "manifests/business/package-catalogue.json",
  "scripts/validators/validate-merge-foundation.mjs",
  "reports/validation/merge-foundation-latest.json",
  ".github/ISSUE_TEMPLATE/kingsmen-module.yml"
];

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

const failures = [];
const warnings = [];
const checked = [];

for (const file of requiredFiles) {
  checked.push(file);
  if (!exists(file)) {
    failures.push(`Missing required file: ${file}`);
    continue;
  }
  const stat = fs.statSync(path.join(ROOT, file));
  if (stat.size === 0) failures.push(`Required file is empty: ${file}`);
}

function expectText(file, needle, label = needle) {
  if (!exists(file)) return;
  const txt = readText(file);
  if (!txt.includes(needle)) failures.push(`${file} missing required text: ${label}`);
}

function expectNoText(file, pattern, label) {
  if (!exists(file)) return;
  const txt = readText(file);
  if (pattern.test(txt)) failures.push(`${file} contains forbidden pattern: ${label}`);
}

expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "500 active candidates", "500 active candidate cap");
expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "Email is the primary", "email-first doctrine");
expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "OpenClaw", "OpenClaw governance doctrine");
expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "Accommodation is a full Kingsmen sector", "accommodation sector doctrine");
expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "CV Revamp is locked at R49.99", "CV Revamp price doctrine");
expectText("docs/constitution/reality-trained-kingsmen-constitution.md", "No module may be marked complete", "proof discipline");

for (const file of requiredFiles.filter((f) => f.endsWith(".md") || f.endsWith(".json") || f.endsWith(".yml") || f.endsWith(".mjs"))) {
  expectNoText(file, /productionReady\s*[:=]\s*true/i, "productionReady true");
  expectNoText(file, /service[_-]?role[_-]?key\s*[:=]/i, "raw service role key assignment");
  expectNoText(file, /sk-[A-Za-z0-9_-]{16,}/, "possible API key literal");
}

let proof;
try {
  proof = readJson("manifests/proof/proof-standard.json");
  for (const status of ["NOT_STARTED", "DESIGNED", "BUILT_PENDING_VALIDATION", "VALIDATED", "RUNTIME_PROVEN", "STAGING_PROVEN", "PRODUCTION_READY", "PRODUCTION_ACTIVE", "PAUSED", "REPLACED", "ARCHIVED_FOR_FUTURE"]) {
    if (!proof.proof_statuses?.includes(status)) failures.push(`proof-standard missing status ${status}`);
  }
  if (!proof.hard_rules?.some((rule) => String(rule).includes("No raw secrets"))) failures.push("proof-standard missing raw secret hard rule");
} catch (err) {
  failures.push(`Could not parse proof-standard.json: ${err.message}`);
}

try {
  const tools = readJson("manifests/tools/tool-registry.json");
  const requiredToolIds = ["chatgpt", "github", "powershell_creator", "openclaw", "playwright", "docker_compose", "postgresql", "redis"];
  const toolIds = new Set((tools.tools ?? []).map((tool) => tool.tool_id));
  for (const toolId of requiredToolIds) {
    if (!toolIds.has(toolId)) failures.push(`tool-registry missing ${toolId}`);
  }
  const openclaw = (tools.tools ?? []).find((tool) => tool.tool_id === "openclaw");
  if (!openclaw) failures.push("tool-registry missing OpenClaw record");
  else {
    for (const forbidden of ["read_raw_secrets", "write_production_database", "bypass_captcha_or_otp", "deploy_production"]) {
      if (!openclaw.forbidden_actions?.includes(forbidden)) failures.push(`OpenClaw policy missing forbidden action: ${forbidden}`);
    }
  }
} catch (err) {
  failures.push(`Could not parse tool-registry.json: ${err.message}`);
}

try {
  const credentials = readJson("manifests/credentials/credentials.registry.json");
  if (credentials.secret_policy?.raw_secrets_in_repo !== false) failures.push("credentials registry must forbid raw secrets in repo");
  if (credentials.secret_policy?.openclaw_raw_secret_access !== false) failures.push("credentials registry must forbid OpenClaw raw secret access");
  for (const name of ["DATABASE_URL", "REDIS_URL", "SMTP_PASSWORD", "PAYMENT_PROVIDER_SECRET", "OPENCLAW_GATEWAY_TOKEN"]) {
    if (!(credentials.credentials ?? []).some((credential) => credential.credential_name === name)) failures.push(`credentials registry missing ${name}`);
  }
} catch (err) {
  failures.push(`Could not parse credentials.registry.json: ${err.message}`);
}

try {
  const providers = readJson("manifests/providers/provider-registry.json");
  for (const providerId of ["github", "oracle_lite", "postgresql", "redis", "email", "payment", "object_storage", "openclaw"]) {
    if (!(providers.providers ?? []).some((provider) => provider.provider_id === providerId)) failures.push(`provider registry missing ${providerId}`);
  }
} catch (err) {
  failures.push(`Could not parse provider-registry.json: ${err.message}`);
}

try {
  const source = readJson("manifests/reality/source-confidence-bands.json");
  for (const band of ["UNVERIFIED", "HIGH_CONFIDENCE", "FROZEN_VERIFIED", "STALE", "CONFLICTED", "SCAM_RISK"]) {
    if (!source.confidence_bands?.includes(band)) failures.push(`source confidence missing band ${band}`);
  }
  if (!source.claim_levels?.some((level) => level.level === 4 && level.requires_approval === true)) failures.push("source confidence level 4 must require approval");
} catch (err) {
  failures.push(`Could not parse source-confidence-bands.json: ${err.message}`);
}

try {
  const catalogue = readJson("manifests/business/package-catalogue.json");
  if (catalogue.currency !== "ZAR") failures.push("package catalogue currency must be ZAR");
  const packageMap = new Map((catalogue.packages ?? []).map((pkg) => [pkg.name, pkg.price]));
  const expectedPrices = {
    "Foundational Accord": 169.99,
    "Collegiate Ordinance": 299.99,
    "Chancellor's Writ": 399.99,
    "Regency Mandate": 469.99,
    "Artisan Charter": 149.99,
    "Guildmaster's Charter": 199.99,
    "CV Revamp": 49.99
  };
  for (const [name, price] of Object.entries(expectedPrices)) {
    if (packageMap.get(name) !== price) failures.push(`package catalogue price mismatch for ${name}`);
  }
  if (catalogue.growth_cap?.starting_active_candidate_cap !== 500) failures.push("package catalogue must record 500 active candidate starting cap");
  if (!String(catalogue.access_law ?? "").includes("do not hide")) failures.push("package catalogue missing package access law wording");
} catch (err) {
  failures.push(`Could not parse package-catalogue.json: ${err.message}`);
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "BATCH 01 — Merge Foundation",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: checked.length,
  missing_files: requiredFiles.filter((file) => !exists(file)),
  failed_checks: failures,
  warnings,
  oracle_lite_impact: "none_runtime_yet",
  control_plane_impact: "Build Proof Centre later reads this report to show BATCH 01 proof status.",
  next_action: passed ? "Proceed to BATCH 02 — Creator Normalize." : "Repair failed checks and rerun validator."
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
