import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md', [
    'NUMBER 30 — WHEN EVIDENCE IS MISSING',
    'Commander, the evidence is incomplete',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md'
  ]],
  ['packages/jarvis-core/src/evidence-missing-boundary.ts', [
    'jarvisAssessEvidenceMissingRequest',
    'EVIDENCE_MISSING_VERIFICATION_HOLD_CONTROL',
    'missing_evidence_blocks_verified_status_and_execution',
    'incomplete_evidence_must_not_be_marked_verified',
    'evidence_missing_boundary_built_not_live_verification_proven'
  ]],
  ['apps/web/src/app/api/jarvis/evidence-missing/route.ts', [
    'EVIDENCE_MISSING_VERIFICATION_HOLD_CONTROL',
    'requiredProofMustExistBeforeVerifiedStatus',
    'route_built_not_live_evidence_verification_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisEvidenceMissingPanel.tsx', [
    'JarvisEvidenceMissingPanel',
    'EVIDENCE MISSING',
    'Runtime proof not captured yet',
    'must not treat incomplete evidence as verified'
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

const route = read('apps/web/src/app/api/jarvis/evidence-missing/route.ts');
const boundary = read('packages/jarvis-core/src/evidence-missing-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 30 must not claim evidence verification runtime or production proof from repo files.');
}
for (const step of ['claim_identified', 'present_evidence_listed', 'missing_evidence_listed', 'verification_status_marked_unverified_when_incomplete', 'next_proof_command_set']) {
  if (!boundary.includes(step)) fail(`Evidence boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-30-evidence-missing',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    incompleteEvidenceIsUnverified: true,
    missingProofNamedClearly: true,
    assumptionsAreNotProof: true,
    sourceProofRequiredForOfficialStatus: true,
    runtimeEvidenceRequiredForRuntimeClaims: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-30-evidence-missing-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_30_EVIDENCE_MISSING_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
