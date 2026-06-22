import fs from 'node:fs';

const required = [
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', [
    'kingsmen.jarvis-email-primary-channel-boundary.v1',
    'Jarvis Email Primary Channel Boundary',
    'Email Primary Channel',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'backend_api_only',
    'emailPrimaryChannel: true',
    'whatsappBulkAllowed: false',
    'smsBackupOnly: true',
    'directProviderCallsFromWeb: false',
    'rawSecretsReturned: false',
    'localShellExecutedFromWeb: false',
    'directDatabaseAccessFromWeb: false',
    'browserMaySendEmailDirectly: false'
  ]],
  ['scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1', [
    'kingsmen.jarvis-email-primary-channel-boundary-proof.v1',
    'Jarvis Email Primary Channel Boundary Proof',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'EMAIL_PRIMARY_CHANNEL_CHECK',
    'reports/jarvis/jarvis-email-primary-channel-boundary-proof-latest.json',
    'providerCredentialsPrinted = $false',
    'directProviderCallsFromWeb = $false',
    'whatsappBulkAllowed = $false'
  ]],
  ['docs/jarvis/JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY.md', [
    'Jarvis Email Primary Channel Boundary',
    '/api/jarvis/email-primary-channel-boundary',
    'no fake status',
    'no raw secrets',
    'no provider credentials printed',
    'no direct provider calls from web',
    'backend command envelope required',
    'Email remains primary channel',
    'WhatsApp urgent only',
    'SMS backup only'
  ]],
  ['manifests/jarvis/jarvis-email-primary-channel-boundary-v1.json', [
    'kingsmen.jarvis-email-primary-channel-boundary.v1',
    'jarvis_email_primary_channel_boundary',
    'emailPrimaryChannel',
    'whatsappUrgentOnly',
    'whatsappBulkAllowed',
    'smsBackupOnly',
    'backendGoverned',
    'postgres_truth_vault',
    'noRawSecrets',
    'directProviderCallsFromWeb',
    'browserMaySendEmailDirectly'
  ]],
  ['apps/web/src/app/api/jarvis/command/route.ts', [
    'EMAIL_PRIMARY_CHANNEL_CHECK',
    'email_primary_channel_check'
  ]]
];

const forbidden = [
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', 'nodemailer'],
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', 'smtp-connection'],
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', 'child_process'],
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', 'writeFile'],
  ['apps/web/src/app/api/jarvis/email-primary-channel-boundary/route.ts', 'new Pool'],
  ['scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1', 'Write-Host $env:SMTP_PASSWORD'],
  ['scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1', 'Write-Output $env:SMTP_PASSWORD'],
  ['scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1', 'Send-MailMessage'],
  ['scripts/staging/Invoke-KingsmenJarvisEmailPrimaryChannelBoundaryProof.ps1', 'System.Net.Mail.SmtpClient']
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
  module: 'Jarvis Email Primary Channel Boundary',
  status: passed ? 'JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY_VALIDATED' : 'JARVIS_EMAIL_PRIMARY_CHANNEL_BOUNDARY_FAILED',
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
    ? 'Run web build, then run the Email primary channel boundary route and proof when credentials/runtime are available.'
    : 'Repair Jarvis Email primary channel boundary source files.'
}, null, 2));

process.exit(passed ? 0 : 1);
