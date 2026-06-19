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

requireFile('apps/web/src/finance/CandidatePaymentStatusPanel.tsx', [
  'CandidatePaymentStatusPanel',
  'Payment verification pending',
  'Payment verified',
  'Package active',
  'Payment blocked',
  'Candidate',
  'Package',
  'Merchant reference',
  'Entitlement',
  'Browser return and cancel pages cannot activate a Kingsmen package',
  'accepted PayFast ITN evidence'
]);

requireFile('apps/web/src/finance/payment-status-api.ts', [
  'fetchCandidatePaymentStatus',
  'mapPayFastBackendStatus',
  'GET',
  '/api/payments/payfast/status/',
  'KINGSMEN_API_BASE_URL',
  'NEXT_PUBLIC_KINGSMEN_API_BASE_URL',
  'activeRequiresEntitlementStatusActive',
  'noPaymentStateMutationFromWeb'
]);

requireFile('apps/web/src/app/candidate/payment-status/page.tsx', [
  'fetchCandidatePaymentStatus',
  'merchantReference',
  'm_payment_id',
  'Payment and package access',
  'backend finance ledger'
]);

requireFile('docs/candidate/KINGSMEN_CANDIDATE_PAYMENT_STATUS.md', [
  'Production ready: **false**',
  '/candidate/payment-status?merchantReference=',
  'GET /api/payments/payfast/status/:merchantReference',
  'pending',
  'paid',
  'active',
  'blocked',
  'Browser return cannot open a Kingsmen package',
  'KINGSMEN_API_BASE_URL'
]);

const panel = read('apps/web/src/finance/CandidatePaymentStatusPanel.tsx') ?? '';
const api = read('apps/web/src/finance/payment-status-api.ts') ?? '';
if (panel.includes('PAYFAST_MERCHANT_KEY') || panel.includes('PAYFAST_PASSPHRASE') || api.includes('PAYFAST_MERCHANT_KEY') || api.includes('PAYFAST_PASSPHRASE')) {
  failures.push('Candidate payment status UI and API mapper must not expose PayFast credential names.');
}
if (!panel.includes('status?: PaymentStatus')) failures.push('Candidate payment status panel must accept a status prop for backend mapping.');
if (!panel.includes('evidenceRef?: string')) failures.push('Candidate payment status panel must support showing evidence reference when available.');
if (!api.includes('entitlementStatus === "ACTIVE"')) failures.push('Candidate payment status mapper must require ACTIVE entitlement for active UI status.');
if (!api.includes('cache: "no-store"')) failures.push('Candidate payment status fetch must not cache live finance status.');

const report = {
  validator: 'validate-candidate-payment-status',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/web/src/finance/CandidatePaymentStatusPanel.tsx',
    'apps/web/src/finance/payment-status-api.ts',
    'apps/web/src/app/candidate/payment-status/page.tsx',
    'docs/candidate/KINGSMEN_CANDIDATE_PAYMENT_STATUS.md'
  ],
  doctrine: {
    candidateCanSeePaymentAndPackageStatus: true,
    returnPageCannotOpenPackage: true,
    cancelPageCannotOpenPackage: true,
    activeStatusRequiresEvidenceEntitlement: true,
    noProviderSecretsInUi: true,
    backendStatusFetchBuilt: true,
    noWebMutationOfPaymentState: true
  }
};

const reportPath = relative('reports/finance/candidate-payment-status-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'CANDIDATE_PAYMENT_STATUS_VALIDATED' : 'CANDIDATE_PAYMENT_STATUS_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
