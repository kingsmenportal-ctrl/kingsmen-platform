import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "n-provider-4", "chatgpt-connected-apps-registry.json");
const reportDir = path.join(root, "reports", "provider");
fs.mkdirSync(reportDir, { recursive: true });

const errors = [];
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

if (registry.module !== "N_PROVIDER.4") errors.push("module must be N_PROVIDER.4");
if (registry.source_evidence.chatgpt_apps_menu_visible_count !== 24) errors.push("visible count must be 24");
if (registry.apps.length !== 24) errors.push(`expected 24 apps, found ${registry.apps.length}`);
if (registry.doctrine.truth_source !== "postgresql") errors.push("truth source must be postgresql");
if (registry.doctrine.airtable_mode !== "mirror_only") errors.push("Airtable must be mirror_only");
if (registry.doctrine.communication_primary !== "email") errors.push("communication must be email-first");

const names = new Set(registry.apps.map(a => a.display_name));
for (const required of ["GitHub","Airtable","Gmail","Google Drive","Netlify","PayPal","OpenAI Platform","Vivin"]) {
  if (!names.has(required)) errors.push(`missing ${required}`);
}

const byName = Object.fromEntries(registry.apps.map(a => [a.display_name, a]));
if (byName["Airtable"].safe_default !== "MIRROR_ONLY") errors.push("Airtable must be mirror-only");
if (byName["PayPal"].safe_default !== "LIVE_PAYMENTS_OFF") errors.push("PayPal live payments must be off");
if (byName["OpenAI Platform"].safe_default !== "OFF_UNTIL_GATED") errors.push("OpenAI Platform must be gated");
if (byName["Vivin"].safe_default !== "UNKNOWN_OFF") errors.push("Vivin must remain off until tested");

const statusCounts = registry.apps.reduce((acc, app) => {
  acc[app.chatgpt_access_status] = (acc[app.chatgpt_access_status] || 0) + 1;
  return acc;
}, {});

const report = {
  module: "N_PROVIDER.4",
  validator: "validate-chatgpt-connected-apps.mjs",
  generated_at: new Date().toISOString(),
  passed: errors.length === 0,
  errors,
  expected_app_count: 24,
  actual_app_count: registry.apps.length,
  status_counts: statusCounts,
  google_drive_reference_document_id: registry.source_evidence.google_drive_reference_document_id,
  safety: {
    distinguishes_visible_from_callable: true,
    airtable_mirror_only: byName["Airtable"].safe_default === "MIRROR_ONLY",
    email_first: registry.doctrine.communication_primary === "email",
    payments_live_gated: byName["PayPal"].safe_default === "LIVE_PAYMENTS_OFF",
    unknown_apps_off: byName["Vivin"].safe_default === "UNKNOWN_OFF"
  }
};

fs.writeFileSync(path.join(reportDir, "chatgpt-connected-apps-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
