import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const failures = [];

function relative(path) {
  return join(repoRoot, path);
}

function read(path) {
  const full = relative(path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function requireFile(path, tokens = []) {
  const content = read(path);
  if (content === null) {
    failures.push(`Missing file: ${path}`);
    return;
  }
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${path} missing token: ${token}`);
  }
}

requireFile('apps/api/src/finance/payfast-runtime-gate.ts', [
  'PAYFAST_ACCOUNT_VERIFIED',
  'PAYFAST_SANDBOX_ITN_PROOF_REVIEWED',
  'PAYFAST_FOUNDER_PAYMENT_APPROVAL',
  'readyForSandboxCheckout',
  'readyForLivePayments',
  'PAYFAST_LIVE_PAYMENT_BLOCKED',
  'acceptedItnRequiredForPaidStatus',
  'rawSecretsAreNeverReturned',
  'payfastAccountVerificationRequiredForLive',
  'sandboxItnProofRequiredForLive',
  'founderApprovalRequiredForLive'
]);

requireFile('manifests/payment/payfast-live-runtime-gate-v1.json', [
  'kingsmen.payfast-live-runtime-gate.v1',
  'productionReady',
  'livePaymentsEnabled',
  'PAYFAST_MERCHANT_ID',
  'PAYFAST_MERCHANT_KEY',
  'PAYFAST_NOTIFY_URL',
  'acceptedItnRequiredForPaidStatus',
  'payfastAccountVerificationRequiredForLive',
  'sandboxItnProofRequiredForLive',
  'founderApprovalRequiredForLive'
]);

requireFile('docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md', [
  'Production ready: **false**',
  'PayFast account verification',
  'PAYFAST_ACCOUNT_VERIFIED=true',
  'PAYFAST_SANDBOX_ITN_PROOF_REVIEWED=true',
  'PAYFAST_FOUNDER_PAYMENT_APPROVAL=true',
  'return URL is not proof of payment',
  'accepted ITN'
]);

const manifest = JSON.parse(read('manifests/payment/payfast-live-runtime-gate-v1.json') ?? '{}');
if (manifest.productionReady !== false) failures.push('PayFast live runtime manifest must remain productionReady=false until real provider evidence passes.');
if (manifest.livePaymentsEnabled !== false) failures.push('PayFast live runtime manifest must keep livePaymentsEnabled=false at source level.');

const report = {
  validator: 'validate-payfast-runtime-gate',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/api/src/finance/payfast-runtime-gate.ts',
    'manifests/payment/payfast-live-runtime-gate-v1.json',
    'docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md'
  ],
  doctrine: {
    returnUrlIsNotProofOfPayment: true,
    cancelUrlCannotMarkPaid: true,
    acceptedItnRequiredForPaidStatus: true,
    providerVerificationRequiredForLive: true,
    founderApprovalRequiredForLive: true,
    rawCredentialsMustStayOutsideSource: true
  }
};

const reportPath = relative('reports/finance/payfast-runtime-gate-source-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'PAYFAST_RUNTIME_GATE_VALIDATED' : 'PAYFAST_RUNTIME_GATE_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
