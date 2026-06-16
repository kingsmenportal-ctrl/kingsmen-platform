import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function full(path) {
  return join(repoRoot, path);
}

function read(path) {
  if (!existsSync(full(path))) return null;
  return readFileSync(full(path), 'utf8');
}

function readJson(path) {
  const content = read(path);
  if (!content) return null;
  return JSON.parse(content);
}

function checkFile(path, tokens = []) {
  const content = read(path);
  const missingTokens = content === null ? tokens : tokens.filter((token) => !content.includes(token));
  return {
    name: `file:${path}`,
    passed: content !== null && missingTokens.length === 0,
    detail: missingTokens.length ? `missing:${missingTokens.join(', ')}` : path
  };
}

const checks = [
  checkFile('apps/api/src/final-assembly/final-assembly-evidence-capture-boundary.ts', [
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY',
    'requiredFinalAssemblyEvidenceReports',
    'finalAssemblyEvidencePending',
    'finalAssemblyFounderReviewRequired',
    'rawReportBodiesMayBeCopiedIntoBundle: false'
  ]),
  checkFile('manifests/launch/final-assembly-evidence-capture-v1.json', [
    'kingsmen.final-assembly-evidence-capture.v1',
    'foundation_built_pending_final_evidence_capture_review',
    'reports/final-assembly/final-assembly-evidence-bundle-latest.json',
    'reports/staging/payfast-provider-sandbox-staging-latest.json',
    'reports/repo/main-branch-protection-apply-latest.json'
  ]),
  checkFile('docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md', [
    'Final Assembly Evidence Capture Proof',
    'Production ready: **false**',
    'Public launch allowed: **false**',
    'npm run final:validate:evidence',
    'Collect-KingsmenFinalAssemblyEvidence.ps1'
  ]),
  checkFile('scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1', [
    'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_INCOMPLETE',
    'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW',
    'rawReportBodiesCopied = $false',
    'Get-FileHash',
    'RequireAll'
  ]),
  checkFile('scripts/proof/prove-final-assembly-evidence-capture.mjs', [
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED',
    'finalAssemblyEvidencePending: true',
    'runtimeReportInventory',
    'rawReportBodiesCopied: false'
  ]),
  checkFile('reports/final-assembly/final-assembly-evidence-capture-proof-latest.json', [
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED'
  ]),
  checkFile('package.json', [
    'final:prove:evidence',
    'final:validate:evidence',
    'final:collect:evidence'
  ]),
  checkFile('.github/workflows/kingsmen-source-guard.yml', [
    'npm run final:prove:evidence',
    'npm run final:validate:evidence'
  ]),
  checkFile('manifests/launch/kingsmen-launch-readiness-v1.json', [
    'final-assembly-evidence-capture-v1',
    'foundation_built_pending_final_evidence_capture_review'
  ]),
  checkFile('docs/launch/KINGSMEN_LAUNCH_READINESS.md', [
    'final assembly evidence capture',
    'npm run final:validate:evidence'
  ]),
  checkFile('scripts/validators/validate-kingsmen-launch-readiness.mjs', [
    'final:validate:evidence',
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_REQUIRED'
  ])
];

const manifest = readJson('manifests/launch/final-assembly-evidence-capture-v1.json');
checks.push({ name: 'manifest_schema', passed: manifest?.schema === 'kingsmen.final-assembly-evidence-capture.v1', detail: String(manifest?.schema) });
checks.push({ name: 'manifest_production_false', passed: manifest?.productionReady === false, detail: String(manifest?.productionReady) });
checks.push({ name: 'manifest_public_launch_false', passed: manifest?.publicLaunchAllowed === false, detail: String(manifest?.publicLaunchAllowed) });
checks.push({ name: 'manifest_final_assembly_closed', passed: manifest?.finalAssemblyCanOpen === false, detail: String(manifest?.finalAssemblyCanOpen) });
checks.push({ name: 'manifest_evidence_pending', passed: manifest?.finalAssemblyEvidencePending === true, detail: String(manifest?.finalAssemblyEvidencePending) });

const proof = readJson('reports/final-assembly/final-assembly-evidence-capture-proof-latest.json');
checks.push({ name: 'proof_exists', passed: proof !== null, detail: 'reports/final-assembly/final-assembly-evidence-capture-proof-latest.json' });
checks.push({ name: 'proof_passed', passed: proof?.passed === true, detail: String(proof?.passed) });
checks.push({ name: 'proof_status', passed: proof?.status === 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED', detail: String(proof?.status) });
checks.push({ name: 'proof_final_assembly_closed', passed: proof?.finalAssemblyCanOpen === false, detail: String(proof?.finalAssemblyCanOpen) });
checks.push({ name: 'proof_raw_bodies_not_copied', passed: proof?.rawReportBodiesCopied === false, detail: String(proof?.rawReportBodiesCopied) });

const passed = checks.every((check) => check.passed);
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Final Assembly Evidence Capture',
  status: passed ? 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_VALIDATED' : 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  finalAssemblyCanOpen: false,
  FINAL_ASSEMBLY_EVIDENCE_CAPTURE_REQUIRED: true,
  failed_checks: checks.filter((check) => !check.passed),
  checks,
  generated_at: new Date().toISOString(),
  next_action: 'Run staging evidence capture and founder-review the final assembly bundle before public launch.'
};

const outPath = full('reports/final-assembly/final-assembly-evidence-validation-latest.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
