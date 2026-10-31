import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, "reports/communications/communications-validation-latest.json");
const read = (path) => existsSync(join(repoRoot, path)) ? readFileSync(join(repoRoot, path), "utf8") : null;
const json = (path) => { const content = read(path); return content ? JSON.parse(content) : null; };
const checks = [];
const add = (name, passed, detail = "") => checks.push({ name, passed: Boolean(passed), detail });

const required = [
  "apps/api/src/communications/communications-proof-boundary.ts",
  "apps/api/src/communications/index.ts",
  "manifests/communications/communications-proof-v1.json",
  "docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md",
  "scripts/proof/prove-communications-boundary.mjs",
  "reports/communications/communications-proof-latest.json",
  "package.json",
  ".github/workflows/kingsmen-source-guard.yml",
  "docs/launch/KINGSMEN_LAUNCH_READINESS.md",
  "manifests/launch/kingsmen-launch-readiness-v1.json",
  "scripts/validators/validate-kingsmen-launch-readiness.mjs"
];
for (const path of required) {
  const content = read(path);
  add("file_exists:" + path, content !== null && content.trim().length > 0, path);
}

const proof = json("reports/communications/communications-proof-latest.json");
add("proof_exists", Boolean(proof), "communications proof report");
add("proof_passed", proof?.passed === true, String(proof?.passed));
add("proof_status", proof?.status === "COMMUNICATIONS_SOURCE_PROOF_PASSED", String(proof?.status));
add("proof_no_live_messages", proof?.liveMessagesSent === false, String(proof?.liveMessagesSent));
add("proof_provider_pending", proof?.providerStagingProofPending === true, String(proof?.providerStagingProofPending));

const tokens = [
  ["apps/api/src/communications/communications-proof-boundary.ts", ["COMMUNICATIONS_BOUNDARY_SOURCE_ONLY", "emailPrimary", "whatsappDisabled", "smsDisabled", "bulkMarketingDenied", "providerSendRequiresStagingProof", "rawRecipientDataRedacted", "liveSendExecuted: false"]],
  ["apps/api/src/communications/index.ts", ["communications-proof-boundary"]],
  ["manifests/communications/communications-proof-v1.json", ["kingsmen.communications-proof.v1", "email_portal_only_pending_email_provider_staging_proof", "transactional_email_queued_primary", "whatsapp_any_purpose_denied", "sms_any_purpose_denied", "live_send_never_executed_by_source_proof"]],
  ["docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md", ["**Email** is the only enabled external candidate communication channel", "WhatsApp is disabled", "SMS is disabled", "npm run communications:validate"]],
  ["scripts/proof/prove-communications-boundary.mjs", ["COMMUNICATIONS_SOURCE_PROOF_PASSED", "whatsapp_any_purpose_denied", "sms_any_purpose_denied"]],
  ["package.json", ["communications:prove", "communications:validate"]],
  [".github/workflows/kingsmen-source-guard.yml", ["npm run communications:prove", "npm run communications:validate"]],
  ["docs/launch/KINGSMEN_LAUNCH_READINESS.md", ["communications proof", "npm run communications:validate"]],
  ["manifests/launch/kingsmen-launch-readiness-v1.json", ["communications-proof-v1"]],
  ["scripts/validators/validate-kingsmen-launch-readiness.mjs", ["communications:validate", "COMMUNICATIONS_PROVIDER_STAGING_PROOF_REQUIRED"]]
];
for (const [path, wanted] of tokens) {
  const content = read(path) ?? "";
  for (const token of wanted) add("token:" + path + ":" + token, content.includes(token), token);
}

const manifest = json("manifests/communications/communications-proof-v1.json");
for (const [field, expected] of [
  ["productionReady", false], ["publicLaunchAllowed", false], ["liveMessagesSent", false],
  ["bulkSendingAllowed", false], ["emailPrimary", true], ["whatsappUrgentOnly", false],
  ["smsBackupOnly", false], ["whatsappDisabled", true], ["smsDisabled", true],
  ["providerSecretsMayBeLogged", false], ["rawRecipientDataInReportsAllowed", false]
]) add("manifest_flag:" + field, manifest?.[field] === expected, String(manifest?.[field]));

const boundary = read("apps/api/src/communications/communications-proof-boundary.ts") ?? "";
add("whatsapp_fail_closed", boundary.includes('request.channel === "whatsapp"') && boundary.includes('reason: "whatsappDisabled"'), "whatsapp is blocked for every purpose");
add("sms_fail_closed", boundary.includes('request.channel === "sms"') && boundary.includes('reason: "smsDisabled"'), "sms is blocked for every purpose");

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "kingsmen.validation-report.v2",
  module: "Communications Proof",
  status: failed.length === 0 ? "COMMUNICATIONS_PROOF_VALIDATED" : "COMMUNICATIONS_PROOF_FAILED",
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMessagesSent: false,
  failed_checks: failed,
  checks,
  generated_at: new Date().toISOString(),
  next_action: failed.length === 0
    ? "Run approved email-provider staging proof before enabling candidate notifications."
    : "Repair the communications source proof and rerun validation."
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
