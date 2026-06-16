#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/finance/payfast-sandbox-proof-latest.json');
const failures = [];
const checks = [];

function full(path) {
  return join(repoRoot, path);
}

function read(path) {
  const target = full(path);
  if (!existsSync(target)) return null;
  return readFileSync(target, 'utf8');
}

function check(name, passed, detail = '', path = '') {
  checks.push({ name, passed, detail, path });
  if (!passed) failures.push({ name, detail, path });
}

function checkFile(path, tokens = []) {
  const content = read(path);
  check(`file_exists:${path}`, content !== null, content === null ? 'missing' : `${content.length} bytes`, path);
  if (content === null) return;
  for (const token of tokens) {
    check(`token:${path}:${token}`, content.includes(token), token, path);
  }
}

const requiredFiles = [
  'apps/api/src/finance/payfast-signature.ts',
  'apps/api/src/finance/payfast-itn.ts',
  'apps/api/src/finance/payfast-sandbox-proof.ts',
  'apps/api/src/finance/index.ts',
  'db/migrations/0008_n10_finance_payfast.sql',
  'manifests/payment/payfast-sandbox-proof-v1.json',
  'docs/finance/KINGSMEN_PAYMENT_PROOF.md',
  'scripts/proof/prove-payfast-sandbox-boundary.mjs',
  'scripts/validators/validate-payfast-sandbox-proof.mjs',
  'package.json',
  'manifests/launch/kingsmen-launch-readiness-v1.json'
];

for (const file of requiredFiles) checkFile(file);

checkFile('apps/api/src/finance/payfast-itn.ts', [
  'verifyPayFastSignature',
  'expectedMerchantReference',
  'expectedAmountCents',
  'duplicate',
  'ipValid',
  'Payment status is not COMPLETE.'
]);

checkFile('apps/api/src/finance/payfast-sandbox-proof.ts', [
  'sandbox_success_complete_itn',
  'sandbox_cancel_return_no_status_change',
  'sandbox_return_pending_until_itn',
  'sandbox_failed_payment_rejected',
  'sandbox_duplicate_itn_rejected',
  'sandbox_invalid_signature_rejected',
  'sandbox_amount_mismatch_rejected',
  'sandbox_replay_idempotency_rejected',
  'refund_requires_human_review',
  'secrets_redacted_from_evidence',
  'livePaymentsEnabled: false',
  'candidateCharged: false',
  'refundsAutoApproved: false',
  'paymentStatusChangesRequireAcceptedItn: true'
]);

checkFile('db/migrations/0008_n10_finance_payfast.sql', [
  'finance_orders',
  'payfast_payment_intents',
  'finance_payments',
  'payfast_itn_receipts',
  'finance_refund_requests',
  'payment_evidence_ledger',
  'signature_valid',
  'amount_valid',
  'duplicate',
  'accepted'
]);

checkFile('docs/finance/KINGSMEN_PAYMENT_PROOF.md', [
  'Payment truth must be stored in PostgreSQL/Supabase finance tables',
  'Paid status requires accepted ITN evidence',
  'npm run payments:prove:sandbox',
  'npm run payments:validate:sandbox',
  'real PayFast sandbox checkout'
]);

checkFile('manifests/payment/payfast-sandbox-proof-v1.json', [
  'foundation_built_pending_sandbox_run',
  'productionReady',
  'livePaymentsEnabled',
  'candidateCharged',
  'refundsAutoApproved',
  'paymentStatusChangesRequireAcceptedItn'
]);

checkFile('scripts/proof/prove-payfast-sandbox-boundary.mjs', [
  'PAYFAST_SANDBOX_SOURCE_PROOF_PASSED',
  'payfastEnvironment',
  'livePaymentsEnabled: false',
  'candidateCharged: false',
  'reports/finance/payfast-sandbox-proof-run-latest.json'
]);

checkFile('package.json', [
  'payments:prove:sandbox',
  'payments:validate:sandbox'
]);

checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', [
  'payfast-sandbox-proof-v1',
  'foundation_built_pending_real_sandbox_evidence',
  'PayFast sandbox and ITN verification evidence'
]);

const forbiddenSecretPatterns = [
  /PAYFAST_MERCHANT_KEY\s*[:=]\s*['\"][^'\"]+/i,
  /PAYFAST_PASSPHRASE\s*[:=]\s*['\"][^'\"]+/i,
  /SERVICE_ROLE_KEY\s*[:=]\s*['\"][^'\"]+/i,
  /sk-[A-Za-z0-9_-]{20,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i
];

for (const file of requiredFiles) {
  const content = read(file);
  if (content === null) continue;
  for (const pattern of forbiddenSecretPatterns) {
    check(`no_secret_pattern:${file}:${pattern}`, !pattern.test(content), 'secret-like pattern must not appear', file);
  }
}

const manifestContent = read('manifests/payment/payfast-sandbox-proof-v1.json');
if (manifestContent) {
  try {
    const manifest = JSON.parse(manifestContent);
    check('manifest_production_false', manifest.productionReady === false, String(manifest.productionReady), 'manifests/payment/payfast-sandbox-proof-v1.json');
    check('manifest_live_payments_false', manifest.livePaymentsEnabled === false, String(manifest.livePaymentsEnabled), 'manifests/payment/payfast-sandbox-proof-v1.json');
    check('manifest_candidate_charged_false', manifest.candidateCharged === false, String(manifest.candidateCharged), 'manifests/payment/payfast-sandbox-proof-v1.json');
    check('manifest_sandbox_environment', manifest.payfastEnvironment === 'sandbox', String(manifest.payfastEnvironment), 'manifests/payment/payfast-sandbox-proof-v1.json');
    check('manifest_has_10_scenarios', Array.isArray(manifest.requiredScenarioKeys) && manifest.requiredScenarioKeys.length === 10, String(manifest.requiredScenarioKeys?.length), 'manifests/payment/payfast-sandbox-proof-v1.json');
  } catch (error) {
    check('manifest_json_parse', false, error instanceof Error ? error.message : 'parse failed', 'manifests/payment/payfast-sandbox-proof-v1.json');
  }
}

const passed = failures.length === 0;
const report = {
  schema: 'kingsmen.payment-validator.v1',
  module: 'PAYMENTS - PayFast Sandbox Proof',
  status: passed ? 'PAYFAST_SANDBOX_PROOF_VALIDATED' : 'PAYFAST_SANDBOX_PROOF_VALIDATION_FAILED',
  passed,
  productionReady: false,
  payfastEnvironment: 'sandbox',
  livePaymentsEnabled: false,
  candidateCharged: false,
  totalChecks: checks.length,
  failedChecks: failures.length,
  checks,
  failures,
  generatedAtIso: new Date().toISOString(),
  nextAction: passed
    ? 'Run npm run payments:prove:sandbox, then perform real PayFast sandbox checkout against staging notify URL before taking money.'
    : 'Repair failed PayFast sandbox proof checks.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exit(1);
