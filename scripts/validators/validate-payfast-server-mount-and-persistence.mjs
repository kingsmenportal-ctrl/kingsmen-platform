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

requireFile('apps/api/src/server.ts', [
  'PayFastFinanceRepository.fromEnvironment',
  'handlePayFastItn',
  'handlePayFastReturn',
  'handlePayFastCancel',
  'handlePayFastStatus',
  'POST /api/payments/payfast/itn',
  'GET /api/payments/payfast/return',
  'GET /api/payments/payfast/cancel',
  'GET /api/payments/payfast/status/:merchantReference',
  'findIntentExpectation',
  'recordItnResult',
  'isPayFastItnSourceVerified',
  'PAYFAST_ITN_SOURCE_VERIFIED',
  'PAYFAST_ITN_ALLOWED_IPS'
]);

requireFile('apps/api/src/finance/payfast-finance-repository.ts', [
  'class PayFastFinanceRepository',
  'KINGSMEN_FINANCE_MODE',
  'postgres_finance_truth',
  'findIntentExpectation',
  'hasItnReceipt',
  'readPaymentStatus',
  'recordItnResult',
  'payfast_itn_receipts',
  'finance_payments',
  'payment_evidence_ledger',
  'finance_ledger_entries',
  'Duplicate PayFast ITN ignored idempotently',
  'Rejected PayFast ITN persisted without changing paid status',
  'Accepted PayFast ITN persisted and finance truth updated'
]);

requireFile('db/migrations/0008_n10_finance_payfast.sql', [
  'finance_orders',
  'finance_invoices',
  'payfast_payment_intents',
  'finance_payments',
  'payfast_itn_receipts',
  'finance_ledger_entries',
  'payment_evidence_ledger'
]);

requireFile('docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md', [
  'POST /api/payments/payfast/itn',
  'PostgreSQL finance truth',
  'accepted ITN',
  'Rejected ITNs are persisted without changing paid status',
  'PAYFAST_ITN_ALLOWED_IPS',
  'Production ready: **false**'
]);

const server = read('apps/api/src/server.ts') ?? '';
if (server.includes('paidStatusChanged: true')) failures.push('server.ts must not hard-code paidStatusChanged=true.');
if (!server.includes('responseBody.ok ? 200 : 422')) failures.push('server.ts must reject failed ITN validation instead of always accepting it.');
if (!server.includes('findIntentExpectation(merchantReference)')) failures.push('server.ts must load expected amount/order from finance truth before validating ITN.');
if (!server.includes('recordItnResult({ validation: responseBody.validation, payload, expectation })')) failures.push('server.ts must persist ITN result through PayFastFinanceRepository.');

const repository = read('apps/api/src/finance/payfast-finance-repository.ts') ?? '';
for (const forbidden of ['merchant key goes here', 'passphrase goes here']) {
  if (repository.toLowerCase().includes(forbidden)) failures.push(`Repository contains forbidden phrase: ${forbidden}`);
}
if (!repository.includes('redactPayFastSecrets')) failures.push('Repository must redact PayFast payload before persistence.');

const report = {
  validator: 'validate-payfast-server-mount-and-persistence',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/api/src/server.ts',
    'apps/api/src/finance/payfast-finance-repository.ts',
    'db/migrations/0008_n10_finance_payfast.sql',
    'docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md'
  ],
  doctrine: {
    apiServerMountRequired: true,
    expectedAmountComesFromFinanceTruth: true,
    acceptedItnPersistsReceiptPaymentEvidenceLedgerAndStatus: true,
    rejectedItnCannotMarkPaid: true,
    duplicateItnIsIdempotent: true,
    sourceVerificationRequired: true,
    secretsRedactedBeforePersistence: true
  }
};

const reportPath = relative('reports/finance/payfast-server-mount-and-persistence-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'PAYFAST_SERVER_MOUNT_AND_PERSISTENCE_VALIDATED' : 'PAYFAST_SERVER_MOUNT_AND_PERSISTENCE_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
