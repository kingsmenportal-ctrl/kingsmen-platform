import fs from 'node:fs';

const required = [
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', [
    'kingsmen.jarvis-whatsapp-urgent-sms-backup-boundary.v1',
    'Jarvis WhatsApp Urgent SMS Backup Boundary',
    'WhatsApp Urgent Only / SMS Backup Boundary',
    'KINGSMEN_WHATSAPP_BUSINESS_ACCOUNT_ID',
    'KINGSMEN_WHATSAPP_PHONE_NUMBER_ID',
    'KINGSMEN_WHATSAPP_ACCESS_TOKEN',
    'KINGSMEN_SMS_PROVIDER',
    'KINGSMEN_SMS_API_KEY',
    'backend_api_only',
    'emailPrimaryChannelRemains: true',
    'whatsappUrgentOnly: true',
    'whatsappBulkAllowed: false',
    'smsBackupOnly: true',
    'directProviderCallsFromWeb: false',
    'rawSecretsReturned: false',
    'localShellExecutedFromWeb: false',
    'directDatabaseAccessFromWeb: false',
    'browserMaySendWhatsAppDirectly: false',
    'browserMaySendSmsDirectly: false',
    'browserMayBulkMessageDirectly: false'
  ]],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', [
    'kingsmen.jarvis-whatsapp-urgent-sms-backup-boundary-proof.v1',
    'Jarvis WhatsApp Urgent SMS Backup Boundary Proof',
    'KINGSMEN_WHATSAPP_BUSINESS_ACCOUNT_ID',
    'KINGSMEN_WHATSAPP_PHONE_NUMBER_ID',
    'KINGSMEN_WHATSAPP_ACCESS_TOKEN',
    'KINGSMEN_SMS_PROVIDER',
    'KINGSMEN_SMS_API_KEY',
    'WHATSAPP_URGENT_SMS_BACKUP_CHECK',
    'reports/jarvis/jarvis-whatsapp-urgent-sms-backup-boundary-proof-latest.json',
    'providerCredentialsPrinted = $false',
    'directProviderCallsFromWeb = $false',
    'whatsappBulkAllowed = $false',
    'smsBackupOnly = $true'
  ]],
  ['docs/jarvis/JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY.md', [
    'Jarvis WhatsApp Urgent SMS Backup Boundary',
    '/api/jarvis/whatsapp-urgent-sms-backup-boundary',
    'no fake status',
    'no raw secrets',
    'no provider credentials printed',
    'no direct provider calls from web',
    'backend command envelope required',
    'Email remains primary channel',
    'WhatsApp urgent only',
    'WhatsApp bulk is not allowed',
    'SMS backup only',
    'PostgreSQL remains truth'
  ]],
  ['manifests/jarvis/jarvis-whatsapp-urgent-sms-backup-boundary-v1.json', [
    'kingsmen.jarvis-whatsapp-urgent-sms-backup-boundary.v1',
    'jarvis_whatsapp_urgent_sms_backup_boundary',
    'emailPrimaryChannel',
    'whatsappUrgentOnly',
    'whatsappBulkAllowed',
    'smsBackupOnly',
    'postgres_truth_vault',
    'backendGoverned',
    'backend_api_only',
    'noRawSecrets',
    'directProviderCallsFromWeb',
    'browserMaySendWhatsAppDirectly',
    'browserMaySendSmsDirectly',
    'browserMayBulkMessageDirectly'
  ]],
  ['apps/web/src/app/api/jarvis/command/route.ts', [
    'WHATSAPP_URGENT_SMS_BACKUP_CHECK',
    'whatsapp_urgent_sms_backup_check'
  ]],
  ['package.json', [
    'jarvis:validate:whatsapp-urgent-sms-backup',
    'jarvis:runtime:whatsapp-urgent-sms-backup'
  ]]
];

const forbidden = [
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', 'graph.facebook.com'],
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', 'api.twilio.com'],
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', 'child_process'],
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', 'writeFile'],
  ['apps/web/src/app/api/jarvis/whatsapp-urgent-sms-backup-boundary/route.ts', 'new Pool'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'graph.facebook.com'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'api.twilio.com'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'Write-Host $env:WHATSAPP_ACCESS_TOKEN'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'Write-Output $env:WHATSAPP_ACCESS_TOKEN'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'Write-Host $env:SMS_API_KEY'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'Write-Output $env:SMS_API_KEY'],
  ['scripts/staging/Invoke-KingsmenJarvisWhatsAppUrgentSmsBackupBoundaryProof.ps1', 'bulk']
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
  module: 'Jarvis WhatsApp Urgent SMS Backup Boundary',
  status: passed ? 'JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY_VALIDATED' : 'JARVIS_WHATSAPP_URGENT_SMS_BACKUP_BOUNDARY_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  noFakeData: true,
  rawSecretsReturned: false,
  providerCredentialsPrinted: false,
  directProviderCallsFromWeb: false,
  whatsappUrgentOnly: true,
  whatsappBulkAllowed: false,
  smsBackupOnly: true,
  generatedAtIso: new Date().toISOString(),
  checks,
  failedChecks,
  nextAction: passed
    ? 'Run web build, then run the WhatsApp urgent SMS backup boundary route and proof when credentials/runtime are available.'
    : 'Repair Jarvis WhatsApp urgent SMS backup boundary source files.'
}, null, 2));

process.exit(passed ? 0 : 1);
