import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md', [
    'NUMBER 24 — WHEN THE COMMANDER ASKS ABOUT REPORTS',
    'present status, verified facts, unresolved matters, risk exposure, responsible owner, and recommended next command',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md'
  ]],
  ['packages/jarvis-core/src/report-command-boundary.ts', [
    'jarvisAssessReportCommandRequest',
    'REPORT_COMMAND_INTELLIGENCE_CONTROL',
    'structured_command_intelligence_not_execution_proof',
    'report_text_must_not_be_treated_as_execution_proof',
    'report_boundary_built_not_report_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/reports/route.ts', [
    'REPORT_COMMAND_INTELLIGENCE_CONTROL',
    'verifiedFactsSeparatedFromAssumptions',
    'route_built_not_report_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisReportCommandPanel.tsx', [
    'JarvisReportCommandPanel',
    'REPORT COMMAND FORM',
    'Runtime proof not captured yet',
    'must not treat report text as execution proof'
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

const route = read('apps/web/src/app/api/jarvis/reports/route.ts');
const boundary = read('packages/jarvis-core/src/report-command-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 24 must not claim report runtime or production proof from repo files.');
}
for (const section of ['present_status', 'verified_facts', 'unresolved_matters', 'risk_exposure', 'responsible_owner', 'recommended_next_command']) {
  if (!boundary.includes(section)) fail(`Report boundary missing required section: ${section}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-24-reports',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    reportsAreCommandIntelligenceNotExecutionProof: true,
    verifiedFactsSeparatedFromAssumptions: true,
    unresolvedMattersVisible: true,
    riskOwnerNextCommandRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-24-reports-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_24_REPORTS_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
