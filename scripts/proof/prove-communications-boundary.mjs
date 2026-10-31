import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, "reports/communications/communications-proof-latest.json");
const read = (path) => existsSync(join(repoRoot, path)) ? readFileSync(join(repoRoot, path), "utf8") : null;
const checks = [];
const add = (name, passed, detail = "") => checks.push({ name, passed: Boolean(passed), detail });

const required = [
  "apps/api/src/communications/communications-proof-boundary.ts",
  "manifests/communications/communications-proof-v1.json",
  "docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md"
];
for (const path of required) add("file_exists:" + path, Boolean(read(path)), path);

const boundary = read("apps/api/src/communications/communications-proof-boundary.ts") ?? "";
const manifestText = read("manifests/communications/communications-proof-v1.json") ?? "{}";
const docs = read("docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md") ?? "";
let manifest = {};
try {
  manifest = JSON.parse(manifestText);
  add("manifest_schema", manifest.schema === "kingsmen.communications-proof.v1", manifest.schema);
} catch (error) {
  add("manifest_json_valid", false, String(error));
}

for (const token of [
  "COMMUNICATIONS_BOUNDARY_SOURCE_ONLY",
  "emailPrimary",
  "whatsappDisabled",
  "smsDisabled",
  "bulkMarketingDenied",
  "providerSendRequiresStagingProof",
  "rawRecipientDataRedacted",
  "liveSendExecuted: false",
  'request.channel === "whatsapp"',
  'request.channel === "sms"',
  'reason: "whatsappDisabled"',
  'reason: "smsDisabled"'
]) add("boundary_token:" + token, boundary.includes(token), token);

for (const token of [
  "email_portal_only_pending_email_provider_staging_proof",
  "transactional_email_queued_primary",
  "whatsapp_any_purpose_denied",
  "sms_any_purpose_denied",
  "live_send_never_executed_by_source_proof"
]) add("manifest_token:" + token, manifestText.includes(token), token);

for (const token of [
  "Email is the only enabled external candidate communication channel",
  "WhatsApp is disabled",
  "SMS is disabled",
  "No provider secret",
  "No raw candidate recipient data"
]) add("docs_token:" + token, docs.includes(token), token);

const scenarios = [
  { name: "transactional_email_queued_primary", passed: boundary.includes('request.channel === "email"') && boundary.includes("providerSendRequiresStagingProof") },
  { name: "whatsapp_any_purpose_denied", passed: boundary.includes('request.channel === "whatsapp"') && boundary.includes('reason: "whatsappDisabled"') },
  { name: "sms_any_purpose_denied", passed: boundary.includes('request.channel === "sms"') && boundary.includes('reason: "smsDisabled"') },
  { name: "bulk_message_denied", passed: boundary.includes("request.recipientCount > 1") && boundary.includes("bulkMarketingDenied") },
  { name: "marketing_email_without_consent_denied", passed: boundary.includes("marketingRequiresExplicitConsent") },
  { name: "portal_message_allowed", passed: boundary.includes('channel === "email"') && !boundary.includes("PORTAL_CHANNEL_DISABLED") },
  { name: "provider_send_requires_staging_proof", passed: boundary.includes("providerStagingProofPresent") && boundary.includes("providerSendRequiresStagingProof") },
  { name: "recipient_data_redacted", passed: boundary.includes("[redacted-recipient]") && boundary.includes("rawRecipientDataRedacted") },
  { name: "live_send_never_executed_by_source_proof", passed: boundary.includes("liveSendExecuted: false") && manifest.liveMessagesSent === false }
];
for (const scenario of scenarios) add("scenario:" + scenario.name, scenario.passed, scenario.name);

for (const [field, expected] of [
  ["productionReady", false],
  ["publicLaunchAllowed", false],
  ["liveMessagesSent", false],
  ["bulkSendingAllowed", false],
  ["emailPrimary", true],
  ["whatsappUrgentOnly", false],
  ["smsBackupOnly", false],
  ["whatsappDisabled", true],
  ["smsDisabled", true],
  ["providerSecretsMayBeLogged", false],
  ["rawRecipientDataInReportsAllowed", false]
]) add("manifest_flag:" + field, manifest[field] === expected, String(manifest[field]));

const forbidden = [
  /SMTP_PASSWORD\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /SMTP_PASS\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /WHATSAPP_PROVIDER_TOKEN\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /SMS_PROVIDER_TOKEN\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
];
for (const [path, content] of [
  ["apps/api/src/communications/communications-proof-boundary.ts", boundary],
  ["manifests/communications/communications-proof-v1.json", manifestText],
  ["docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md", docs]
]) for (const pattern of forbidden) add("no_sensitive_pattern:" + path + ":" + pattern, !pattern.test(content), path);

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "kingsmen.communications-proof-report.v2",
  module: "Communications Proof",
  status: failed.length === 0 ? "COMMUNICATIONS_SOURCE_PROOF_PASSED" : "COMMUNICATIONS_SOURCE_PROOF_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMessagesSent: false,
  emailPrimary: true,
  whatsappUrgentOnly: false,
  smsBackupOnly: false,
  whatsappDisabled: true,
  smsDisabled: true,
  providerStagingProofPending: true,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: failed.length === 0
    ? "Run approved email provider staging send/receive, bounce, opt-out, retry and dead-letter proof before candidate notifications."
    : "Repair the communications source boundary."
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
