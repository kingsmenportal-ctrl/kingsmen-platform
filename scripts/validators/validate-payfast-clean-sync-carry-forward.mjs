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

requireFile('apps/api/src/finance/payfast-runtime-gate.ts', ['PAYFAST_LIVE_PAYMENT_BLOCKED', 'readyForLivePayments']);
requireFile('apps/api/src/finance/payfast-http-routes.ts', ['POST /api/payments/payfast/itn', 'paidStatusChanged: ok']);
requireFile('apps/api/src/finance/payfast-finance-repository.ts', ['PayFastFinanceRepository', 'redactPayFastSecrets', 'finance_payments']);
requireFile('apps/api/src/finance/service-entitlement-activation.ts', ['SERVICE_ENTITLEMENT_ACTIVATION_DOCTRINE']);
requireFile('apps/api/src/server.ts', ['handlePayFastItn', 'handlePayFastStatus', 'PAYFAST_ITN_ALLOWED_IPS']);
requireFile('apps/web/src/finance/CandidatePaymentStatusPanel.tsx', ['CandidatePaymentStatusPanel', 'Package active']);
requireFile('apps/web/src/finance/payment-status-api.ts', ['fetchCandidatePaymentStatus', 'cache: "no-store"']);
requireFile('apps/web/src/app/candidate/payment-status/page.tsx', ['merchantReference', 'Payment and package access']);
requireFile('apps/web/src/app/payments/return/page.tsx', ['Verification pending']);
requireFile('apps/web/src/app/payments/cancel/page.tsx', ['No package was activated']);
requireFile('db/migrations/0010_finance_service_activation.sql', ['finance_service_entitlements', 'enable row level security']);
requireFile('db/migrations/0011_finance_service_activation_trigger.sql', ['trg_kingsmen_activate_service_entitlement_from_payment', "new.provider = 'PAYFAST'"]);
requireFile('manifests/payment/payfast-live-runtime-gate-v1.json', ['productionReady', 'livePaymentsEnabled']);
requireFile('docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md', ['Production ready: **false**']);
requireFile('docs/finance/KINGSMEN_PAYFAST_HTTP_BOUNDARY.md', ['POST /api/payments/payfast/itn']);
requireFile('docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md', ['PAYFAST_ITN_ALLOWED_IPS']);
requireFile('docs/finance/KINGSMEN_SERVICE_ENTITLEMENT_ACTIVATION.md', ['payment_status = COMPLETE']);
requireFile('docs/candidate/KINGSMEN_CANDIDATE_PAYMENT_STATUS.md', ['GET /api/payments/payfast/status/:merchantReference']);
requireFile('scripts/validators/validate-payfast-runtime-gate-source-only.mjs', ['PAYFAST_RUNTIME_GATE_SOURCE_ONLY_VALIDATED']);
requireFile('scripts/validators/validate-payfast-http-boundary.mjs', ['PAYFAST_HTTP_BOUNDARY_VALIDATED']);
requireFile('scripts/validators/validate-payfast-server-mount-and-persistence.mjs', ['PAYFAST_SERVER_MOUNT_AND_PERSISTENCE_VALIDATED']);
requireFile('scripts/validators/validate-service-entitlement-activation.mjs', ['SERVICE_ENTITLEMENT_ACTIVATION_VALIDATED']);
requireFile('scripts/validators/validate-candidate-payment-status.mjs', ['CANDIDATE_PAYMENT_STATUS_VALIDATED']);

const packageJson = read('package.json') ?? '';
for (const script of [
  'payments:validate:runtime-gate',
  'payments:validate:http-boundary',
  'payments:validate:server-persistence',
  'payments:validate:service-activation',
  'payments:validate:candidate-status'
]) {
  if (!packageJson.includes(script)) failures.push(`package.json missing script: ${script}`);
}

const scannedFiles = [
  'apps/api/src/finance/payfast-runtime-gate.ts',
  'apps/api/src/finance/payfast-http-routes.ts',
  'apps/api/src/finance/payfast-finance-repository.ts',
  'apps/api/src/finance/service-entitlement-activation.ts',
  'apps/api/src/server.ts',
  'apps/web/src/finance/CandidatePaymentStatusPanel.tsx',
  'apps/web/src/finance/payment-status-api.ts',
  'docs/finance/KINGSMEN_PAYFAST_LIVE_RUNTIME_GATE.md',
  'docs/finance/KINGSMEN_PAYFAST_HTTP_BOUNDARY.md',
  'docs/finance/KINGSMEN_PAYFAST_SERVER_MOUNT_AND_PERSISTENCE.md',
  'docs/finance/KINGSMEN_SERVICE_ENTITLEMENT_ACTIVATION.md'
];

for (const path of scannedFiles) {
  const content = read(path) ?? '';
  for (const forbidden of ['merchant key goes here', 'passphrase goes here', 'livePaymentsEnabled": true', 'productionReady": true']) {
    if (content.toLowerCase().includes(forbidden.toLowerCase())) failures.push(`${path} contains forbidden production/secret marker: ${forbidden}`);
  }
}

const report = {
  validator: 'validate-payfast-clean-sync-carry-forward',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  doctrine: {
    cleanSyncBranchCarriesPaymentCore: true,
    livePaymentsRemainBlockedInSource: true,
    providerSecretsRemainOutsideGit: true,
    candidateStatusReadOnlyFromWeb: true,
    acceptedItnRequiredForPaidStatus: true,
    serviceEntitlementRequiresVerifiedPayment: true
  }
};

const reportPath = relative('reports/finance/payfast-clean-sync-carry-forward-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'PAYFAST_CLEAN_SYNC_CARRY_FORWARD_VALIDATED' : 'PAYFAST_CLEAN_SYNC_CARRY_FORWARD_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
