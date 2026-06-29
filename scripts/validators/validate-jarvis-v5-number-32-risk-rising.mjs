import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_32_WHEN_RISK_IS_RISING.md', [
    'NUMBER 32 — WHEN RISK IS RISING',
    'Commander, the matter requires attention',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_33_WHEN_THERE_IS_A_CRITICAL_INCIDENT.md'
  ]],
  ['packages/jarvis-core/src/risk-rising-boundary.ts', [
    'jarvisAssessRiskRisingRequest',
    'RISK_RISING_EARLY_INTERVENTION_CONTROL',
    'early_intervention_signal_not_critical_incident_by_default',
    'rising_risk_must_not_be_called_critical_without_proof',
    'risk_rising_boundary_built_not_live_risk_monitoring_proven'
  ]],
  ['apps/web/src/app/api/jarvis/risk-rising/route.ts', [
    'RISK_RISING_EARLY_INTERVENTION_CONTROL',
    'doNotCallCriticalWithoutProof',
    'route_built_not_live_risk_monitoring_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisRiskRisingPanel.tsx', [
    'JarvisRiskRisingPanel',
    'RISK RISING',
    'Runtime proof not captured yet',
    'must not hide rising risk as stable'
  ]]
]);

function fail(message) { throw new Error(message); }
function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];
for (const [file, tokens] of required.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) fail(`Required token not found in ${file}: ${token}`);
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const route = read('apps/web/src/app/api/jarvis/risk-rising/route.ts');
const boundary = read('packages/jarvis-core/src/risk-rising-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 32 must not claim live risk monitoring or production proof from repo files.');
}
for (const step of ['matter_identified', 'current_condition_stated', 'risk_evidence_listed', 'risk_cause_identified', 'recommended_intervention_set', 'next_command_set']) {
  if (!boundary.includes(step)) fail(`Risk-rising boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-32-risk-rising',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    risingRiskRequiresAttention: true,
    notCriticalWithoutProof: true,
    causeAndOperationalCostRequired: true,
    interventionBeforeOperationalCostIncreases: true,
    runtimeEvidenceRequiredForRiskMonitoringClaims: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-32-risk-rising-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_32_RISK_RISING_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
