import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_33_WHEN_THERE_IS_A_CRITICAL_INCIDENT.md', [
    'NUMBER 33 — WHEN THERE IS A CRITICAL INCIDENT',
    'Sir, immediate attention is required',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md'
  ]],
  ['packages/jarvis-core/src/critical-incident-boundary.ts', [
    'jarvisAssessCriticalIncidentRequest',
    'CRITICAL_INCIDENT_CONTAINMENT_CONTROL',
    'confirmed_high_severity_command_event_requiring_containment',
    'critical_incident_must_not_be_claimed_without_evidence',
    'critical_incident_boundary_built_not_live_incident_response_proven'
  ]],
  ['apps/web/src/app/api/jarvis/critical-incident/route.ts', [
    'CRITICAL_INCIDENT_CONTAINMENT_CONTROL',
    'evidenceRequiredBeforeCriticalClassification',
    'route_built_not_live_incident_response_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisCriticalIncidentPanel.tsx', [
    'JarvisCriticalIncidentPanel',
    'CRITICAL INCIDENT',
    'Runtime proof not captured yet',
    'must not classify a matter as critical without evidence'
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

const route = read('apps/web/src/app/api/jarvis/critical-incident/route.ts');
const boundary = read('packages/jarvis-core/src/critical-incident-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 33 must not claim live incident response or production proof from repo files.');
}
for (const step of ['incident_level_confirmed', 'affected_area_named', 'confirmed_impact_stated', 'risk_exposure_stated', 'containment_required_named', 'recommended_command_set']) {
  if (!boundary.includes(step)) fail(`Critical-incident boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-33-critical-incident',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    criticalClassificationRequiresEvidence: true,
    affectedAreaConfirmedImpactRiskExposureRequired: true,
    containmentAndRecommendedCommandRequired: true,
    unconfirmedMattersSeparated: true,
    runtimeEvidenceRequiredForIncidentResponseClaims: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-33-critical-incident-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_33_CRITICAL_INCIDENT_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
