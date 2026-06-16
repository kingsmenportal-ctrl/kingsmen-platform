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
  checkFile('package.json', ['kingsmen:launch:audit', 'kingsmen:launch:gate']),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', ['requiredLaunchGates', 'publicLaunchStatus']),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['Exact blockers', 'npm run kingsmen:launch:gate']),
  checkFile('packages/contracts/src/jarvis/index.ts', ['JarvisCommandEnvelope', 'tenantRef', 'correlationId', 'requestId']),
  checkFile('packages/jarvis-core/src/jarvis-policy-gate.ts', ['JARVIS_APPROVAL_REQUIRED', 'founderApprovalRef', 'JARVIS_BLOCKED_UNSAFE_ACTION']),
  checkFile('packages/jarvis-core/src/jarvis-evidence-ledger.ts', ['validator_result', 'jarvisAssertEvidenceLedgerSafe']),
  checkFile('apps/api/src/kernel/command-envelope.ts', ['idempotencyKey', 'correlationId', 'assertCommandEnvelope']),
  checkFile('apps/api/src/kernel/command-bus.ts', ['KingsmenCommandBus', 'assertPolicyAllows']),
  checkFile('apps/api/src/state/state-machine.ts', ['WORKFLOW_TARGET_STATE', 'assertTransition']),
  checkFile('apps/api/src/db/truth-vault-schema.ts', ['N03_TRUTH_TABLES', 'N03_RLS_REQUIRED']),
  checkFile('db/migrations/0001_n03_truth_vault.sql', ['CREATE TABLE IF NOT EXISTS candidates', 'ENABLE ROW LEVEL SECURITY']),
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

const migration = read('db/migrations/0001_n03_truth_vault.sql') ?? '';
if (migration.includes('FOR ALL USING (true) WITH CHECK (true)')) {
  block(
    'RLS_POLICIES_TOO_BROAD_FOR_PUBLIC_LAUNCH',
    'RLS is enabled but policies are broad service-role policies.',
    'The migration creates many FOR ALL USING (true) policies. That can be acceptable for bootstrap/service-role access, but it is not enough evidence for public multi-user production access.',
    'Add scoped candidate/operator/founder/service policies and tests proving row isolation before public users.',
    ['db/migrations/0001_n03_truth_vault.sql']
  );
}

const jarvisStatusRoute = read('apps/web/src/app/api/jarvis/status/route.ts') ?? '';
const jarvisCommandRoute = read('apps/web/src/app/api/jarvis/command/route.ts') ?? '';
if (
  hasLocalWindowsBoundary(jarvisStatusRoute) ||
  hasLocalWindowsBoundary(jarvisCommandRoute) ||
  jarvisStatusRoute.includes('powershell') ||
  jarvisCommandRoute.includes('powershell') ||
  jarvisStatusRoute.includes('psql.exe') ||
  jarvisCommandRoute.includes('psql.exe')
) {
  block(
    'WEB_API_LOCAL_SHELL_BOUNDARY',
    'Web API routes depend on local Windows shell execution.',
    'Public Next API routes currently reference local Windows paths, powershell, and/or psql.exe. That is a local founder workstation proof surface, not a cloud/public runtime boundary.',
    'Move these actions behind the backend API/SDK, use environment variables, and remove local shell execution from public routes.',
    ['apps/web/src/app/api/jarvis/status/route.ts', 'apps/web/src/app/api/jarvis/command/route.ts']
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
        'Fix API runtime packaging and live backend entrypoints.',
        'Replace Truth Vault persistence stubs with real PostgreSQL/Supabase writes.',
        'Remove local PowerShell/Windows shell execution from public web API routes.',
        'Prove PayFast sandbox/ITN, secrets wiring, backup/restore, and RLS isolation.',
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
