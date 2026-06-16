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

function has(path, token) {
  return Boolean(read(path)?.includes(token));
}

function hasLocalWindowsBoundary(source) {
  return source.includes('C:') && source.includes('Kingsmen');
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
    'backup:validate:restore'
  ]),
  checkFile('.gitignore', ['.local/backups', 'backups/', '*.dump', '*.backup']),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', ['requiredLaunchGates', 'publicLaunchStatus', 'web_runtime_boundary', 'payfast-sandbox-proof-v1', 'rls-security-proof-v1', 'backup-restore-proof-v1']),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['Exact blockers', 'npm run kingsmen:launch:gate', 'npm run web:validate:backend-boundary', 'npm run payments:validate:sandbox', 'npm run security:validate:rls', 'npm run backup:validate:restore']),
  checkFile('packages/contracts/src/jarvis/index.ts', ['JarvisCommandEnvelope', 'tenantRef', 'correlationId', 'requestId']),
  checkFile('packages/jarvis-core/src/jarvis-policy-gate.ts', ['JARVIS_APPROVAL_REQUIRED', 'founderApprovalRef', 'JARVIS_BLOCKED_UNSAFE_ACTION']),
  checkFile('packages/jarvis-core/src/jarvis-evidence-ledger.ts', ['validator_result', 'jarvisAssertEvidenceLedgerSafe']),
  checkFile('apps/api/src/kernel/command-envelope.ts', ['idempotencyKey', 'correlationId', 'assertCommandEnvelope']),
  checkFile('apps/api/src/kernel/command-bus.ts', ['KingsmenCommandBus', 'assertPolicyAllows']),
  checkFile('apps/api/src/state/state-machine.ts', ['WORKFLOW_TARGET_STATE', 'assertTransition']),
  checkFile('apps/api/src/db/truth-vault-schema.ts', ['N03_TRUTH_TABLES', 'N03_RLS_REQUIRED']),
  checkFile('apps/api/src/db/truth-vault-repository.ts', ['KINGSMEN_TRUTH_VAULT_MODE', 'postgres_truth_vault', 'recordCommand', 'recordWorkflowResult']),
  checkFile('scripts/validators/validate-api-truth-vault-persistence.mjs', ['API Truth Vault Persistence', 'postgres_truth_vault']),
  checkFile('scripts/validators/validate-safe-web-backend-boundary.mjs', ['SAFE_WEB_BACKEND_BOUNDARY_VALIDATED', 'KINGSMEN_BACKEND_BASE_URL']),
  checkFile('apps/web/src/lib/kingsmen-backend-client.ts', ['KINGSMEN_BACKEND_BASE_URL', 'backend_api_only', 'postKingsmenCommand']),
  checkFile('apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts', ['candidate.intake.received', 'web_to_backend_api_boundary', 'localWriteAttempted: false']),
  checkFile('apps/web/src/app/api/jarvis/status/route.ts', ['getKingsmenApiHealth', 'Backend API Boundary']),
  checkFile('apps/web/src/app/api/jarvis/command/route.ts', ['postKingsmenCommand', 'localShellExecuted: false']),
  checkFile('docs/web/KINGSMEN_SAFE_WEB_BACKEND_BOUNDARY.md', ['KINGSMEN_BACKEND_BASE_URL', 'proxy surface']),
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
  checkFile('scripts/validators/validate-backup-restore-proof.mjs', ['BACKUP_RESTORE_PROOF_VALIDATED', 'backup:validate:restore']),
  checkFile('apps/api/src/final-assembly/final-read-model.ts', ['buildDefaultLaunchGates', 'gate_public_launch']),
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
      check.exists
        ? `Missing tokens: ${check.missingTokens.join(', ')}`
        : 'File does not exist.',
      'Restore the file/tokens or update the launch manifest only with equivalent evidence.',
      [check.path]
    );
  }
}

const packageJson = read('package.json');
if (packageJson) {
  try {
    const parsed = JSON.parse(packageJson);
    if (parsed.private !== true) {
      warn(
        'ROOT_PACKAGE_NOT_PRIVATE',
        'Root package is not marked private.',
        'Publishing the monorepo root can accidentally package operational files.',
        'Keep the root package private and publish only sealed package subdirectories.'
      );
    }
    if (!parsed.scripts?.['kingsmen:launch:audit'] || !parsed.scripts?.['kingsmen:launch:gate']) {
      block(
        'LAUNCH_SCRIPTS_MISSING',
        'Launch audit/gate scripts are missing.',
        'The repo cannot run a single launch-readiness command.',
        'Add kingsmen:launch:audit and kingsmen:launch:gate scripts to package.json.',
        ['package.json']
      );
    }
    if (!parsed.scripts?.['web:validate:backend-boundary']) {
      block(
        'WEB_BOUNDARY_VALIDATOR_SCRIPT_MISSING',
        'Safe web/backend boundary validator script is missing.',
        'The repo cannot prove that public web routes avoid local shell and direct DB access.',
        'Add web:validate:backend-boundary to package.json.',
        ['package.json']
      );
    }
    if (!parsed.scripts?.['payments:validate:sandbox'] || !parsed.scripts?.['payments:prove:sandbox']) {
      block(
        'PAYMENT_PROOF_SCRIPT_MISSING',
        'PayFast sandbox proof scripts are missing.',
        'The repo cannot prove payment boundaries before paid pilot.',
        'Add payments:prove:sandbox and payments:validate:sandbox scripts to package.json.',
        ['package.json']
      );
    }
    if (!parsed.scripts?.['security:prove:rls'] || !parsed.scripts?.['security:validate:rls']) {
      block(
        'RLS_SECURITY_SCRIPT_MISSING',
        'RLS/security proof scripts are missing.',
        'The repo cannot prove scoped RLS boundary before public users.',
        'Add security:prove:rls and security:validate:rls scripts to package.json.',
        ['package.json']
      );
    }
    if (!parsed.scripts?.['backup:prove:restore'] || !parsed.scripts?.['backup:validate:restore']) {
      block(
        'BACKUP_RESTORE_SCRIPT_MISSING',
        'Backup/restore proof scripts are missing.',
        'The repo cannot prove backup/restore boundaries before production data.',
        'Add backup:prove:restore and backup:validate:restore scripts to package.json.',
        ['package.json']
      );
    }
  } catch (error) {
    block('PACKAGE_JSON_INVALID', 'package.json is invalid JSON.', String(error), 'Repair package.json.', ['package.json']);
  }
}

if (!existsSync(relative('apps/api/package.json'))) {
  block(
    'API_RUNTIME_PACKAGE_MISSING',
    'Backend API is not yet a standalone deployable runtime.',
    'apps/api/package.json is missing. apps/api currently exports modules but does not define its own build/start/deploy scripts.',
    'Add apps/api/package.json, a runtime server entrypoint, health route, command route, workflow-result route, and deployment command.',
    ['apps/api/src/index.ts']
  );
}

const repository = read('apps/api/src/db/truth-vault-repository.ts') ?? '';
if (repository.includes('prepared for PostgreSQL persistence') && !repository.includes('await ')) {
  block(
    'TRUTH_VAULT_PERSISTENCE_STUB',
    'Truth Vault repository prepares results but does not persist them.',
    'Repository methods return ok/ref/message objects without a live PostgreSQL/Supabase client write.',
    'Implement real writes for evidence, idempotency, command log, workflow run, audit event, heartbeat, DLQ, and approval records with integration tests.',
    ['apps/api/src/db/truth-vault-repository.ts']
  );
}

const bootstrapMigration = read('db/migrations/0001_n03_truth_vault.sql') ?? '';
const hardeningMigration = read('db/migrations/0009_rls_security_boundary.sql') ?? '';
const rlsManifest = read('manifests/security/rls-security-proof-v1.json') ?? '';
const hasBootstrapBroadPolicies = bootstrapMigration.includes('FOR ALL USING (true) WITH CHECK (true)');
const hasRlsHardening = hardeningMigration.includes('DROP POLICY IF EXISTS service_role_all_candidates')
  && hardeningMigration.includes('candidates_candidate_read_own')
  && hardeningMigration.includes('applications_candidate_read_own')
  && hardeningMigration.includes('route_sources_public_verified_read')
  && rlsManifest.includes('foundation_built_pending_staging_proof');

if (hasBootstrapBroadPolicies && !hasRlsHardening) {
  block(
    'RLS_POLICIES_TOO_BROAD_FOR_PUBLIC_LAUNCH',
    'RLS is enabled but only broad bootstrap policies are present.',
    'The N03 migration creates FOR ALL USING true policies. That can be acceptable for bootstrap/service-role access, but it is not enough for public multi-user production access.',
    'Add scoped candidate/operator/founder/service policies and tests proving row isolation before public users.',
    ['db/migrations/0001_n03_truth_vault.sql']
  );
}

if (hasRlsHardening) {
  warn(
    'RLS_STAGING_PROOF_REQUIRED',
    'RLS/security source-level boundary is built but staging proof is still required.',
    'The migration and validators exist, but public users need live SQL role-isolation proof against staging PostgreSQL/Supabase.',
    'Apply db/migrations/0009_rls_security_boundary.sql to staging and store a passing live proof report.',
    ['db/migrations/0009_rls_security_boundary.sql', 'manifests/security/rls-security-proof-v1.json']
  );
}

const publicWebRoutes = [
  'apps/web/src/app/api/jarvis/status/route.ts',
  'apps/web/src/app/api/jarvis/command/route.ts',
  'apps/web/src/app/api/public/free-destiny-map/intake/local/route.ts'
];

for (const routePath of publicWebRoutes) {
  const route = read(routePath) ?? '';
  if (
    hasLocalWindowsBoundary(route) ||
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
    block(
      'WEB_API_LOCAL_RUNTIME_BOUNDARY',
      'Public web API route depends on local runtime behavior.',
      'Public Next API routes must not reference local workstation paths, shell execution, local JSONL writes, or direct local file writes.',
      'Use the backend API client and KINGSMEN_BACKEND_BASE_URL only.',
      [routePath]
    );
  }
}

const paymentManifest = read('manifests/payment/payfast-sandbox-proof-v1.json');
if (paymentManifest) {
  try {
    const parsed = JSON.parse(paymentManifest);
    if (parsed.productionReady !== false || parsed.livePaymentsEnabled !== false || parsed.candidateCharged !== false) {
      block(
        'PAYMENT_PROOF_UNSAFE_FLAG',
        'Payment proof manifest has unsafe runtime flags.',
        'Payment proof must not claim production readiness, live payments, or candidate charging.',
        'Set productionReady=false, livePaymentsEnabled=false, candidateCharged=false.',
        ['manifests/payment/payfast-sandbox-proof-v1.json']
      );
    }
  } catch (error) {
    block('PAYMENT_MANIFEST_INVALID', 'Payment manifest is invalid JSON.', String(error), 'Repair payment manifest JSON.', ['manifests/payment/payfast-sandbox-proof-v1.json']);
  }
}

if (rlsManifest) {
  try {
    const parsed = JSON.parse(rlsManifest);
    if (parsed.productionReady !== false || parsed.publicLaunchAllowed !== false) {
      block(
        'RLS_MANIFEST_UNSAFE_FLAG',
        'RLS/security manifest has unsafe launch flags.',
        'RLS proof must not claim production readiness or public launch approval.',
        'Set productionReady=false and publicLaunchAllowed=false until staging SQL isolation proof passes.',
        ['manifests/security/rls-security-proof-v1.json']
      );
    }
  } catch (error) {
    block('RLS_MANIFEST_INVALID', 'RLS/security manifest is invalid JSON.', String(error), 'Repair RLS manifest JSON.', ['manifests/security/rls-security-proof-v1.json']);
  }
}

const backupManifest = read('manifests/ops/backup-restore-proof-v1.json');
if (backupManifest) {
  try {
    const parsed = JSON.parse(backupManifest);
    if (parsed.productionReady !== false || parsed.publicLaunchAllowed !== false || parsed.productionDataAllowed !== false) {
      block(
        'BACKUP_RESTORE_UNSAFE_FLAG',
        'Backup/restore manifest has unsafe launch flags.',
        'Backup/restore proof must not claim production readiness, public launch approval, or production data approval.',
        'Set productionReady=false, publicLaunchAllowed=false, and productionDataAllowed=false until live staging restore proof passes.',
        ['manifests/ops/backup-restore-proof-v1.json']
      );
    }
    if (parsed.backupStorageAllowedInGit !== false || parsed.rawCandidateRowsAllowedInReports !== false || parsed.databaseUrlAllowedInReports !== false) {
      block(
        'BACKUP_RESTORE_DATA_EXPOSURE_RISK',
        'Backup/restore manifest allows unsafe backup evidence exposure.',
        'Backups must stay out of Git, reports must not contain raw candidate rows, and database URLs must be redacted.',
        'Set backupStorageAllowedInGit=false, rawCandidateRowsAllowedInReports=false, and databaseUrlAllowedInReports=false.',
        ['manifests/ops/backup-restore-proof-v1.json']
      );
    }
  } catch (error) {
    block('BACKUP_RESTORE_MANIFEST_INVALID', 'Backup/restore manifest is invalid JSON.', String(error), 'Repair backup/restore manifest JSON.', ['manifests/ops/backup-restore-proof-v1.json']);
  }
}

if (backupManifest?.includes('foundation_built_pending_staging_drill')) {
  warn(
    'BACKUP_RESTORE_STAGING_DRILL_REQUIRED',
    'Backup/restore source-level boundary is built but staging restore proof is still required.',
    'Scripts and validators exist, but production personal data requires a live backup and restore drill with RPO/RTO evidence.',
    'Run New-KingsmenTruthVaultBackup.ps1 and Test-KingsmenTruthVaultRestore.ps1 against staging and store a counts-only report.',
    ['scripts/backup/New-KingsmenTruthVaultBackup.ps1', 'scripts/backup/Test-KingsmenTruthVaultRestore.ps1']
  );
}

const readinessEngine = read('apps/api/src/final-assembly/readiness-engine.ts') ?? '';
for (const token of ['secrets_not_committed', 'database_backup_restore_test', 'payfast_sandbox_evidence']) {
  if (readinessEngine.includes(token) && readinessEngine.includes('status: "pending"')) {
    block(
      'FINAL_ASSEMBLY_REQUIRED_CHECK_PENDING',
      `Final assembly required check is still pending: ${token}`,
      'The final assembly model still marks required launch evidence as pending.',
      'Run and record the required evidence, then update readiness checks only after proof exists.',
      ['apps/api/src/final-assembly/readiness-engine.ts']
    );
  }
}

if (has('apps/web/package.json', '"private": true')) {
  // Good: web app should not be published as an npm package.
} else {
  warn(
    'WEB_PACKAGE_PRIVATE_FLAG_MISSING',
    'Web app package should be private.',
    'apps/web should deploy as an app, not publish as a shared npm package.',
    'Set private true in apps/web/package.json.',
    ['apps/web/package.json']
  );
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
    ? ['Open the final founder launch approval gate and run staging smoke tests before public traffic.']
    : [
        'Run API Truth Vault persistence validation and staging DB integration proof.',
        'Run web backend-boundary validation and staging smoke proof with KINGSMEN_BACKEND_BASE_URL configured.',
        'Run PayFast sandbox proof validator and real provider sandbox checkout against staging notify URL.',
        'Run RLS/security source proof, then apply migration to staging and capture live SQL role-isolation proof.',
        'Run backup/restore source proof, then perform live staging backup and restore drill with RPO/RTO evidence.',
        'Prove secrets wiring and incident handling.',
        'Protect main and require this launch gate before release.'
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
