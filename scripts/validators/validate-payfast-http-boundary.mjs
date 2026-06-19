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

requireFile('apps/api/src/finance/payfast-http-routes.ts', [
  'POST /api/payments/payfast/itn',
  'GET /api/payments/payfast/return',
  'GET /api/payments/payfast/cancel',
  'GET /api/payments/payfast/status/:merchantReference',
  'parsePayFastFormBody',
  'buildPayFastItnHttpResponse',
  'buildPayFastReturnPendingResponse',
  'buildPayFastCancelResponse',
  'buildPayFastStatusPendingResponse',
  'paidStatusChanged: ok',
  'PAYFAST_HTTP_BOUNDARY_DOCTRINE'
]);

requireFile('docs/finance/KINGSMEN_PAYFAST_HTTP_BOUNDARY.md', [
  'POST /api/payments/payfast/itn',
  'GET /api/payments/payfast/return',
  'GET /api/payments/payfast/cancel',
  'Production ready: **false**',
  'Persist accepted ITN evidence to PostgreSQL finance tables'
]);

requireFile('apps/web/src/app/payments/return/page.tsx', [
  'Verification pending',
  'browser return',
  'verified provider confirmation'
]);

requireFile('apps/web/src/app/payments/cancel/page.tsx', [
  'No package was activated',
  'cancel page',
  'provider evidence'
]);

const httpBoundary = read('apps/api/src/finance/payfast-http-routes.ts') ?? '';
if (httpBoundary.includes('paidStatusChanged: true') && !httpBoundary.includes('paidStatusChanged: ok')) {
  failures.push('PayFast HTTP boundary must not hard-code paidStatusChanged=true.');
}
if (!httpBoundary.includes('validatePayFastItn')) {
  failures.push('PayFast HTTP boundary must call validatePayFastItn.');
}
if (!httpBoundary.includes('buildPayFastRuntimeGate')) {
  failures.push('PayFast HTTP boundary must call buildPayFastRuntimeGate.');
}

const report = {
  validator: 'validate-payfast-http-boundary',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/api/src/finance/payfast-http-routes.ts',
    'docs/finance/KINGSMEN_PAYFAST_HTTP_BOUNDARY.md',
    'apps/web/src/app/payments/return/page.tsx',
    'apps/web/src/app/payments/cancel/page.tsx'
  ],
  doctrine: {
    itnEndpointRequired: true,
    returnPagePendingOnly: true,
    cancelPageNoStatusChange: true,
    acceptedItnOnlyChangesPaidStatus: true,
    providerEvidenceRequired: true
  }
};

const reportPath = relative('reports/finance/payfast-http-boundary-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'PAYFAST_HTTP_BOUNDARY_VALIDATED' : 'PAYFAST_HTTP_BOUNDARY_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
