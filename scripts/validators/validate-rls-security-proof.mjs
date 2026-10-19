import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/security/rls-security-validation-latest.json');

function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : null;
}

function checkFile(path, tokens = []) {
  const content = read(path);
  const missingTokens = content === null ? tokens : tokens.filter((token) => !content.includes(token));
  return {
    path,
    exists: content !== null,
    bytes: content?.length ?? 0,
    missingTokens,
    passed: content !== null && missingTokens.length === 0
  };
}

const checks = [];
function check(name, passed, detail = '') {
  checks.push({ name, passed, detail });
}

const requiredFiles = [
  checkFile('db/migrations/0001_n03_truth_vault.sql', ['ENABLE ROW LEVEL SECURITY', 'FOR ALL USING (true) WITH CHECK (true)']),
  checkFile('db/migrations/0009_rls_security_boundary.sql', [
    'current_runtime_role',
    'current_service_context',
    'current_candidate_public_ref',
    'is_backend_service_role',
    'current_candidate_id',
    'DROP POLICY IF EXISTS service_role_all_candidates',
    'candidates_candidate_read_own',
    'applications_candidate_read_own',
    'evidence_ledger_candidate_read_own_safe',
    'audit_events_founder_read',
    'route_sources_public_verified_read'
  ]),
  checkFile('manifests/security/rls-security-proof-v1.json', [
    'foundation_built_pending_staging_proof',
    'candidateReadsOwnRowsOnly',
    'serviceRoleRequiresBackendContext',
    'stagingExecutionRequired'
  ]),
  checkFile('docs/security/KINGSMEN_RLS_SECURITY_PROOF.md', [
    'app.kingsmen_role',
    'app.service_context',
    'app.candidate_public_ref',
    'staging proof'
  ]),
  checkFile('scripts/proof/prove-rls-security-boundary.mjs', [
    'RLS_SECURITY_SOURCE_PROOF_PASSED',
    'candidate_cannot_read_other_candidate_row',
    'service_role_without_backend_context_denied',
    'reports/security/rls-security-proof-latest.json'
  ]),
  checkFile('package.json', ['security:prove:rls', 'security:validate:rls']),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', ['tenant_security_rls', 'rls-security-proof-v1', 'foundation_built_pending_staging_proof']),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['npm run security:validate:rls', 'RLS/security source-level boundary']),
  checkFile('scripts/validators/validate-kingsmen-launch-readiness.mjs', ['security:validate:rls', 'RLS_STAGING_PROOF_REQUIRED'])
];

for (const fileCheck of requiredFiles) {
  check(`file:${fileCheck.path}`, fileCheck.passed, fileCheck.exists ? `missing=${fileCheck.missingTokens.join(', ')}` : 'missing file');
}

const hardeningMigration = read('db/migrations/0009_rls_security_boundary.sql') ?? '';
const broadTruePolicyPattern = /FOR\s+ALL\s+USING\s*\(\s*true\s*\)\s+WITH\s+CHECK\s*\(\s*true\s*\)/i;
check('hardening_migration_no_broad_true_policy', !broadTruePolicyPattern.test(hardeningMigration), '0009 must not create tenant-blind true policies.');

const requiredPolicyNames = [
  'candidates_service_role_backend_all',
  'candidates_founder_operator_read',
  'candidates_candidate_read_own',
  'candidate_profiles_candidate_read_own',
  'applications_candidate_read_own',
  'evidence_ledger_candidate_read_own_safe',
  'audit_events_founder_read',
  'workflow_runs_candidate_read_own',
  'route_sources_public_verified_read'
];
for (const policyName of requiredPolicyNames) {
  check(`policy:${policyName}`, hardeningMigration.includes(policyName), policyName);
}

const dangerousSecretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /PAYFAST_[A-Z_]*(?:KEY|PASSPHRASE)\s*[:=]\s*["'][^"']+["']/i,
  /DATABASE_URL\s*[:=]\s*["']postgres:\/\/[^"']+["']/i
];

for (const fileCheck of requiredFiles) {
  const content = read(fileCheck.path);
  if (!content) continue;
  for (const pattern of dangerousSecretPatterns) {
    check(`secret_scan:${fileCheck.path}:${pattern.source}`, !pattern.test(content), 'secret-like value must not be committed');
  }
}

const manifestText = read('manifests/security/rls-security-proof-v1.json') ?? '{}';
try {
  const manifest = JSON.parse(manifestText);
  check('manifest_production_false', manifest.productionReady === false, String(manifest.productionReady));
  check('manifest_public_launch_false', manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed));
  check('manifest_scenario_count', Array.isArray(manifest.proofScenarios) && manifest.proofScenarios.length >= 10, `${manifest.proofScenarios?.length ?? 0}`);
} catch (error) {
  check('manifest_valid_json', false, String(error));
}

const failedChecks = checks.filter((item) => !item.passed);
const passed = failedChecks.length === 0;

const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'RLS Security Boundary Proof',
  status: passed ? 'RLS_SECURITY_PROOF_VALIDATED' : 'RLS_SECURITY_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  stagingProofRequired: true,
  checks,
  failedChecks,
  generatedAtIso: new Date().toISOString(),
  nextAction: passed
    ? 'Run npm run security:prove:rls, then apply the migration to staging and capture live SQL role-isolation proof.'
    : 'Repair the RLS security files before staging.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(passed ? 'RLS_SECURITY_PROOF_VALIDATED' : 'RLS_SECURITY_PROOF_FAILED');
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exitCode = 1;
