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

requireFile('apps/web/src/app/candidate/payment-status/page.tsx', [
  'CandidatePaymentStatusPanel',
  'Payment and package access',
  'backend finance ledger'
]);

requireFile('docs/candidate/KINGSMEN_CANDIDATE_PAYMENT_STATUS.md', [
  'Production ready: **false**',
  '/candidate/payment-status',
  'pending',
  'paid',
  'active',
  'blocked',
  'Browser return cannot activate a Kingsmen package',
  'Fetch `/api/payments/payfast/status/:merchantReference` from the backend'
]);

requireFile('package.json', [
  'payments:validate:candidate-status'
]);

const panel = read('apps/web/src/finance/CandidatePaymentStatusPanel.tsx') ?? '';
if (panel.includes('PAYFAST_MERCHANT_KEY') || panel.includes('PAYFAST_PASSPHRASE')) {
  failures.push('Candidate payment status UI must not expose PayFast credential names.');
}
if (!panel.includes('status?: PaymentStatus')) {
  failures.push('Candidate payment status panel must accept a status prop for backend mapping.');
}
if (!panel.includes('evidenceRef?: string')) {
  failures.push('Candidate payment status panel must support showing evidence reference when available.');
}

const report = {
  validator: 'validate-candidate-payment-status',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/web/src/finance/CandidatePaymentStatusPanel.tsx',
    'apps/web/src/app/candidate/payment-status/page.tsx',
    'docs/candidate/KINGSMEN_CANDIDATE_PAYMENT_STATUS.md',
    'package.json'
  ],
  doctrine: {
    candidateCanSeePaymentAndPackageStatus: true,
    returnPageCannotActivatePackage: true,
    cancelPageCannotActivatePackage: true,
    activeStatusRequiresEvidenceEntitlement: true,
    noProviderSecretsInUi: true,
    backendStatusFetchStillRequiredForProduction: true
  }
};

const reportPath = relative('reports/finance/candidate-payment-status-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'CANDIDATE_PAYMENT_STATUS_VALIDATED' : 'CANDIDATE_PAYMENT_STATUS_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
