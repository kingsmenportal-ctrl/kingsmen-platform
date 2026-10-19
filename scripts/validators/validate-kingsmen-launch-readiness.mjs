import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = new Set(process.argv.slice(2));
const gateMode = args.has('--gate');

function relative(path) {
  return join(repoRoot, path);
}

function read(path) {
  const full = relative(path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function json(path) {
  const content = read(path);
  if (!content) return null;
  return JSON.parse(content);
}

function checkFile(path, tokens = []) {
  const content = read(path);
  const missingTokens = content === null ? tokens : tokens.filter((token) => !content.includes(token));
  return {
    path,
    exists: content !== null,
    bytes: content?.length ?? 0,
    requiredTokens: tokens,
    missingTokens,
    passed: content !== null && missingTokens.length === 0
  };
}

const requiredFileChecks = [
  checkFile('README.md', ['PostgreSQL Truth Vault', 'n8n', 'email primary']),
  checkFile('package.json', [
    'kingsmen:launch:audit',
    'kingsmen:launch:gate',
    'api:validate:truth-vault',
    'web:validate:backend-boundary',
    'payments:prove:sandbox',
    'payments:validate:sandbox',
    'security:prove:rls',
    'security:validate:rls',
    'backup:prove:restore',
    'backup:validate:restore',
    'repo:prove:branch-protection',
    'repo:validate:branch-protection',
    'secrets:prove:wiring',
    'secrets:validate:wiring',
    'communications:prove',
    'communications:validate',
    'observability:prove',
    'observability:validate',
    'legal:prove',
    'legal:validate',
    'staging:prove:pack',
    'staging:validate:pack',
    'final:prove:evidence',
    'final:validate:evidence',
    'final:collect:evidence'
  ]),
  checkFile('.gitignore', ['.env', '.env.*', '!.env.example', '.local/backups', 'backups/', '*.dump', '*.backup']),
  checkFile('.env.example', ['DATABASE_URL=', 'REDIS_URL=', 'SMTP_PASSWORD=', 'PAYMENT_PROVIDER_SECRET=', 'STORAGE_ACCESS_KEY=']),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', ['requiredLaunchGates', 'publicLaunchStatus', 'main-branch-protection-v1', 'web_runtime_boundary', 'payfast-sandbox-proof-v1', 'rls-security-proof-v1', 'backup-restore-proof-v1', 'secrets_wiring', 'secrets-wiring-proof-v1', 'communications-proof-v1', 'observability-incident-proof-v1', 'legal-privacy-proof-v1', 'staging-runtime-proof-pack-v1', 'final-assembly-evidence-capture-v1', 'foundation_built_pending_final_evidence_capture_review']),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['Exact blockers', 'npm run kingsmen:launch:gate', 'npm run web:validate:backend-boundary', 'npm run payments:validate:sandbox', 'npm run security:validate:rls', 'npm run backup:validate:restore', 'npm run secrets:validate:wiring', 'npm run communications:validate', 'npm run observability:validate', 'npm run legal:validate', 'npm run staging:validate:pack', 'npm run final:validate:evidence']),
  checkFile('.github/workflows/kingsmen-source-guard.yml', ['name: Kingsmen Source Guard', 'source-guard', 'npm run backup:validate:restore', 'npm run secrets:validate:wiring', 'npm run communications:validate', 'npm run observability:validate', 'npm run legal:validate', 'npm run staging:validate:pack', 'npm run final:validate:evidence', 'npm run repo:validate:branch-protection', 'npm run kingsmen:launch:audit']),

  checkFile('apps/api/package.json', ['build', 'start']),
  checkFile('apps/api/src/server.ts', ['/health', '/api/commands', '/api/workflow-results']),
  checkFile('apps/api/src/db/truth-vault-repository.ts', ['KINGSMEN_TRUTH_VAULT_MODE', 'postgres_truth_vault', 'recordCommand', 'recordWorkflowResult']),
  checkFile('scripts/validators/validate-api-truth-vault-persistence.mjs', ['API Truth Vault Persistence', 'postgres_truth_vault']),

  checkFile('apps/web/src/lib/kingsmen-backend-client.ts', ['KINGSMEN_BACKEND_BASE_URL', 'backend_api_only', 'postKingsmenCommand']),
  checkFile('apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts', ['candidate.intake.received', 'web_to_backend_api_boundary', 'localWriteAttempted: false']),
  checkFile('apps/web/src/app/api/jarvis/status/route.ts', ['getKingsmenApiHealth', 'Backend API Boundary']),
  checkFile('apps/web/src/app/api/jarvis/command/route.ts', ['postKingsmenCommand', 'localShellExecuted: false']),
  checkFile('docs/web/KINGSMEN_SAFE_WEB_BACKEND_BOUNDARY.md', ['KINGSMEN_BACKEND_BASE_URL', 'proxy surface']),
  checkFile('scripts/validators/validate-safe-web-backend-boundary.mjs', ['SAFE_WEB_BACKEND_BOUNDARY_VALIDATED', 'KINGSMEN_BACKEND_BASE_URL']),

  checkFile('db/migrations/0001_n03_truth_vault.sql', ['CREATE TABLE IF NOT EXISTS candidates', 'ENABLE ROW LEVEL SECURITY']),
  checkFile('db/migrations/0009_rls_security_boundary.sql', ['current_runtime_role', 'is_backend_service_role', 'candidates_candidate_read_own', 'applications_candidate_read_own', 'evidence_ledger_candidate_read_own_safe', 'route_sources_public_verified_read']),
  checkFile('manifests/security/rls-security-proof-v1.json', ['rls-security-proof-v1', 'foundation_built_pending_staging_proof', 'serviceRoleRequiresBackendContext', 'candidateReadsOwnRowsOnly']),
  checkFile('docs/security/KINGSMEN_RLS_SECURITY_PROOF.md', ['app.kingsmen_role', 'app.service_context', 'staging proof']),
  checkFile('scripts/proof/prove-rls-security-boundary.mjs', ['RLS_SECURITY_SOURCE_PROOF_PASSED', 'candidate_cannot_read_other_candidate_row', 'service' + '_role_without_backend_context_denied']),
  checkFile('scripts/validators/validate-rls-security-proof.mjs', ['RLS_SECURITY_PROOF_VALIDATED', 'security:validate:rls']),

  checkFile('db/migrations/0008_n10_finance_payfast.sql', ['payfast_payment_intents', 'payfast_itn_receipts', 'payment_evidence_ledger']),
  checkFile('apps/api/src/finance/payfast-itn.ts', ['verifyPayFastSignature', 'expectedAmountCents', 'duplicate', 'ipValid']),
  checkFile('apps/api/src/finance/payfast-sandbox-proof.ts', ['sandbox_success_complete_itn', 'sandbox_replay_idempotency_rejected', 'refund_requires_human_review', 'secrets_redacted_from_evidence']),
  checkFile('manifests/payment/payfast-sandbox-proof-v1.json', ['foundation_built_pending_sandbox_run', 'paymentStatusChangesRequireAcceptedItn', 'livePaymentsEnabled']),
  checkFile('docs/finance/KINGSMEN_PAYMENT_PROOF.md', ['Paid status requires accepted ITN evidence', 'real PayFast sandbox checkout']),
  checkFile('scripts/proof/prove-payfast-sandbox-boundary.mjs', ['PAYFAST_SANDBOX_SOURCE_PROOF_PASSED', 'reports/finance/payfast-sandbox-proof-run-latest.json']),
  checkFile('scripts/validators/validate-payfast-sandbox-proof.mjs', ['PAYFAST_SANDBOX_PROOF_VALIDATED', 'payments:prove:sandbox']),

  checkFile('manifests/ops/backup-restore-proof-v1.json', ['backup-restore-proof-v1', 'foundation_built_pending_staging_drill', 'restoreTargetMustDifferFromSource', 'backupStorageAllowedInGit']),
  checkFile('docs/ops/KINGSMEN_BACKUP_RESTORE_PROOF.md', ['pg_dump', 'pg_restore', 'RPO', 'RTO', 'Production ready: **false**']),
  checkFile('scripts/backup/New-KingsmenTruthVaultBackup.ps1', ['KINGSMEN_DATABASE_URL', 'pg_dump', 'Get-FileHash', 'databaseUrlRedacted', 'committedToGit = $false']),
  checkFile('scripts/backup/Test-KingsmenTruthVaultRestore.ps1', ['KINGSMEN_RESTORE_DRILL_DATABASE_URL', 'pg_restore', 'Restore target matches source database', 'countOnly = $true', 'rtoSeconds']),
  checkFile('scripts/proof/prove-backup-restore-boundary.mjs', ['BACKUP_RESTORE_SOURCE_PROOF_PASSED', 'stagingRestoreDrillCompleted: false']),
  checkFile('scripts/validators/validate-backup-restore-proof.mjs', ['BACKUP_RESTORE_PROOF_VALIDATED', 'backup:validate:restore', 'BACKUP_RESTORE_STAGING_DRILL_REQUIRED']),

  checkFile('manifests/repo/main-branch-protection-v1.json', ['main-branch-protection-v1', 'foundation_built_pending_github_apply', 'source-guard', 'preventForcePush']),
  checkFile('docs/repo/KINGSMEN_BRANCH_PROTECTION.md', ['source-guard', 'force push blocked', 'npm run repo:validate:branch-protection']),
  checkFile('scripts/github/Set-KingsmenMainBranchProtection.ps1', ['gh api', 'allow_force_pushes = $false', 'allow_deletions = $false', 'MAIN_BRANCH_PROTECTION_APPLIED']),
  checkFile('scripts/proof/prove-main-branch-protection-boundary.mjs', ['MAIN_BRANCH_PROTECTION_SOURCE_PROOF_PASSED', 'githubProtectionApplied: false']),
  checkFile('scripts/validators/validate-main-branch-protection.mjs', ['MAIN_BRANCH_PROTECTION_VALIDATED', 'repo:validate:branch-protection', 'MAIN_BRANCH_PROTECTION_APPLY_REQUIRED']),

  checkFile('manifests/credentials/credentials.registry.json', ['kingsmen.credentials-registry.v1', 'raw_secrets_in_repo', 'openclaw_raw_secret_access']),
  checkFile('manifests/credentials/secrets-wiring-proof-v1.json', ['kingsmen.secrets-wiring-proof.v1', 'foundation_built_pending_runtime_secret_health_proof', 'rawSecretsInReportsAllowed', 'DATABASE_URL', 'REDIS_URL']),
  checkFile('docs/security/KINGSMEN_SECRETS_WIRING_PROOF.md', ['No raw secrets in Git', 'Test-KingsmenSecretWiring.ps1', 'reports/security/secrets-wiring-runtime-health-latest.json', 'npm run secrets:validate:wiring']),
  checkFile('scripts/security/Test-KingsmenSecretWiring.ps1', ['MASKED_RUNTIME_SECRET_HEALTH_REPORTED', 'rawSecretsPrinted = $false', 'connectionStringsPrinted = $false', 'valuePrinted = $false']),
  checkFile('scripts/proof/prove-secrets-wiring-boundary.mjs', ['SECRETS_WIRING_SOURCE_PROOF_PASSED', 'env_example_empty_placeholders_only', 'credential_has_no_value', 'runtimeSecretHealthProofPending: true']),
  checkFile('scripts/validators/validate-secrets-wiring-proof.mjs', ['SECRETS_WIRING_PROOF_VALIDATED', 'secrets:validate:wiring', 'SECRETS_RUNTIME_HEALTH_PROOF_REQUIRED']),

  checkFile('apps/api/src/communications/communications-proof-boundary.ts', ['COMMUNICATIONS_BOUNDARY_SOURCE_ONLY', 'emailPrimary', 'whatsappUrgentOnly', 'smsBackupOnly', 'bulkMarketingDenied', 'providerSendRequiresStagingProof', 'liveSendExecuted: false']),
  checkFile('manifests/communications/communications-proof-v1.json', ['kingsmen.communications-proof.v1', 'foundation_built_pending_provider_staging_proof', 'emailPrimary', 'whatsappUrgentOnly', 'smsBackupOnly']),
  checkFile('docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md', ['Email is primary', 'WhatsApp is urgent-only', 'SMS is backup-only', 'npm run communications:validate']),
  checkFile('scripts/proof/prove-communications-boundary.mjs', ['COMMUNICATIONS_SOURCE_PROOF_PASSED', 'providerStagingProofPending: true']),
  checkFile('scripts/validators/validate-communications-proof.mjs', ['COMMUNICATIONS_PROOF_VALIDATED', 'communications:validate', 'COMMUNICATIONS_PROVIDER_STAGING_PROOF_REQUIRED']),

  checkFile('apps/api/src/ops/observability-incident-proof-boundary.ts', ['OBSERVABILITY_INCIDENT_BOUNDARY_SOURCE_ONLY', 'apiHealthCheckRequired', 'databaseHealthCheckRequired', 'queueHealthCheckRequired', 'correlationIdRequired', 'dlqReviewRequired', 'founderEscalationRequired', 'incidentRunbookRequired']),
  checkFile('manifests/ops/observability-incident-proof-v1.json', ['kingsmen.observability-incident-proof.v1', 'foundation_built_pending_staging_monitoring_proof', 'api_health_check_defined', 'dlq_review_required', 'founder_escalation_defined']),
  checkFile('docs/ops/KINGSMEN_OBSERVABILITY_INCIDENT_PROOF.md', ['Production ready: **false**', 'SEV1', 'SEV2', 'SEV3', 'founder escalation', 'npm run observability:validate']),
  checkFile('scripts/proof/prove-observability-incident-boundary.mjs', ['OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED', 'stagingRuntimeProofPending: true']),
  checkFile('scripts/validators/validate-observability-incident-proof.mjs', ['OBSERVABILITY_INCIDENT_PROOF_VALIDATED', 'observability:validate', 'OBSERVABILITY_STAGING_PROOF_REQUIRED']),

  checkFile('apps/api/src/legal/legal-privacy-proof-boundary.ts', ['LEGAL_PRIVACY_BOUNDARY_SOURCE_ONLY', 'popiaPrivacyNoticeRequired', 'cpaRefundTermsRequired', 'consentCaptureRequired', 'refundHumanReviewRequired']),
  checkFile('manifests/legal/legal-privacy-proof-v1.json', ['kingsmen.legal-privacy-proof.v1', 'foundation_built_pending_legal_review_and_publication_proof', 'Terms of Service', 'Privacy Notice', 'Refund and Payment Policy']),
  checkFile('docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md', ['Production ready: **false**', 'Public launch allowed: **false**', 'Terms of Service', 'Privacy Notice', 'Refund and Payment Policy', 'npm run legal:validate']),
  checkFile('scripts/proof/prove-legal-privacy-boundary.mjs', ['LEGAL_PRIVACY_SOURCE_PROOF_PASSED', 'providerRuntimeProofPending: true']),
  checkFile('scripts/validators/validate-legal-privacy-proof.mjs', ['LEGAL_PRIVACY_PROOF_VALIDATED', 'legal:validate', 'LEGAL_PRIVACY_PUBLICATION_PROOF_REQUIRED']),

  checkFile('apps/api/src/ops/staging-runtime-proof-pack-boundary.ts', ['STAGING_RUNTIME_PROOF_PACK_SOURCE_ONLY', 'truth_vault_persistence_staging', 'payfast_provider_sandbox_staging', 'legal_privacy_publication_staging', 'branch_protection_applied']),
  checkFile('manifests/launch/staging-runtime-proof-pack-v1.json', ['kingsmen.staging-runtime-proof-pack.v1', 'foundation_built_pending_staging_evidence_capture', 'reports/staging/payfast-provider-sandbox-staging-latest.json', 'reports/security/secrets-wiring-runtime-health-latest.json']),
  checkFile('docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md', ['Staging runtime proof pack', 'Production ready: **false**', 'npm run staging:validate:pack', 'reports/staging/truth-vault-persistence-staging-latest.json']),
  checkFile('scripts/proof/prove-staging-runtime-proof-pack.mjs', ['STAGING_RUNTIME_PROOF_PACK_SOURCE_PROOF_PASSED', 'stagingRuntimeEvidencePending: true']),
  checkFile('scripts/validators/validate-staging-runtime-proof-pack.mjs', ['STAGING_RUNTIME_PROOF_PACK_VALIDATED', 'staging:validate:pack', 'STAGING_RUNTIME_EVIDENCE_PACK_REQUIRED']),

  checkFile('apps/api/src/final-assembly/final-assembly-evidence-capture-boundary.ts', ['FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY', 'requiredFinalAssemblyEvidenceReports', 'finalAssemblyEvidencePending', 'finalAssemblyFounderReviewRequired']),
  checkFile('manifests/launch/final-assembly-evidence-capture-v1.json', ['kingsmen.final-assembly-evidence-capture.v1', 'foundation_built_pending_final_evidence_capture_review', 'reports/final-assembly/final-assembly-evidence-bundle-latest.json']),
  checkFile('docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md', ['Final Assembly Evidence Capture Proof', 'Production ready: **false**', 'npm run final:validate:evidence', 'Collect-KingsmenFinalAssemblyEvidence.ps1']),
  checkFile('scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1', ['FINAL_ASSEMBLY_EVIDENCE_BUNDLE_INCOMPLETE', 'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW', 'rawReportBodiesCopied = $false', 'Get-FileHash']),
  checkFile('scripts/proof/prove-final-assembly-evidence-capture.mjs', ['FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED', 'finalAssemblyEvidencePending: true', 'runtimeReportInventory']),
  checkFile('scripts/validators/validate-final-assembly-evidence-capture.mjs', ['FINAL_ASSEMBLY_EVIDENCE_CAPTURE_VALIDATED', 'final:validate:evidence', 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_REQUIRED']),

  checkFile('packages/contracts/src/jarvis/index.ts', ['JarvisCommandEnvelope', 'tenantRef', 'correlationId', 'requestId']),
  checkFile('packages/jarvis-core/src/jarvis-policy-gate.ts', ['JARVIS_APPROVAL_REQUIRED', 'founderApprovalRef', 'JARVIS_BLOCKED_UNSAFE_ACTION']),
  checkFile('packages/jarvis-core/src/jarvis-evidence-ledger.ts', ['validator_result', 'jarvisAssertEvidenceLedgerSafe']),
  checkFile('apps/api/src/final-assembly/readiness-engine.ts', ['secrets_not_committed', 'database_backup_restore_test', 'payfast_sandbox_evidence'])
];

const blockers = [];
const warnings = [];

function block(code, title, detail, remediation, evidencePaths = []) {
  blockers.push({ code, title, detail, remediation, evidencePaths });
}

function warn(code, title, detail, remediation, evidencePaths = []) {
  warnings.push({ code, title, detail, remediation, evidencePaths });
}

for (const check of requiredFileChecks) {
  if (!check.passed) {
    block('REQUIRED_FILE_OR_TOKEN_MISSING', `Required launch evidence missing: ${check.path}`, check.exists ? `Missing tokens: ${check.missingTokens.join(', ')}` : 'File does not exist.', 'Restore the file/tokens or update the launch manifest only with equivalent evidence.', [check.path]);
  }
}

try {
  const packageJson = json('package.json');
  if (packageJson?.private !== true) {
    warn('ROOT_PACKAGE_NOT_PRIVATE', 'Root package is not marked private.', 'Publishing the monorepo root can accidentally package operational files.', 'Keep the root package private.');
  }
} catch (error) {
  block('PACKAGE_JSON_INVALID', 'package.json is invalid JSON.', String(error), 'Repair package.json.', ['package.json']);
}

const rootPackage = json('package.json');
if (!rootPackage?.scripts?.['security:prove:rls'] || !rootPackage?.scripts?.['security:validate:rls']) {
  block(
    'RLS_SECURITY_SCRIPT_MISSING',
    'RLS/security proof or validator script is missing.',
    'Both security:prove:rls and security:validate:rls must be wired to the checked-in proof and validator scripts.',
    'Restore the RLS scripts in package.json and rerun the source guard.',
    ['package.json', 'scripts/proof/prove-rls-security-boundary.mjs', 'scripts/validators/validate-rls-security-proof.mjs']
  );
}

for (const routePath of [
  'apps/web/src/app/api/jarvis/status/route.ts',
  'apps/web/src/app/api/jarvis/command/route.ts',
  'apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts'
]) {
  const route = read(routePath) ?? '';
  const unsafeTokens = ['node:child_process', 'appendFile', 'appendFileSync', 'writeFileSync', 'data/local', 'psql.exe'];
  if ((route.includes('C:') && route.includes('Kingsmen')) || unsafeTokens.some((token) => route.includes(token))) {
    block('WEB_API_LOCAL_RUNTIME_BOUNDARY', 'Public web API route depends on local runtime behavior.', 'Public web routes must not reference workstation paths, shell execution, local JSONL writes, or direct file writes.', 'Use the backend API client and KINGSMEN_BACKEND_BASE_URL only.', [routePath]);
  }
}

for (const [path, unsafeFields] of [
  ['manifests/payment/payfast-sandbox-proof-v1.json', ['productionReady', 'livePaymentsEnabled', 'candidateCharged']],
  ['manifests/security/rls-security-proof-v1.json', ['productionReady', 'publicLaunchAllowed']],
  ['manifests/ops/backup-restore-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'productionDataAllowed']],
  ['manifests/repo/main-branch-protection-v1.json', ['productionReady', 'publicLaunchAllowed']],
  ['manifests/credentials/secrets-wiring-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'liveSecretsCommitted', 'rawSecretsInReportsAllowed']],
  ['manifests/communications/communications-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'liveMessagesSent', 'bulkSendingAllowed']],
  ['manifests/ops/observability-incident-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'liveMonitoringConnected', 'livePagerConfigured']],
  ['manifests/legal/legal-privacy-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'finalLegalAdviceProvidedByCode']],
  ['manifests/launch/staging-runtime-proof-pack-v1.json', ['productionReady', 'publicLaunchAllowed', 'rawSecretsAllowedInEvidence', 'rawCandidateDataAllowedInEvidence']],
  ['manifests/launch/final-assembly-evidence-capture-v1.json', ['productionReady', 'publicLaunchAllowed', 'finalAssemblyCanOpen', 'rawReportBodiesMayBeCopiedIntoBundle', 'rawCandidateDataAllowedInBundle', 'providerCredentialsAllowedInBundle']]
]) {
  try {
    const parsed = json(path);
    if (!parsed) continue;
    for (const field of unsafeFields) {
      if (parsed[field] !== false) {
        block('UNSAFE_MANIFEST_FLAG', `Unsafe manifest flag in ${path}.`, `${field} must be false until live evidence passes.`, 'Keep source-level proof manifests non-production until real evidence is captured.', [path]);
      }
    }
  } catch (error) {
    block('MANIFEST_JSON_INVALID', `${path} is invalid JSON.`, String(error), 'Repair manifest JSON.', [path]);
  }
}

const warningRules = [
  ['manifests/repo/main-branch-protection-v1.json', 'foundation_built_pending_github_apply', 'MAIN_BRANCH_PROTECTION_APPLY_REQUIRED', 'Branch protection source boundary is built but GitHub protection must still be applied.', 'The workflow and apply script exist, but main is not proven protected until GitHub settings confirm source-guard is required and force-push/deletion are disabled.', 'Run scripts/github/Set-KingsmenMainBranchProtection.ps1 with GitHub admin permissions and verify through GitHub UI or gh api.', ['scripts/github/Set-KingsmenMainBranchProtection.ps1']],
  ['manifests/security/rls-security-proof-v1.json', 'foundation_built_pending_staging_proof', 'RLS_STAGING_PROOF_REQUIRED', 'RLS/security source-level boundary is built but staging proof is still required.', 'Live SQL role-isolation proof against staging PostgreSQL/Supabase is required before public users.', 'Apply db/migrations/0009_rls_security_boundary.sql to staging and store a passing live proof report.', ['db/migrations/0009_rls_security_boundary.sql']],
  ['manifests/ops/backup-restore-proof-v1.json', 'foundation_built_pending_staging_drill', 'BACKUP_RESTORE_STAGING_DRILL_REQUIRED', 'Backup/restore source-level boundary is built but staging restore proof is still required.', 'Production personal data requires a live backup and restore drill with RPO/RTO evidence.', 'Run the backup and restore PowerShell scripts against staging and store a counts-only report.', ['scripts/backup/New-KingsmenTruthVaultBackup.ps1', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1']],
  ['manifests/credentials/secrets-wiring-proof-v1.json', 'foundation_built_pending_runtime_secret_health_proof', 'SECRETS_RUNTIME_HEALTH_PROOF_REQUIRED', 'Secrets wiring source-level boundary is built but masked runtime health proof is still required.', 'Real environment variables must be configured outside Git and checked with masked status-only reports before staging/public launch.', 'Run scripts/security/Test-KingsmenSecretWiring.ps1 in staging/Oracle after configuring env vars outside Git.', ['scripts/security/Test-KingsmenSecretWiring.ps1', 'manifests/credentials/secrets-wiring-proof-v1.json']],
  ['manifests/communications/communications-proof-v1.json', 'foundation_built_pending_provider_staging_proof', 'COMMUNICATIONS_PROVIDER_STAGING_PROOF_REQUIRED', 'Communications source-level boundary is built but provider staging proof is still required.', 'Candidate notifications require provider send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback, and redacted evidence proof.', 'Run communications staging proof before enabling real candidate notifications.', ['manifests/communications/communications-proof-v1.json', 'docs/communications/KINGSMEN_COMMUNICATIONS_PROOF.md']],
  ['manifests/ops/observability-incident-proof-v1.json', 'foundation_built_pending_staging_monitoring_proof', 'OBSERVABILITY_STAGING_PROOF_REQUIRED', 'Observability and incident source-level boundary is built but staging proof is still required.', 'Public users require live health, structured log, queue/DLQ, alert, redaction, and incident drill evidence.', 'Run observability staging proof before public users.', ['manifests/ops/observability-incident-proof-v1.json', 'docs/ops/KINGSMEN_OBSERVABILITY_INCIDENT_PROOF.md']],
  ['manifests/legal/legal-privacy-proof-v1.json', 'foundation_built_pending_legal_review_and_publication_proof', 'LEGAL_PRIVACY_PUBLICATION_PROOF_REQUIRED', 'Legal/privacy source-level boundary is built but publication and review proof is still required.', 'Collecting personal data or payments requires published/versioned legal surfaces, founder/legal review, consent capture proof, refund display proof, and data-subject request proof.', 'Publish policy surfaces and capture legal/founder review plus consent/refund smoke proof before launch.', ['manifests/legal/legal-privacy-proof-v1.json', 'docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md']],
  ['manifests/launch/staging-runtime-proof-pack-v1.json', 'foundation_built_pending_staging_evidence_capture', 'STAGING_RUNTIME_EVIDENCE_PACK_REQUIRED', 'Staging runtime proof pack is source-built but runtime evidence is still required.', 'Final assembly requires redacted staging evidence for DB, web/API, RLS, PayFast, backup/restore, secrets, communications, observability, legal/privacy, and branch protection.', 'Run and review the staging runtime evidence pack before changing final assembly checks from pending to passed.', ['manifests/launch/staging-runtime-proof-pack-v1.json', 'docs/launch/KINGSMEN_STAGING_RUNTIME_PROOF_PACK.md']],
  ['manifests/launch/final-assembly-evidence-capture-v1.json', 'foundation_built_pending_final_evidence_capture_review', 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_REQUIRED', 'Final assembly evidence capture is source-built but reviewed runtime bundle is still required.', 'Public launch requires one redacted final assembly evidence bundle with every required staging report present, passed, reviewed, and hashed.', 'Run scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1 and founder-review the bundle before opening the launch gate.', ['manifests/launch/final-assembly-evidence-capture-v1.json', 'docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md']]
];

for (const [path, token, code, title, detail, remediation, evidencePaths] of warningRules) {
  if ((read(path) ?? '').includes(token)) {
    warn(code, title, detail, remediation, evidencePaths);
  }
}

const readinessEngine = read('apps/api/src/final-assembly/readiness-engine.ts') ?? '';
function readinessStatusFor(checkKey) {
  const escaped = checkKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`checkKey:\\s*["']${escaped}["'][\\s\\S]*?status:\\s*["'](passed|pending|failed)["']`);
  return readinessEngine.match(pattern)?.[1] ?? 'missing';
}

for (const token of ['secrets_not_committed', 'database_backup_restore_test', 'payfast_sandbox_evidence']) {
  const status = readinessStatusFor(token);
  if (status === 'pending' || status === 'failed') {
    block('FINAL_ASSEMBLY_REQUIRED_CHECK_PENDING', `Final assembly required check is still pending: ${token}`, `The final assembly model marks this evidence as ${status}.`, 'Run and record the required evidence, then update readiness checks only after proof exists.', ['apps/api/src/final-assembly/readiness-engine.ts']);
  } else if (status === 'missing') {
    block('FINAL_ASSEMBLY_REQUIRED_CHECK_MISSING', `Final assembly required check is missing: ${token}`, 'The final assembly model does not contain this required check.', 'Restore the required readiness check before launch.', ['apps/api/src/final-assembly/readiness-engine.ts']);
  }
}

const report = {
  validator: 'validate-kingsmen-launch-readiness',
  generatedAtIso: new Date().toISOString(),
  mode: gateMode ? 'gate' : 'audit',
  publicLaunchStatus: blockers.length === 0 ? 'open' : 'blocked',
  summary: {
    requiredFileChecks: requiredFileChecks.length,
    failedFileChecks: requiredFileChecks.filter((check) => !check.passed).length,
    blockers: blockers.length,
    warnings: warnings.length
  },
  doctrine: {
    postgresTruthVault: true,
    backendControlsState: true,
    n8nThinWorkersOnly: true,
    webCallsBackendApiOnly: true,
    payfastItnEvidenceRequired: true,
    rlsRoleIsolationRequired: true,
    backupRestoreRequiredBeforeProductionData: true,
    mainBranchProtectionRequired: true,
    sourceGuardRequiredBeforeMerge: true,
    secretsRuntimeHealthRequired: true,
    livePaymentsRemainBlockedUntilSandboxProviderProof: true,
    emailPrimary: true,
    whatsappUrgentOnly: true,
    observabilityRequiredBeforePublicUsers: true,
    legalPrivacyRequiredBeforeDataOrPayments: true,
    stagingRuntimeProofPackRequiredBeforeFinalAssembly: true,
    finalAssemblyEvidenceCaptureRequiredBeforeLaunch: true,
    founderApprovalForProductionRisk: true,
    noSecretsInRepo: true,
    publicLaunchRequiresAllP0Gates: true
  },
  checks: requiredFileChecks,
  blockers,
  warnings,
  nextActions: blockers.length === 0
    ? ['Apply GitHub branch protection, complete masked secrets runtime proof, staging runtime evidence pack, final assembly evidence bundle, and live evidence before public traffic.']
    : [
        'Run API Truth Vault persistence validation and staging DB integration proof.',
        'Run web backend-boundary validation and staging smoke proof with KINGSMEN_BACKEND_BASE_URL configured.',
        'Run PayFast sandbox proof validator and real provider sandbox checkout against staging notify URL.',
        'Run RLS/security source proof, then apply migration to staging and capture live SQL role-isolation proof.',
        'Run backup/restore source proof, then perform live staging backup and restore drill with RPO/RTO evidence.',
        'Run repo branch-protection proof, then apply GitHub main protection with source-guard required.',
        'Run secrets wiring proof, then perform masked runtime secret health proof in staging/Oracle.',
        'Run communications proof, then perform provider staging send/receive, bounce, opt-out, WhatsApp urgent-only, SMS fallback, and redacted evidence proof.',
        'Run observability proof, then perform staging health, queue/DLQ, alert, redaction, and incident drill proof.',
        'Run legal/privacy proof, then publish/version policy surfaces and capture legal/founder review, consent capture proof, refund display proof, and data-subject request proof.',
        'Run staging runtime proof pack and review all redacted evidence before final assembly.',
        'Run final assembly evidence capture and founder-review the bundle before launch.'
      ]
};

const reportPath = relative('reports/launch/kingsmen-launch-readiness-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.publicLaunchStatus === 'open' ? 'KINGSMEN_LAUNCH_GATE_OPEN' : 'KINGSMEN_LAUNCH_GATE_BLOCKED');
console.log(JSON.stringify(report, null, 2));

if (gateMode && blockers.length > 0) {
  process.exitCode = 1;
}
