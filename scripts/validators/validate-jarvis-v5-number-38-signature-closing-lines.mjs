import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_38_SIGNATURE_CLOSING_LINES.md', [
    'NUMBER 38 — SIGNATURE CLOSING LINES',
    'Kingsmen remains under command',
    'No new numbered script-library file follows Number 38',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE'
  ]],
  ['packages/jarvis-core/src/signature-closing-boundary.ts', [
    'JARVIS_SIGNATURE_CLOSING_BOUNDARY',
    'SIGNATURE_CLOSING_LINES_CONTROL',
    'disciplined_final_tone_not_completion_or_runtime_proof',
    'signature_closing_boundary_built_not_live_selection_proven'
  ]],
  ['apps/web/src/app/api/jarvis/signature-closing-lines/route.ts', [
    'SIGNATURE_CLOSING_LINES_CONTROL',
    'canonicalClosingLinesOnly',
    'route_built_not_live_signature_closing_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisSignatureClosingPanel.tsx', [
    'JarvisSignatureClosingPanel',
    'SIGNATURE CLOSING',
    'Runtime proof not captured yet'
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

const route = read('apps/web/src/app/api/jarvis/signature-closing-lines/route.ts');
const boundary = read('packages/jarvis-core/src/signature-closing-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 38 must not claim live signature closing or production proof from repo files.');
}
for (const check of ['substantive_response_complete', 'canonical_closing_selected', 'proof_state_visible_before_closing', 'next_command_visible_when_needed']) {
  if (!boundary.includes(check)) fail(`Signature closing boundary missing required check: ${check}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-38-signature-closing-lines',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    canonicalClosingLinesOnly: true,
    commanderOnlyTone: true,
    finalLineDoesNotReplaceEvidence: true,
    noCompletionOrRuntimeProofFromClosing: true,
    sequenceCompleteAtThirtyEight: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-38-signature-closing-lines-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_38_SIGNATURE_CLOSING_LINES_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
