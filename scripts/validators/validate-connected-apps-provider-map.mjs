#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifests/providers/connected-apps-provider-map.json");
const reportPath = path.join(root, "reports/providers/connected-apps-provider-map-latest.json");

const failures = [];
const requiredFiles = [
  "docs/providers/N_PROVIDER_5_CONNECTED_APPS_REALITY_MAP.md",
  "manifests/providers/connected-apps-provider-map.json",
  "scripts/validators/validate-connected-apps-provider-map.mjs",
  "reports/providers/connected-apps-provider-map-latest.json"
];

for (const file of requiredFiles) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) failures.push(`Missing required file: ${file}`);
  else if (fs.statSync(p).size === 0) failures.push(`Empty required file: ${file}`);
}

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, ""));
} catch {
  failures.push("Provider manifest cannot be parsed.");
}

if (manifest) {
  const providers = Array.isArray(manifest.providers) ? manifest.providers : [];
  const names = providers.map((p) => p.name);
  const allowed = new Set(["CALLABLE_NOW","VISIBLE_UNTESTED","OFF_UNTIL_GATED"]);

  if (manifest.module !== "N_PROVIDER.5 - 25 Connected Apps + Supabase Reality Map") failures.push("Wrong module name.");
  if (manifest.provider_count !== 25) failures.push("provider_count must be 25.");
  if (providers.length !== 25) failures.push(`Expected 25 providers, found ${providers.length}.`);
  if (new Set(names).size !== names.length) failures.push("Provider names must be unique.");
  if (!names.includes("Supabase")) failures.push("Supabase must be present.");
  if (!names.includes("GitHub")) failures.push("GitHub must be present.");
  if (!names.includes("Google Drive")) failures.push("Google Drive must be present.");
  if (!names.includes("Airtable")) failures.push("Airtable must be present.");
  if (!names.includes("PayPal")) failures.push("PayPal must be present.");
  if (!names.includes("OpenAI Platform")) failures.push("OpenAI Platform must be present.");

  for (const provider of providers) {
    if (!allowed.has(provider.class)) failures.push(`${provider.name} has invalid class: ${provider.class}`);
    if (provider.production_enabled !== false) failures.push(`${provider.name} must not be production enabled in N_PROVIDER.5.`);
    if (provider.runtime_use_enabled !== false) failures.push(`${provider.name} runtime use must remain disabled until gated.`);
    if (provider.secrets_boundary_required !== true) failures.push(`${provider.name} must require secrets boundary.`);
    if (provider.candidate_data_boundary_required !== true) failures.push(`${provider.name} must require candidate-data boundary.`);
    if (provider.validator_required !== true) failures.push(`${provider.name} must require validator.`);
    if (provider.proof_report_required !== true) failures.push(`${provider.name} must require proof report.`);
    if (provider.high_risk === true && provider.founder_approval_required !== true) {
      failures.push(`${provider.name} is high risk and must require founder approval.`);
    }
  }

  const softonic = providers.find((p) => p.name === "Softonic");
  const vivin = providers.find((p) => p.name === "Vivin");
  if (softonic?.class !== "OFF_UNTIL_GATED") failures.push("Softonic must be OFF_UNTIL_GATED.");
  if (vivin?.class !== "OFF_UNTIL_GATED") failures.push("Vivin must be OFF_UNTIL_GATED.");
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "N_PROVIDER.5 - 25 Connected Apps + Supabase Reality Map",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  generated_at: new Date().toISOString(),
  files_expected: requiredFiles,
  files_checked: requiredFiles.length,
  provider_count: manifest?.providers?.length ?? 0,
  missing_files: requiredFiles.filter((f) => !fs.existsSync(path.join(root, f))),
  failed_checks: failures,
  warnings: [],
  oracle_lite_impact: "none_provider_map_only",
  control_plane_impact: "Creates provider reality map and gates visible apps before production use.",
  next_action: passed ? "Proceed to TOOLS-01 - Connected Tool Activation Gates." : "Repair provider map."
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
