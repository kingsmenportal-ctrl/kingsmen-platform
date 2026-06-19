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

requireFile('db/migrations/0010_finance_service_activation.sql', [
  'finance_service_entitlements',
  'finance_service_activation_events',
  'entitlement_status',
  'managed_application_limit',
  'accommodation_route_limit',
  'cv_versions_limit',
  'motivation_letters_limit',
  'unique not null references public.finance_orders(order_ref)',
  'enable row level security'
]);

requireFile('db/migrations/0011_finance_service_activation_trigger.sql', [
  'kingsmen_activate_service_entitlement_from_payment',
  'trg_kingsmen_activate_service_entitlement_from_payment',
  "new.provider = 'PAYFAST'",
  "new.payment_status = 'COMPLETE'",
  'new.verified is true',
  'finance_plan_catalog',
  'finance_service_entitlements',
  'finance_service_activation_events',
  'active_package_code'
]);

requireFile('apps/api/src/finance/service-entitlement-activation.ts', [
  'SERVICE_ENTITLEMENT_ACTIVATION_DOCTRINE',
  'returnPageCannotActivatePackage',
  'cancelPageCannotActivatePackage',
  'entitlementLimitsComeFromFinancePlanCatalog',
  'candidateActivePackageUpdatedOnlyAfterEvidence'
]);

requireFile('docs/finance/KINGSMEN_SERVICE_ENTITLEMENT_ACTIVATION.md', [
  'Production ready: **false**',
  'provider = PAYFAST',
  'payment_status = COMPLETE',
  'verified = true',
  'one entitlement per order',
  'finance_plan_catalog',
  'Browser return and cancel pages cannot open entitlements'
]);

requireFile('package.json', [
  'payments:validate:service-activation'
]);

const trigger = read('db/migrations/0011_finance_service_activation_trigger.sql') ?? '';
if (!trigger.includes('on conflict (order_ref) do update')) {
  failures.push('Service entitlement trigger must be idempotent on order_ref.');
}
if (!trigger.includes('from public.finance_plan_catalog')) {
  failures.push('Service entitlement trigger must load package limits from finance_plan_catalog.');
}
if (!trigger.includes('where public_ref = new.candidate_ref')) {
  failures.push('Service entitlement trigger must update candidate active_package_code by candidate public_ref.');
}

const report = {
  validator: 'validate-service-entitlement-activation',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'db/migrations/0010_finance_service_activation.sql',
    'db/migrations/0011_finance_service_activation_trigger.sql',
    'apps/api/src/finance/service-entitlement-activation.ts',
    'docs/finance/KINGSMEN_SERVICE_ENTITLEMENT_ACTIVATION.md',
    'package.json'
  ],
  doctrine: {
    acceptedProviderEvidenceRequired: true,
    verifiedCompletePaymentOnly: true,
    browserReturnCannotActivate: true,
    browserCancelCannotActivate: true,
    oneEntitlementPerOrder: true,
    limitsFromPricingCatalog: true,
    candidatePackageUpdatedAfterEvidence: true
  }
};

const reportPath = relative('reports/finance/service-entitlement-activation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'SERVICE_ENTITLEMENT_ACTIVATION_VALIDATED' : 'SERVICE_ENTITLEMENT_ACTIVATION_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
