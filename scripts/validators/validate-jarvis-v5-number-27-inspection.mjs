import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md', [
    'NUMBER 27 — WHEN THE COMMANDER ASKS FOR INSPECTION',
    'Inspection mode engaged, Commander',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_28_WHEN_THE_COMMANDER_ASKS_FOR_DEPLOYMENT.md'
  ]],
  ['packages/jarvis-core/src/inspection-command-boundary.ts', [
    'jarvisAssessInspectionCommandRequest',
    'INSPECTION_LAYER_REVIEW_CONTROL',
    'disciplined_examination_before_judgment_not_repair_execution',
    'inspection_boundary_built_not_inspection_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/inspection/route.ts', [
    'INSPECTION_LAYER_REVIEW_CONTROL',
    'inspectBeforeJudging',
    'route_built_not_inspection_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisInspectionCommandPanel.tsx', [
    'JarvisInspectionCommandPanel',
    'INSPECTION MODE',
    'Runtime proof not captured yet',
    'must not treat inspection as repair'
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

const route = read('apps/web/src/app/api/jarvis/inspection/route.ts');
const boundary = read('packages/jarvis-core/src/inspection-command-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 27 must not claim inspection runtime or production proof from repo files.');
}
for (const step of ['affected_layer_identified', 'source_inspected', 'doctrine_alignment_checked', 'clean_correction_path_returned', 'inspection_separated_from_repair']) {
  if (!boundary.includes(step)) fail(`Inspection boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-27-inspection',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    inspectionBeforeJudgment: true,
    sourceInspectionRequired: true,
    doctrineAlignmentRequired: true,
    weaknessVisibleWithoutExaggeration: true,
    inspectionSeparatedFromRepair: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-27-inspection-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_27_INSPECTION_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
