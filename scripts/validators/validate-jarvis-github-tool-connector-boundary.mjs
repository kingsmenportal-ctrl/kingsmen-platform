import fs from 'node:fs';

const required = [
  ['apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts', [
    'kingsmen.jarvis-github-tool-connector-boundary.v1',
    'Jarvis GitHub Tool Connector Boundary',
    'GitHub Tool Connector',
    'KINGSMEN_GITHUB_REPOSITORY',
    'GITHUB_TOKEN',
    'GH_TOKEN',
    'backend_api_only',
    'directProviderCallsFromWeb: false',
    'rawSecretsReturned: false',
    'localShellExecutedFromWeb: false',
    'directDatabaseAccessFromWeb: false',
    'browserMayCallGitHubDirectly: false'
  ]],
  ['scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1', [
    'kingsmen.jarvis-github-tool-connector-boundary-proof.v1',
    'Jarvis GitHub Tool Connector Boundary Proof',
    'KINGSMEN_GITHUB_REPOSITORY',
    'GITHUB_REPOSITORY_FULL_NAME',
    'GITHUB_TOKEN',
    'GH_TOKEN',
    'GITHUB_TOOL_CONNECTOR_CHECK',
    'reports/jarvis/jarvis-github-tool-connector-boundary-proof-latest.json',
    'providerCredentialsPrinted = $false',
    'directProviderCallsFromWeb = $false'
  ]],
  ['docs/jarvis/JARVIS_GITHUB_TOOL_CONNECTOR_BOUNDARY.md', [
    'Jarvis GitHub Tool Connector Boundary',
    '/api/jarvis/github-tool-connector-boundary',
    'no fake status',
    'no raw secrets',
    'no provider credentials printed',
    'no direct provider calls from web',
    'backend command envelope required'
  ]],
  ['manifests/jarvis/jarvis-github-tool-connector-boundary-v1.json', [
    'kingsmen.jarvis-github-tool-connector-boundary.v1',
    'github_tool_connector',
    'backendGoverned',
    'noRawSecrets',
    'directProviderCallsFromWeb',
    'browserMayCallGitHubDirectly'
  ]],
  ['apps/web/src/app/api/jarvis/command/route.ts', [
    'GITHUB_TOOL_CONNECTOR_CHECK',
    'github_tool_connector_check'
  ]]
];

const forbidden = [
  ['apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts', 'api.github.com'],
  ['apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts', 'child_process'],
  ['apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts', 'writeFile'],
  ['apps/web/src/app/api/jarvis/github-tool-connector-boundary/route.ts', 'new Pool'],
  ['scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1', 'api.github.com'],
  ['scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1', 'Write-Host $tokenValue'],
  ['scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1', 'Write-Output $tokenValue'],
  ['scripts/staging/Invoke-KingsmenJarvisGitHubToolConnectorBoundaryProof.ps1', 'gh auth token']
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
  module: 'Jarvis GitHub Tool Connector Boundary',
  status: passed ? 'JARVIS_GITHUB_TOOL_CONNECTOR_BOUNDARY_VALIDATED' : 'JARVIS_GITHUB_TOOL_CONNECTOR_BOUNDARY_FAILED',
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
    ? 'Run web build, then run the GitHub connector boundary route and proof when credentials/runtime are available.'
    : 'Repair Jarvis GitHub tool connector boundary source files.'
}, null, 2));

process.exit(passed ? 0 : 1);
