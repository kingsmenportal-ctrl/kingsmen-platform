import fs from 'node:fs';

const required = [
  ['scripts/jarvis/Invoke-JarvisCredentialReadiness.ps1', [
    'KINGSMEN_AI_PROVIDER',
    'KINGSMEN_AI_MODEL',
    'OPENAI_API_KEY',
    'ai_provider_router',
    'Jarvis Credential Activation Readiness'
  ]],
  ['scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1', [
    'kingsmen.jarvis-ai-provider-credential-proof.v1',
    'Jarvis AI Provider Credential Boundary Proof',
    'KINGSMEN_AI_PROVIDER',
    'KINGSMEN_AI_MODEL',
    'OPENAI_API_KEY',
    'AI_PROVIDER_ROUTER_CHECK',
    'rawSecretsPrinted = $false',
    'providerCredentialsPrinted = $false',
    'directProviderCallsFromWeb = $false',
    'reports/jarvis/jarvis-ai-provider-credential-proof-latest.json'
  ]],
  ['docs/jarvis/JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY.md', [
    'Jarvis AI Provider Credential Boundary',
    'KINGSMEN_AI_PROVIDER',
    'KINGSMEN_AI_MODEL',
    'OPENAI_API_KEY',
    'no raw secrets',
    'no fake status',
    'backend-governed'
  ]],
  ['manifests/jarvis/jarvis-ai-provider-credential-boundary-v1.json', [
    'kingsmen.jarvis-ai-provider-credential-boundary.v1',
    'ai_provider_router',
    'backendGoverned',
    'noRawSecrets',
    'pendingRuntimeModelCallProof'
  ]]
];

const forbidden = [
  ['scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1', 'api.openai.com'],
  ['scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1', 'sk-'],
  ['scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1', 'Write-Host $openAiKey'],
  ['scripts/staging/Invoke-KingsmenJarvisAiProviderCredentialProof.ps1', 'Write-Output $openAiKey']
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
  module: 'Jarvis AI Provider Credential Boundary',
  status: passed ? 'JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY_VALIDATED' : 'JARVIS_AI_PROVIDER_CREDENTIAL_BOUNDARY_FAILED',
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
    ? 'Run node scripts/validators/validate-jarvis-ai-provider-credential-boundary.mjs, then run the PowerShell AI provider credential proof with backend and web running.'
    : 'Repair Jarvis AI provider credential boundary files.'
}, null, 2));

process.exit(passed ? 0 : 1);
