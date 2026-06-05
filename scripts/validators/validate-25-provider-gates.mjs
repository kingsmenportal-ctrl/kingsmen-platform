#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.join(root, "manifests/providers/kingsmen-25-connected-apps-tools-provider-map.json");
const failures = [];

if (!fs.existsSync(file)) {
  failures.push("Missing provider gate manifest.");
} else {
  const map = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));

  if (map.productionReady !== false) failures.push("Provider map productionReady must be false.");
  if (!Array.isArray(map.providers)) failures.push("providers must be an array.");
  if (Array.isArray(map.providers) && map.providers.length !== 25) failures.push(`Expected 25 providers, got ${map.providers.length}.`);

  const ids = new Set();
  for (const provider of map.providers ?? []) {
    if (!provider.id) failures.push("Provider missing id.");
    if (ids.has(provider.id)) failures.push(`Duplicate provider id: ${provider.id}`);
    ids.add(provider.id);

    if (provider.productionSafe !== false) failures.push(`${provider.id} productionSafe must be false until proof.`);
    if (!provider.status) failures.push(`${provider.id} missing status.`);
    if (!provider.class) failures.push(`${provider.id} missing class.`);
  }

  for (const required of ["github", "google_drive", "gmail", "airtable", "oracle_lite", "supabase", "payfast", "paypal", "openjarvis_openclaw"]) {
    if (!ids.has(required)) failures.push(`Missing required provider ${required}.`);
  }
}

const passed = failures.length === 0;
const report = {
  schema: "kingsmen.validation-report.v1",
  module: "MASTER-INDEX-01 - 25 Provider Gates",
  status: passed ? "VALIDATED" : "BUILT_PENDING_VALIDATION",
  passed,
  productionReady: false,
  failed_checks: failures,
  generated_at: new Date().toISOString(),
  next_action: passed ? "Validate no provider production claims without proof." : "Repair provider gate manifest."
};

fs.mkdirSync(path.join(root, "reports/validation"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/validation/provider-gates-validation-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
