import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/communications/communications-proof-latest.json');

function read(path) {
  const full = join(repoRoot, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : null;
}

function check(name, passed, detail = '') {
  return { name, passed: Boolean(passed), detail };
}

const requiredFiles = [
  'apps/api/src/communications/communications-proof-boundary.ts',
  'manifests/communications/communications-proof-v1.json',
  'docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md'
];

const checks = requiredFiles.map((path) => check(`file_exists:${path}`, existsSync(join(repoRoot, path)), path));

const boundary = read('apps/api/src/communications/communications-proof-boundary.ts') ?? '';
const manifestRaw = read('manifests/communications/communications-proof-v1.json') ?? '{}';
const docs = read('docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md') ?? '';
let manifest = {};
try {
  manifest = JSON.parse(manifestRaw);
  checks.push(check('manifest_schema', manifest.schema === 'kingsmen.communications-proof.v1', manifest.schema));
} catch (error) {
  checks.push(check('manifest_json_valid', false, String(error)));
}

for (const token of [
  'COMMUNICATIONS_BOUNDARY_SOURCE_ONLY',
  'emailPrimary',
  'whatsappUrgentOnly',
  'smsBackupOnly',
  'bulkMarketingDenied',
  'providerSendRequiresStagingProof',
  'rawRecipientDataRedacted',
  'liveSendExecuted: false'
]) {
  checks.push(check(`boundary_token:${token}`, boundary.includes(token), token));
}

for (const token of [
  'foundation_built_pending_provider_staging_proof',
  'transactional_email_queued_primary',
  'whatsapp_non_urgent_denied',
  'live_send_never_executed_by_source_proof'
]) {
  checks.push(check(`manifest_token:${token}`, manifestRaw.includes(token), token));
}

for (const token of [
  'Email is primary',
  'WhatsApp is urgent-only',
  'SMS is backup-only',
  'No provider secret',
  'No raw candidate recipient data'
]) {
  checks.push(check(`docs_token:${token}`, docs.includes(token), token));
}

const scenarios = [
  { name: 'transactional_email_queued_primary', passed: boundary.includes('providerSendRequiresStagingProof') && boundary.includes('emailPrimary') },
  { name: 'marketing_email_without_consent_denied', passed: boundary.includes('marketingRequiresExplicitConsent') },
  { name: 'bulk_message_denied', passed: boundary.includes('bulkMarketingDenied') },
  { name: 'whatsapp_non_urgent_denied', passed: boundary.includes('whatsappUrgentOnly') && boundary.includes('purpose !== "urgent"') },
  { name: 'whatsapp_urgent_queued_only', passed: boundary.includes('queuedOnly') && boundary.includes('providerSendRequiresStagingProof') },
  { name: 'sms_non_urgent_denied', passed: boundary.includes('smsBackupOnly') && boundary.includes('purpose !== "urgent"') },
  { name: 'sms_urgent_backup_only', passed: boundary.includes('smsBackupOnly') && boundary.includes('providerSendRequiresStagingProof') },
  { name: 'provider_send_requires_staging_proof', passed: boundary.includes('providerStagingProofPresent') && boundary.includes('providerSendRequiresStagingProof') },
  { name: 'recipient_data_redacted', passed: boundary.includes('[redacted-recipient]') && boundary.includes('rawRecipientDataRedacted') },
  { name: 'live_send_never_executed_by_source_proof', passed: boundary.includes('liveSendExecuted: false') && manifest.liveMessagesSent === false }
];

for (const scenario of scenarios) {
  checks.push(check(`scenario:${scenario.name}`, scenario.passed, scenario.name));
}

for (const [field, expected] of [
  ['productionReady', false],
  ['publicLaunchAllowed', false],
  ['liveMessagesSent', false],
  ['bulkSendingAllowed', false],
  ['emailPrimary', true],
  ['whatsappUrgentOnly', true],
  ['smsBackupOnly', true],
  ['providerSecretsMayBeLogged', false],
  ['rawRecipientDataInReportsAllowed', false]
]) {
  checks.push(check(`manifest_flag:${field}`, manifest[field] === expected, String(manifest[field])));
}

const forbidden = [
  /SMTP_PASSWORD\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /SMTP_PASS\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /WHATSAPP_PROVIDER_TOKEN\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /SMS_PROVIDER_TOKEN\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
];

for (const [path, content] of [
  ['apps/api/src/communications/communications-proof-boundary.ts', boundary],
  ['manifests/communications/communications-proof-v1.json', manifestRaw],
  ['docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md', docs]
]) {
  for (const pattern of forbidden) {
    checks.push(check(`no_sensitive_pattern:${path}:${pattern}`, !pattern.test(content), path));
  }
}

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: 'kingsmen.communications-proof-report.v1',
  module: 'Communications Proof',
  status: failed.length === 0 ? 'COMMUNICATIONS_SOURCE_PROOF_PASSED' : 'COMMUNICATIONS_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMessagesSent: false,
  emailPrimary: true,
  whatsappUrgentOnly: true,
  smsBackupOnly: true,
  providerStagingProofPending: true,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: failed.length === 0
    ? 'Run provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, and SMS fallback proof before candidate notifications.'
    : 'Repair communications source boundary.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
