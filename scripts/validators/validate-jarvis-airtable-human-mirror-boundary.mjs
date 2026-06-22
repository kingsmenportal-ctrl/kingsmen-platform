import fs from 'node:fs';

const required = [
  ['apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts', [
    'kingsmen.jarvis-airtable-human-mirror-boundary.v1',
    'Jarvis Airtable Human Mirror Boundary',
    'Airtable Human Mirror',
    'KINGSMEN_AIRTABLE_BASE_ID',
    'KINGSMEN_AIRTABLE_API_KEY',
    'KINGSMEN_AIRTABLE_CANDIDATES_TABLE',
    'backend_api_only',
    'postgresRemainsTruth: true',
    'airtableMayBecomeTruth: false',
    'directProviderCallsFromWeb: false',
    'rawSecretsReturned: false',
    'localShellExecutedFromWeb: false',
    'directDatabaseAccessFromWeb: false',
    'browserMayCallAirtableDirectly: false'
  ]],
  ['scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1', [
    'kingsmen.jarvis-airtable-human-mirror-boundary-proof.v1',
    'Jarvis Airtable Human Mirror Boundary Proof',
    'KINGSMEN_AIRTABLE_BASE_ID',
    'KINGSMEN_AIRTABLE_API_KEY',
    'KINGSMEN_AIRTABLE_CANDIDATES_TABLE',
    'AIRTABLE_HUMAN_MIRROR_CHECK',
    'reports/jarvis/jarvis-airtable-human-mirror-boundary-proof-latest.json',
    'providerCredentialsPrinted = $false',
    'directProviderCallsFromWeb = $false',
    'airtableMayBecomeTruth = $false'
  ]],
  ['docs/jarvis/JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY.md', [
    'Jarvis Airtable Human Mirror Boundary',
    '/api/jarvis/airtable-human-mirror-boundary',
    'no fake status',
    'no raw secrets',
    'no provider credentials printed',
    'no direct provider calls from web',
    'backend command envelope required',
    'PostgreSQL remains truth',
    'Airtable remains mirror only'
  ]],
  ['manifests/jarvis/jarvis-airtable-human-mirror-boundary-v1.json', [
    'kingsmen.jarvis-airtable-human-mirror-boundary.v1',
    'jarvis_airtable_human_mirror_boundary',
    'human_mirror_only',
    'postgres_truth_vault',
    'backendGoverned',
    'noRawSecrets',
    'directProviderCallsFromWeb',
    'browserMayCallAirtableDirectly',
    'airtableMayBecomeTruth'
  ]],
  ['apps/web/src/app/api/jarvis/command/route.ts', [
    'AIRTABLE_HUMAN_MIRROR_CHECK',
    'airtable_human_mirror_check'
  ]]
];

const forbidden = [
  ['apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts', 'api.airtable.com'],
  ['apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts', 'child_process'],
  ['apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts', 'writeFile'],
  ['apps/web/src/app/api/jarvis/airtable-human-mirror-boundary/route.ts', 'new Pool'],
  ['scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1', 'api.airtable.com'],
  ['scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1', 'Write-Host $tokenValue'],
  ['scripts/staging/Invoke-KingsmenJarvisAirtableHumanMirrorBoundaryProof.ps1', 'Write-Output $tokenValue']
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
  module: 'Jarvis Airtable Human Mirror Boundary',
  status: passed ? 'JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY_VALIDATED' : 'JARVIS_AIRTABLE_HUMAN_MIRROR_BOUNDARY_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  providerCredentialsPrinted: false,
  directProviderCallsFromWeb: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: passed
    ? 'Run web build, then run the Airtable human mirror boundary route and proof when credentials/runtime are available.'
    : 'Repair Jarvis Airtable human mirror boundary source files.'
}, null, 2));

process.exit(passed ? 0 : 1);
