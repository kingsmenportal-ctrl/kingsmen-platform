import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const proofPath = join(repoRoot, 'reports/security/rls-security-proof-latest.json');

function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function includesAll(source, tokens) {
  return tokens.every((token) => source.includes(token));
}

const migration = read('db/migrations/0019_rls_security_boundary.sql');
const n03Migration = read('db/migrations/0001_n03_truth_vault.sql');
const manifest = read('manifests/security/rls-security-proof-v1.json');

const checks = [];
function check(name, passed, detail = '') {
  checks.push({ name, passed, detail });
}

check('n03_rls_enabled_candidates', n03Migration.includes('ALTER TABLE candidates ENABLE ROW LEVEL SECURITY'), 'N03 enables RLS.');
check('n03_rls_enabled_applications', n03Migration.includes('ALTER TABLE applications ENABLE ROW LEVEL SECURITY'), 'N03 enables RLS.');
check('hardening_migration_exists', migration.length > 0, '0009 hardening migration exists.');
check('drops_bootstrap_broad_candidate_policy', migration.includes('DROP POLICY IF EXISTS service_role_all_candidates ON candidates'), 'Bootstrap candidate policy is dropped.');
check('drops_bootstrap_broad_application_policy', migration.includes('DROP POLICY IF EXISTS service_role_all_applications ON applications'), 'Bootstrap application policy is dropped.');
check('runtime_role_claim_function_exists', migration.includes('current_runtime_role'), 'Runtime role claim helper exists.');
check('candidate_public_ref_claim_function_exists', migration.includes('current_candidate_public_ref'), 'Candidate public ref claim helper exists.');
check('backend_service_context_trusted_claim', migration.includes("auth.jwt() -> 'app_metadata' ->> 'service_context'"), 'Backend context comes from server-managed JWT app_metadata, not client-settable GUCs.');
check('candidate_claim_trusted_source', migration.includes("auth.jwt() -> 'app_metadata' ->> 'candidate_public_ref'"), 'Candidate public reference comes from server-managed JWT app_metadata.');
check('definer_search_path_fixed', migration.includes('SET search_path = pg_catalog'), 'SECURITY DEFINER helper pins a safe search_path.');
check('all_helper_search_paths_pinned', (migration.match(/SET search_path = pg_catalog/g) || []).length >= 7, 'All RLS helper functions pin search_path to pg_catalog.');
check('no_public_helper_execute', !/GRANT\s+EXECUTE\s+ON\s+ALL\s+FUNCTIONS\s+IN\s+SCHEMA\s+kingsmen_security\s+TO\s+PUBLIC/i.test(migration), 'Security helper functions are not executable by PUBLIC.');
check('broad_core_policies_role_scoped', (migration.match(/FOR ALL\s+TO service_role/g) || []).length >= 14, 'Broad backend policies are scoped to service_role.');
check('candidate_own_row_policy_exists', migration.includes('candidates_candidate_read_own'), 'Candidate own-row policy exists.');
check('candidate_own_application_policy_exists', migration.includes('applications_candidate_read_own'), 'Candidate own application policy exists.');
check('protected_evidence_hidden_from_candidate', migration.includes('protected_data = false'), 'Protected evidence hidden from candidate context.');
check('founder_operator_read_exists', migration.includes('founder_operator_read'), 'Founder/operator read policies exist.');
check('audit_founder_read_only', migration.includes('audit_events_founder_read'), 'Audit event read is founder-scoped.');
check('public_verified_sources_only', migration.includes("status = 'VERIFIED'") && migration.includes("confidence_band IN ('A', 'B')"), 'Public source rows are limited to verified A/B confidence.');
check('hardening_migration_has_no_broad_true_policy', !/FOR\s+ALL\s+USING\s*\(\s*true\s*\)\s+WITH\s+CHECK\s*\(\s*true\s*\)/i.test(migration), 'Hardening migration does not create tenant-blind true policies.');
check('manifest_mentions_staging_requirement', manifest.includes('stagingExecutionRequired') && manifest.includes('foundation_built_pending_staging_proof'), 'Manifest keeps staging proof required.');

const scenarios = [
  {
    scenario: 'candidate_can_read_own_candidate_row',
    expected: 'allow',
    claim: "trusted server-managed auth.jwt()->app_metadata.kingsmen_role='candidate' and candidate_public_ref=own public_ref"
  },
  {
    scenario: 'candidate_cannot_read_other_candidate_row',
    expected: 'deny',
    claim: "trusted server-managed app_metadata candidate_public_ref differs; client cannot override claims"
  },
  {
    scenario: 'candidate_can_read_own_applications',
    expected: 'allow',
    claim: "applications.candidate_id=current_candidate_id()"
  },
  {
    scenario: 'candidate_cannot_read_protected_evidence',
    expected: 'deny',
    claim: 'protected_data=true must be hidden from candidate policy'
  },
  {
    scenario: 'operator_can_read_candidate_workbench',
    expected: 'allow_read_only',
    claim: "trusted server-managed auth.jwt()->app_metadata.kingsmen_role='operator'"
  },
  {
    scenario: 'founder_can_read_audit_events',
    expected: 'allow_read_only',
    claim: "trusted server-managed auth.jwt()->app_metadata.kingsmen_role='founder'"
  },
  {
    scenario: 'backend_service_key_absent_from_client_artifacts',
    expected: 'deny',
    claim: 'Service-role credentials must be absent from browser/mobile bundles and public artifacts.'
  },
  {
    scenario: 'backend_mutations_require_verified_server_context',
    expected: 'deny_without_verified_context',
    claim: 'Backend API must verify trusted identity and authorization before using a backend-only service-role credential.'
  },
  {
    scenario: 'anonymous_cannot_read_candidate_data',
    expected: 'deny',
    claim: 'no role claims set'
  },
  {
    scenario: 'public_can_read_verified_route_sources_only',
    expected: 'allow_limited',
    claim: "route_sources.status='VERIFIED' and confidence_band in A/B"
  }
];

check('all_required_scenarios_defined', scenarios.length === 10, `${scenarios.length} scenarios defined.`);
check('scenario_denials_present', scenarios.filter((scenario) => scenario.expected.includes('deny')).length >= 4, 'Negative isolation scenarios are present.');
check('scenario_service_context_present', includesAll(JSON.stringify(scenarios), ['backend_service_key_absent_from_client_artifacts', 'backend_mutations_require_verified_server_context']), 'Backend credential isolation scenarios are present; runtime API proof is still required.');

const failedChecks = checks.filter((item) => !item.passed);
const passed = failedChecks.length === 0;

const report = {
  schema: 'kingsmen.rls-security-proof.v1',
  module: 'RLS Security Boundary Proof',
  status: passed ? 'RLS_SECURITY_SOURCE_PROOF_PASSED' : 'RLS_SECURITY_SOURCE_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  proofLevel: 'source_static_boundary',
  stagingProofRequired: true,
  runtimeClaimModel: {
    roleSource: "auth.jwt()->>'role' or auth.jwt()->app_metadata.kingsmen_role",
    serviceContextSource: 'server-managed auth.jwt()->app_metadata.service_context',
    candidatePublicRefSource: 'server-managed auth.jwt()->app_metadata.candidate_public_ref',
    clientSettableGucsTrusted: false,
    userMetadataTrusted: false
  },
  scenarios,
  checks,
  failedChecks,
  generatedAtIso: new Date().toISOString(),
  nextAction: passed
    ? 'Apply db/migrations/0019_rls_security_boundary.sql to staging and run live SQL role-isolation tests.'
    : 'Repair RLS migration/proof files before staging.'
};

mkdirSync(dirname(proofPath), { recursive: true });
writeFileSync(proofPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(passed ? 'RLS_SECURITY_SOURCE_PROOF_PASSED' : 'RLS_SECURITY_SOURCE_PROOF_FAILED');
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exitCode = 1;
