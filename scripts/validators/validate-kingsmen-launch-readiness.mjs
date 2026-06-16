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

function checkFile(path, requiredTokens = []) {
  const content = read(path);
  const missingTokens = content === null ? requiredTokens : requiredTokens.filter((token) => !content.includes(token));
  return {
    path,
    exists: content !== null,
    bytes: content?.length ?? 0,
    requiredTokens,
    missingTokens,
    passed: content !== null && missingTokens.length === 0
  };
}

function json(path) {
  const content = read(path);
  if (!content) return null;
  return JSON.parse(content);
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
    'repo:validate:branch-protection'
  ]),
  checkFile('.gitignore', ['.local/backups', 'backups/', '*.dump', '*.backup']),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', ['requiredLaunchGates', 'publicLaunchStatus', 'main-branch-protection-v1', 'web_runtime_boundary', 'payfast-sandbox-proof-v1', 'rls-security-proof-v1', 'backup-restore-proof-v1']),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['Exact blockers', 'npm run kingsmen:launch:gate', 'npm run web:validate:backend-boundary', 'npm run payments:validate:sandbox', 'npm run security:validate:rls', 'npm run backup:validate:restore']),

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
  checkFile('scripts/proof/prove-rls-security-boundary.mjs', ['RLS_SECURITY_SOURCE_PROOF_PASSED', 'candidate_cannot_read_other_candidate_row', 'service_role_without_backend_context_denied']),
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
  checkFile('.github/workflows/kingsmen-source-guard.yml', ['name: Kingsmen Source Guard', 'source-guard', 'npm run backup:validate:restore', 'npm run kingsmen:launch:audit']),
  checkFile('scripts/github/Set-KingsmenMainBranchProtection.ps1', ['gh api', 'allow_force_pushes = $false', 'allow_deletions = $false', 'MAIN_BRANCH_PROTECTION_APPLIED']),
  checkFile('scripts/proof/prove-main-branch-protection-boundary.mjs', ['MAIN_BRANCH_PROTECTION_SOURCE_PROOF_PASSED', 'githubProtectionApplied: false']),
  checkFile('scripts/validators/validate-main-branch-protection.mjs', ['MAIN_BRANCH_PROTECTION_VALIDATED', 'repo:validate:branch-protection', 'MAIN_BRANCH_PROTECTION_APPLY_REQUIRED']),

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
    block(
      'REQUIRED_FILE_OR_TOKEN_MISSING',
      `Required launch evidence missing: ${check.path}`,
      check.exists ? `Missing tokens: ${check.missingTokens.join(', ')}` : 'File does not exist.',
      'Restore the file/tokens or update the launch manifest only with equivalent evidence.',
      [check.path]
    );
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

const publicWebRoutes = [
  'apps/web/src/app/api/jarvis/status/route.ts',
  'apps/web/src/app/api/jarvis/command/route.ts',
  'apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts'
];

for (const routePath of publicWebRoutes) {
  const route = read(routePath) ?? '';
  if (
    (route.includes('C:') && route.includes('Kingsmen')) ||
    route.includes('powershell') ||
    route.includes('psql.exe') ||
    route.includes('node:child_process') ||
    route.includes('from "node:fs"') ||
    route.includes("from 'node:fs'") ||
    route.includes('appendFile') ||
    route.includes('appendFileSync') ||
    route.includes('writeFileSync') ||
    route.includes('data/local')
  ) {
    block('WEB_API_LOCAL_RUNTIME_BOUNDARY', 'Public web API route depends on local runtime behavior.', 'Public web routes must not reference workstation paths, shell execution, local JSONL writes, or direct file writes.', 'Use the backend API client and KINGSMEN_BACKEND_BASE_URL only.', [routePath]);
  }
}

for (const [path, unsafeFields] of [
  ['manifests/payment/payfast-sandbox-proof-v1.json', ['productionReady', 'livePaymentsEnabled', 'candidateCharged']],
  ['manifests/security/rls-security-proof-v1.json', ['productionReady', 'publicLaunchAllowed']],
  ['manifests/ops/backup-restore-proof-v1.json', ['productionReady', 'publicLaunchAllowed', 'productionDataAllowed']],
  ['manifests/repo/main-branch-protection-v1.json', ['productionReady', 'publicLaunchAllowed']]
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

const branchManifest = read('manifests/repo/main-branch-protection-v1.json');
if (branchManifest?.includes('foundation_built_pending_github_apply')) {
  warn(
    'MAIN_BRANCH_PROTECTION_APPLY_REQUIRED',
    'Branch protection source boundary is built but GitHub protection must still be applied.',
    'The workflow and apply script exist, but main is not proven protected until GitHub settings confirm source-guard is required and force-push/deletion are disabled.',
    'Run scripts/github/Set-KingsmenMainBranchProtection.ps1 with GitHub admin permissions and verify through GitHub UI or gh api.',
    ['scripts/github/Set-KingsmenMainBranchProtection.ps1', 'manifests/repo/main-branch-protection-v1.json']
  );
}

const rlsManifest = read('manifests/security/rls-security-proof-v1.json');
if (rlsManifest?.includes('foundation_built_pending_staging_proof')) {
  warn('RLS_STAGING_PROOF_REQUIRED', 'RLS/security source-level boundary is built but staging proof is still required.', 'Live SQL role-isolation proof against staging PostgreSQL/Supabase is required before public users.', 'Apply db/migrations/0009_rls_security_boundary.sql to staging and store a passing live proof report.', ['db/migrations/0009_rls_security_boundary.sql']);
}

const backupManifest = read('manifests/ops/backup-restore-proof-v1.json');
if (backupManifest?.includes('foundation_built_pending_staging_drill')) {
  warn('BACKUP_RESTORE_STAGING_DRILL_REQUIRED', 'Backup/restore source-level boundary is built but staging restore proof is still required.', 'Production personal data requires a live backup and restore drill with RPO/RTO evidence.', 'Run the backup and restore PowerShell scripts against staging and store a counts-only report.', ['scripts/backup/New-KingsmenTruthVaultBackup.ps1', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1']);
}

const readinessEngine = read('apps/api/src/final-assembly/readiness-engine.ts') ?? '';
for (const token of ['secrets_not_committed', 'database_backup_restore_test', 'payfast_sandbox_evidence']) {
  if (readinessEngine.includes(token) && readinessEngine.includes('status: "pending"')) {
    block('FINAL_ASSEMBLY_REQUIRED_CHECK_PENDING', `Final assembly required check is still pending: ${token}`, 'The final assembly model still marks required launch evidence as pending.', 'Run and record the required evidence, then update readiness checks only after proof exists.', ['apps/api/src/final-assembly/readiness-engine.ts']);
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
    livePaymentsRemainBlockedUntilSandboxProviderProof: true,
    emailPrimary: true,
    whatsappUrgentOnly: true,
    founderApprovalForProductionRisk: true,
    noSecretsInRepo: true,
    publicLaunchRequiresAllP0Gates: true
  },
  checks: requiredFileChecks,
  blockers,
  warnings,
  nextActions: blockers.length === 0
    ? ['Apply GitHub branch protection, then complete staging smoke tests and live evidence before public traffic.']
    : [
        'Run API Truth Vault persistence validation and staging DB integration proof.',
        'Run web backend-boundary validation and staging smoke proof with KINGSMEN_BACKEND_BASE_URL configured.',
        'Run PayFast sandbox proof validator and real provider sandbox checkout against staging notify URL.',
        'Run RLS/security source proof, then apply migration to staging and capture live SQL role-isolation proof.',
        'Run backup/restore source proof, then perform live staging backup and restore drill with RPO/RTO evidence.',
        'Run repo branch-protection proof, then apply GitHub main protection with source-guard required.',
        'Prove secrets wiring and incident handling.'
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
