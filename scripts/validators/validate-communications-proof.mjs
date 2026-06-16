import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/communications/communications-validation-latest.json');

function read(path) {
  const full = join(repoRoot, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : null;
}

function check(name, passed, detail = '') {
  return { name, passed: Boolean(passed), detail };
}

function json(path) {
  const content = read(path);
  if (!content) return null;
  return JSON.parse(content);
}

const checks = [];
const required = [
  'apps/api/src/communications/communications-proof-boundary.ts',
  'apps/api/src/communications/index.ts',
  'manifests/communications/communications-proof-v1.json',
  'docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md',
  'scripts/proof/prove-communications-boundary.mjs',
  'reports/communications/communications-proof-latest.json',
  'package.json',
  '.github/workflows/kingsmen-source-guard.yml',
  'docs/launch/KINGSMEN_LAUNCH_READINESS.md',
  'manifests/launch/kingsmen-launch-readiness-v1.json',
  'scripts/validators/validate-kingsmen-launch-readiness.mjs'
];

for (const path of required) {
  const content = read(path);
  checks.push(check(`file_exists:${path}`, content !== null, path));
  checks.push(check(`file_nonempty:${path}`, Boolean(content && content.trim().length > 0), path));
}

const proof = json('reports/communications/communications-proof-latest.json');
checks.push(check('proof_exists', Boolean(proof), 'reports/communications/communications-proof-latest.json'));
checks.push(check('proof_passed', proof?.passed === true, String(proof?.passed)));
checks.push(check('proof_status', proof?.status === 'COMMUNICATIONS_SOURCE_PROOF_PASSED', String(proof?.status)));
checks.push(check('proof_no_live_messages', proof?.liveMessagesSent === false, String(proof?.liveMessagesSent)));
checks.push(check('proof_provider_pending', proof?.providerStagingProofPending === true, String(proof?.providerStagingProofPending)));

const tokenChecks = [
  ['apps/api/src/communications/communications-proof-boundary.ts', ['COMMUNICATIONS_BOUNDARY_SOURCE_ONLY', 'emailPrimary', 'whatsappUrgentOnly', 'smsBackupOnly', 'bulkMarketingDenied', 'providerSendRequiresStagingProof', 'rawRecipientDataRedacted', 'liveSendExecuted: false']],
  ['apps/api/src/communications/index.ts', ['communications-proof-boundary']],
  ['manifests/communications/communications-proof-v1.json', ['kingsmen.communications-proof.v1', 'foundation_built_pending_provider_staging_proof', 'transactional_email_queued_primary', 'whatsapp_non_urgent_denied', 'live_send_never_executed_by_source_proof']],
  ['docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md', ['Email is primary', 'WhatsApp is urgent-only', 'SMS is backup-only', 'npm run communications:validate']],
  ['scripts/proof/prove-communications-boundary.mjs', ['COMMUNICATIONS_SOURCE_PROOF_PASSED', 'providerStagingProofPending: true']],
  ['package.json', ['communications:prove', 'communications:validate']],
  ['.github/workflows/kingsmen-source-guard.yml', ['npm run communications:prove', 'npm run communications:validate']],
  ['docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['communications proof', 'npm run communications:validate']],
  ['manifests/launch/kingsmen-launch-readiness-v1.json', ['communications-proof-v1', 'foundation_built_pending_provider_staging_proof']],
  ['scripts/validators/validate-kingsmen-launch-readiness.mjs', ['communications:validate', 'COMMUNICATIONS_PROVIDER_STAGING_PROOF_REQUIRED']]
];

for (const [path, tokens] of tokenChecks) {
  const content = read(path) ?? '';
  for (const token of tokens) {
    checks.push(check(`token:${path}:${token}`, content.includes(token), token));
  }
}

const manifest = json('manifests/communications/communications-proof-v1.json');
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
  checks.push(check(`manifest_flag:${field}`, manifest?.[field] === expected, String(manifest?.[field])));
}

for (const [path, blockedTokens] of [
  ['apps/api/src/communications/communications-proof-boundary.ts', ['liveMessagesSent: true', 'bulkSendingAllowed: true', 'providerSecretsMayBeLogged: true']],
  ['manifests/communications/communications-proof-v1.json', ['"productionReady": true', '"publicLaunchAllowed": true', '"liveMessagesSent": true']],
  ['docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md', ['Production ready: **true**', 'Public launch allowed: **true**']]
]) {
  const content = read(path) ?? '';
  for (const token of blockedTokens) {
    checks.push(check(`blocked_token_absent:${path}:${token}`, !content.includes(token), token));
  }
}

const failedChecks = checks.filter((item) => !item.passed);
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Communications Proof',
  status: failedChecks.length === 0 ? 'COMMUNICATIONS_PROOF_VALIDATED' : 'COMMUNICATIONS_PROOF_FAILED',
  passed: failedChecks.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMessagesSent: false,
  failed_checks: failedChecks.map(({ name, detail }) => ({ name, detail })),
  checks,
  generated_at: new Date().toISOString(),
  next_action: failedChecks.length === 0
    ? 'Run provider staging communications proof before enabling candidate notifications.'
    : 'Repair communications proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
