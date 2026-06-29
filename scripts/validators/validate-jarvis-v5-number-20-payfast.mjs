import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md', [
    'NUMBER 20 — WHEN THE COMMANDER ASKS ABOUT PAYFAST',
    'Paid execution must remain locked',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md'
  ]],
  ['packages/jarvis-core/src/payfast-payment-boundary.ts', [
    'jarvisAssessPayFastPaymentRequest',
    'PAYFAST_PAYMENT_PROVIDER_BOUNDARY',
    'payment_provider_not_finance_truth_by_itself',
    'checkout_intent_must_not_be_treated_as_payment_success',
    'payfast_boundary_built_not_provider_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/payfast/route.ts', [
    'PAYFAST_PAYMENT_PROVIDER_BOUNDARY',
    'paidExecutionLockedUntilProof',
    'route_built_not_payment_provider_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisPayFastPaymentPanel.tsx', [
    'JarvisPayFastPaymentPanel',
    'PAYFAST PAYMENT PROVIDER',
    'Runtime proof not captured yet',
    'Provider confirmation, backend payment state, and evidence ledger proof'
  ]]
]);

function fail(message) { throw new Error(message); }
function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];
for (const [file, tokens] of required.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) fail(`Required token not found in ${file}: ${token}`);
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const route = read('apps/web/src/app/api/jarvis/payfast/route.ts');
const boundary = read('packages/jarvis-core/src/payfast-payment-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 20 must not claim provider runtime or production proof from repo files.');
}
if (boundary.includes('paidExecutionLocked: false') && boundary.includes('policyStatus !==')) {
  fail('Number 20 must keep paid execution locked unless verified proof and policy allow it.');
}

const report = {
  validator: 'validate-jarvis-v5-number-20-payfast',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    payfastIsPaymentProviderOnly: true,
    paidExecutionLockedUntilProof: true,
    checkoutIntentIsNotPaymentSuccess: true,
    providerConfirmationRequired: true,
    backendPaymentStateAndEvidenceRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-20-payfast-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_20_PAYFAST_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
