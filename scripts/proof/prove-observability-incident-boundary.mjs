import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/ops/observability-incident-proof-latest.json');

function read(path) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf8');
}

function check(name, passed, detail = '') {
  return { name, passed: Boolean(passed), detail };
}

const boundaryPath = 'apps/api/src/ops/observability-incident-proof-boundary.ts';
const manifestPath = 'manifests/ops/observability-incident-proof-v1.json';
const docsPath = 'docs/ops/KINGSMEN_OBSERVABILITY_INCIDENT_PROOF.md';

const boundary = read(boundaryPath);
const manifest = read(manifestPath);
const docs = read(docsPath);
const manifestJson = manifest ? JSON.parse(manifest) : null;

const requiredBoundaryTokens = [
  'OBSERVABILITY_INCIDENT_BOUNDARY_SOURCE_ONLY',
  'apiHealthCheckRequired',
  'databaseHealthCheckRequired',
  'queueHealthCheckRequired',
  'structuredLogsRequired',
  'correlationIdRequired',
  'dlqReviewRequired',
  'founderEscalationRequired',
  'incidentRunbookRequired',
  'piiRedactionRequired',
  'liveMonitoringConnected: false',
  'livePagerConfigured: false'
];

const requiredScenarios = [
  'api_health_check_defined',
  'database_health_check_defined',
  'queue_health_check_defined',
  'structured_logs_require_correlation_id',
  'idempotency_key_logged_safely',
  'dlq_review_required',
  'payment_failure_alert_defined',
  'rls_denial_alert_defined',
  'backup_restore_failure_alert_defined',
  'communications_failure_alert_defined',
  'incident_severity_triage_defined',
  'founder_escalation_defined',
  'pii_and_secret_redaction_required',
  'live_monitoring_pending'
];

const requiredDocsTokens = [
  'API health',
  'database health',
  'worker/queue health',
  'DLQ',
  'SEV1',
  'SEV2',
  'SEV3',
  'founder escalation',
  'no PII or secrets in logs proof'
];

const sensitivePatterns = [
  /postgres:\/\/[^\s"']+/i,
  /redis:\/\/[^\s"']+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bsk-[A-Za-z0-9_-]{20,}/i,
  /\b(SMTP_PASSWORD|WHATSAPP_PROVIDER_TOKEN|SMS_PROVIDER_TOKEN|PAYFAST_PASSPHRASE|SERVICE_ROLE_KEY)\s*[:=]\s*["']?[A-Za-z0-9._-]{10,}/i
];

const checks = [
  check(`file_exists:${boundaryPath}`, existsSync(join(repoRoot, boundaryPath)), boundaryPath),
  check(`file_exists:${manifestPath}`, existsSync(join(repoRoot, manifestPath)), manifestPath),
  check(`file_exists:${docsPath}`, existsSync(join(repoRoot, docsPath)), docsPath),
  check('manifest_schema', manifestJson?.schema === 'kingsmen.observability-incident-proof.v1', manifestJson?.schema ?? ''),
  check('manifest_status', manifestJson?.status === 'foundation_built_pending_staging_monitoring_proof', manifestJson?.status ?? ''),
  check('manifest_production_false', manifestJson?.productionReady === false, String(manifestJson?.productionReady)),
  check('manifest_public_launch_false', manifestJson?.publicLaunchAllowed === false, String(manifestJson?.publicLaunchAllowed)),
  check('manifest_live_monitoring_false', manifestJson?.liveMonitoringConnected === false, String(manifestJson?.liveMonitoringConnected)),
  check('manifest_live_pager_false', manifestJson?.livePagerConfigured === false, String(manifestJson?.livePagerConfigured)),
  check('manifest_no_raw_candidate_logs', manifestJson?.rawCandidateDataInLogsAllowed === false, String(manifestJson?.rawCandidateDataInLogsAllowed)),
  check('manifest_no_provider_secrets_logs', manifestJson?.providerSecretsInLogsAllowed === false, String(manifestJson?.providerSecretsInLogsAllowed))
];

for (const token of requiredBoundaryTokens) {
  checks.push(check(`boundary_token:${token}`, boundary.includes(token), token));
}

for (const scenario of requiredScenarios) {
  checks.push(check(`scenario:${scenario}`, boundary.includes(scenario) && manifest.includes(scenario), scenario));
}

for (const token of requiredDocsTokens) {
  checks.push(check(`docs_token:${token}`, docs.includes(token), token));
}

for (const [path, content] of [
  [boundaryPath, boundary],
  [manifestPath, manifest],
  [docsPath, docs]
]) {
  for (const pattern of sensitivePatterns) {
    checks.push(check(`no_sensitive_pattern:${path}:${pattern}`, !pattern.test(content), path));
  }
}

const passed = checks.every((item) => item.passed);
const report = {
  schema: 'kingsmen.observability-incident-proof-report.v1',
  module: 'Observability + Incident Proof',
  status: passed ? 'OBSERVABILITY_INCIDENT_SOURCE_PROOF_PASSED' : 'OBSERVABILITY_INCIDENT_SOURCE_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  liveMonitoringConnected: false,
  livePagerConfigured: false,
  rawCandidateDataInLogsAllowed: false,
  providerSecretsInLogsAllowed: false,
  stagingRuntimeProofPending: true,
  checks,
  failed: checks.filter((item) => !item.passed),
  generatedAt: new Date().toISOString(),
  nextAction: passed
    ? 'Run staging monitoring, DLQ, alert, redaction, and incident drill proof before public users.'
    : 'Repair observability and incident source boundary.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
