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

requireFile('apps/api/src/founder/founder-control-plane-read-model.ts', [
  'buildFounderControlPlaneReadModel',
  'productionReady: false',
  'publicLaunchAllowed: false',
  'backendIsAuthority',
  'postgresIsTruth',
  'jarvisRole',
  'openclawRole',
  'Launch Gate',
  'Jarvis Build Queue',
  'Payment Proof Queue',
  'Document Vault Proof Queue',
  'Communications Proof Queue',
  'Founder Review Queue',
  'npm run kingsmen:launch:gate'
]);

requireFile('apps/api/src/founder/founder-control-plane-route.ts', [
  'GET /api/founder/control-plane',
  'buildFounderControlPlaneHttpResponse',
  'noSecretsReturned',
  'launchBlockersMustRemainVisible'
]);

requireFile('apps/web/src/founder/founder-control-plane-client.ts', [
  'fetchFounderControlPlane',
  'KINGSMEN_API_BASE_URL',
  'NEXT_PUBLIC_KINGSMEN_API_BASE_URL',
  '/api/founder/control-plane',
  'cache: "no-store"',
  'FALLBACK_FOUNDER_CONTROL_PLANE',
  'noLocalTruthMutation',
  'noSecretsDisplayed'
]);

requireFile('apps/web/src/founder/FounderControlPlane.tsx', [
  'FounderControlPlane',
  'Kingsmen + Jarvis operating status',
  'Public launch blocked',
  'Authority doctrine',
  'N00-N20 module status',
  'Launch blockers',
  'Validator commands'
]);

requireFile('apps/web/src/app/founder/control-plane/page.tsx', [
  'fetchFounderControlPlane',
  'FounderControlPlane'
]);

requireFile('docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md', [
  'Production ready: **false**',
  '/founder/control-plane',
  'GET /api/founder/control-plane',
  'N00-N20 module status',
  'Jarvis brain-router',
  'OpenClaw operator',
  'Airtable mirror',
  'n8n thin relay',
  'Playwright scout',
  'npm run founder:validate:control-plane'
]);

requireFile('package.json', ['founder:validate:control-plane']);

const client = read('apps/web/src/founder/founder-control-plane-client.ts') ?? '';
const ui = read('apps/web/src/founder/FounderControlPlane.tsx') ?? '';
for (const forbidden of ['PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE', 'DATABASE_URL=', 'SMTP_PASSWORD=']) {
  if (client.includes(forbidden) || ui.includes(forbidden)) {
    failures.push(`Founder control plane must not expose secret marker: ${forbidden}`);
  }
}
if (!client.includes('cache: "no-store"')) failures.push('Founder control plane runtime fetch must not cache live status.');
if (!ui.includes('String(model.productionReady)')) failures.push('Founder UI must display productionReady status.');
if (!ui.includes('String(model.publicLaunchAllowed)')) failures.push('Founder UI must display publicLaunchAllowed status.');

const report = {
  validator: 'validate-founder-control-plane',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checkedFiles: [
    'apps/api/src/founder/founder-control-plane-read-model.ts',
    'apps/api/src/founder/founder-control-plane-route.ts',
    'apps/web/src/founder/founder-control-plane-client.ts',
    'apps/web/src/founder/FounderControlPlane.tsx',
    'apps/web/src/app/founder/control-plane/page.tsx',
    'docs/founder/KINGSMEN_FOUNDER_CONTROL_PLANE.md',
    'package.json'
  ],
  doctrine: {
    founderSeesAllSystemStatus: true,
    readOnlyControlPlane: true,
    noSecretsDisplayed: true,
    launchBlockersVisible: true,
    publicLaunchBlockedUntilGate: true,
    jarvisCannotBypassFounderApproval: true
  }
};

const reportPath = relative('reports/founder/founder-control-plane-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'FOUNDER_CONTROL_PLANE_VALIDATED' : 'FOUNDER_CONTROL_PLANE_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
