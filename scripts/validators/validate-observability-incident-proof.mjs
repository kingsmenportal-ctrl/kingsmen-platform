import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/ops/observability-incident-validation-latest.json');
const proofPath = 'reports/ops/observability-incident-proof-latest.json';

function read(path) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}

function json(path) {
  const content = read(path);
  return content ? JSON.parse(content) : null;
}

function check(name, passed, detail = '') {
  return { name, passed: Boolean(passed), detail };
}

const requiredFiles = [
  'apps/api/src/ops/observability-incident-proof-boundary.ts',
  'manifests/ops/observability-incident-proof-v1.json',
  'docs/ops/KINGSMEN_OBSERVABILITY_INCIDENT_PROOF.md',
  'scripts/proof/prove-observability-incident-boundary.mjs',
  proofPath,
  'package.json',
  '.github/workflows/kingsmen-source-guard.yml',
  'docs/launch/KINGSMEN_LAUNCH_READINESS.md',
  'manifests/launch/kingsmen-launch-readiness-v1.json',
  'scripts/validators/validate-kingsmen-launch-readiness.mjs'
];

const tokens = new Map([
  ['apps/api/src/ops/observability-incident-proof-boundary.ts', ['OBSERVABILITY_INCIDENT_BOUNDARY_SOURCE_ONLY', 'apiHealthCheckRequired', 'databaseHealthCheckRequired', 'queueHealthCheckRequired', 'correlationIdRequired', 'dlqReviewRequired', 'founderEscalationRequired', 'incidentRunbookRequired']],
  ['manifests/ops/observability-incident-proof-v1.json', ['kingsmen.observability-incident-proof.v1', 'foundation_built_pending_staging_monitoring_proof', 'api_health_check_defined', 'dlq_review_required', 'founder_escalation_defined']],
  ['docs/ops/KINGSMEN_OBSERVABILITY_INCIDENT_PROOF.md', ['Production ready: **false**', 'SEV1', 'SEV2', 'SEV3', 'founder escalation', 'npm run observability:validate']],
  ['scripts/proof/prove-observability-incident-boundary.mjs', ['OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED', 'stagingRuntimeProofPending: true']],
  ['package.json', ['observability:prove', 'observability:validate']],
  ['.github/workflows/kingsmen-source-guard.yml', ['npm run observability:prove', 'npm run observability:validate']],
  ['docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['observability + incident proof', 'npm run observability:validate']],
  ['manifests/launch/kingsmen-launch-readiness-v1.json', ['observability-incident-proof-v1', 'foundation_built_pending_staging_monitoring_proof']],
  ['scripts/validators/validate-kingsmen-launch-readiness.mjs', ['observability:validate', 'OBSERVABILITY_STAGING_PROOF_REQUIRED']]
]);

const proof = json(proofPath);
const manifest = json('manifests/ops/observability-incident-proof-v1.json');
const checks = [];

for (const file of requiredFiles) {
  checks.push(check(`file_exists:${file}`, existsSync(join(repoRoot, file)), file));
  checks.push(check(`file_nonempty:${file}`, read(file).length > 0, file));
}

for (const [file, requiredTokens] of tokens.entries()) {
  const content = read(file);
  for (const token of requiredTokens) {
    checks.push(check(`token:${file}:${token}`, content.includes(token), token));
  }
}

checks.push(check('proof_exists', Boolean(proof), proofPath));
checks.push(check('proof_passed', proof?.passed === true, String(proof?.passed)));
checks.push(check('proof_status', proof?.status === 'OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED', proof?.status ?? ''));
checks.push(check('proof_live_monitoring_false', proof?.liveMonitoringConnected === false, String(proof?.liveMonitoringConnected)));
checks.push(check('proof_live_pager_false', proof?.livePagerConfigured === false, String(proof?.livePagerConfigured)));
checks.push(check('proof_staging_pending', proof?.stagingRuntimeProofPending === true, String(proof?.stagingRuntimeProofPending)));
checks.push(check('manifest_schema', manifest?.schema === 'kingsmen.observability-incident-proof.v1', manifest?.schema ?? ''));
checks.push(check('manifest_status', manifest?.status === 'foundation_built_pending_staging_monitoring_proof', manifest?.status ?? ''));
checks.push(check('manifest_production_false', manifest?.productionReady === false, String(manifest?.productionReady)));
checks.push(check('manifest_public_launch_false', manifest?.publicLaunchAllowed === false, String(manifest?.publicLaunchAllowed)));
checks.push(check('manifest_live_monitoring_false', manifest?.liveMonitoringConnected === false, String(manifest?.liveMonitoringConnected)));
checks.push(check('manifest_live_pager_false', manifest?.livePagerConfigured === false, String(manifest?.livePagerConfigured)));

const passed = checks.every((item) => item.passed);
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Observability + Incident Proof',
  status: passed ? 'OBSERVABILITY_INCIDENT_PROOF_VALIDATED' : 'OBSERVABILITY_INCIDENT_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMonitoringConnected: false,
  livePagerConfigured: false,
  failed_checks: checks.filter((item) => !item.passed).map(({ name, detail }) => ({ name, detail })),
  checks,
  generated_at: new Date().toISOString(),
  next_action: passed
    ? 'Run staging observability, alert, DLQ, redaction, and incident drill proof before public launch.'
    : 'Repair observability incident proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
