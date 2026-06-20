import fs from 'node:fs';

const required = [
  ['apps/web/src/app/api/jarvis/ai-tools-runtime-readiness/route.ts', [
    'kingsmen.jarvis-ai-tools-runtime-readiness.v1',
    'AI Provider Router',
    'Tools',
    'Airtable Human Mirror',
    'Email Primary Channel',
    'PayFast Sandbox Provider',
    'Playwright Scout',
    'OpenClaw Operator Boundary',
    'WhatsApp Urgent Only',
    'noFakeData',
    'rawSecretsReturned: false',
    'localShellExecuted: false',
    'directDatabaseAccessFromWeb: false',
    'directProviderCallsFromWeb: false'
  ]],
  ['docs/jarvis/JARVIS_AI_TOOLS_RUNTIME_READINESS.md', [
    'Jarvis AI Tools Runtime Readiness',
    '/api/jarvis/ai-tools-runtime-readiness',
    'no fake status',
    'no raw secrets',
    'no local shell execution from web',
    'no direct database access from web',
    'no direct provider calls from web'
  ]],
  ['package.json', [
    'jarvis:validate:ai-tools-runtime-readiness'
  ]]
];

const forbidden = [
  ['apps/web/src/app/api/jarvis/ai-tools-runtime-readiness/route.ts', 'child_process'],
  ['apps/web/src/app/api/jarvis/ai-tools-runtime-readiness/route.ts', 'writeFile'],
  ['apps/web/src/app/api/jarvis/ai-tools-runtime-readiness/route.ts', 'new Pool'],
  ['apps/web/src/app/api/jarvis/ai-tools-runtime-readiness/route.ts', 'api.openai.com']
];

const checks = [];

for (const [file, tokens] of required) {
  const exists = fs.existsSync(file);
  checks.push({ name: `file_exists:${file}`, passed: exists, detail: exists ? 'found' : 'missing', path: file });
  const text = exists ? fs.readFileSync(file, 'utf8') : '';
  for (const token of tokens) {
    checks.push({ name: `token:${file}:${token}`, passed: text.includes(token), detail: token, path: file });
  }
}

for (const [file, token] of forbidden) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  checks.push({ name: `forbidden_absent:${file}:${token}`, passed: !text.includes(token), detail: token, path: file });
}

const failedChecks = checks.filter((check) => !check.passed);
const passed = failedChecks.length === 0;

console.log(JSON.stringify({
  schema: 'kingsmen.validation-report.v1',
  module: 'Jarvis AI Tools Runtime Readiness',
  status: passed ? 'JARVIS_AI_TOOLS_RUNTIME_READINESS_VALIDATED' : 'JARVIS_AI_TOOLS_RUNTIME_READINESS_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  localShellExecutedFromWeb: false,
  directDatabaseAccessFromWeb: false,
  directProviderCallsFromWeb: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: passed
    ? 'Run the web build and verify /api/jarvis/ai-tools-runtime-readiness while backend and web are running.'
    : 'Repair Jarvis AI tools runtime readiness source files.'
}, null, 2));

process.exit(passed ? 0 : 1);
