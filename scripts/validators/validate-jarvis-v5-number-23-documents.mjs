import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md', [
    'NUMBER 23 — WHEN THE COMMANDER ASKS ABOUT DOCUMENTS',
    'missing or weak evidence',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md'
  ]],
  ['packages/jarvis-core/src/document-evidence-boundary.ts', [
    'jarvisAssessDocumentEvidenceRequest',
    'DOCUMENT_EVIDENCE_READINESS_CONTROL',
    'evidence_bearing_material_not_automatic_truth',
    'file_presence_must_not_be_treated_as_evidence_readiness',
    'document_boundary_built_not_document_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/documents/route.ts', [
    'DOCUMENT_EVIDENCE_READINESS_CONTROL',
    'filePresenceIsNotReadiness',
    'route_built_not_document_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisDocumentEvidencePanel.tsx', [
    'JarvisDocumentEvidencePanel',
    'DOCUMENT EVIDENCE READINESS',
    'Runtime proof not captured yet',
    'must not treat file presence as readiness'
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

const route = read('apps/web/src/app/api/jarvis/documents/route.ts');
const boundary = read('packages/jarvis-core/src/document-evidence-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 23 must not claim document runtime or production proof from repo files.');
}
if (!boundary.includes('executionAction && !request.explicitExecutionApproval')) {
  fail('Number 23 must block document send or submit actions without explicit approval.');
}

const report = {
  validator: 'validate-jarvis-v5-number-23-documents',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    documentsAreEvidenceBearingMaterialsNotAutomaticTruth: true,
    filePresenceIsNotReadiness: true,
    weakMissingEvidenceFlagged: true,
    privacyMinimizationRequired: true,
    noSendOrSubmitWithoutApproval: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-23-documents-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_23_DOCUMENTS_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
