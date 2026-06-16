import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/legal/legal-privacy-validation-latest.json');

function read(path) {
  const full = join(repoRoot, path);
  return existsSync(full) ? readFileSync(full, 'utf8') : null;
}

function json(path) {
  const content = read(path);
  return content ? JSON.parse(content) : null;
}

const checks = [];
function check(name, passed, detail = '') {
  checks.push({ name, passed: Boolean(passed), detail });
}

const files = [
  'apps/api/src/legal/legal-privacy-proof-boundary.ts',
  'manifests/legal/legal-privacy-proof-v1.json',
  'docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md',
  'scripts/proof/prove-legal-privacy-boundary.mjs',
  'reports/legal/legal-privacy-proof-latest.json',
  'package.json',
  '.github/workflows/kingsmen-source-guard.yml',
  'docs/launch/KINGSMEN_LAUNCH_READINESS.md',
  'manifests/launch/kingsmen-launch-readiness-v1.json',
  'scripts/validators/validate-kingsmen-launch-readiness.mjs'
];

for (const file of files) {
  const content = read(file);
  check(`file_exists:${file}`, content !== null, file);
  check(`file_nonempty:${file}`, Boolean(content && content.length > 0), file);
}

const proof = json('reports/legal/legal-privacy-proof-latest.json');
check('proof_exists', proof !== null, 'reports/legal/legal-privacy-proof-latest.json');
check('proof_passed', proof?.passed === true, String(proof?.passed));
check('proof_status', proof?.status === 'LEGAL_PRIVACY_SOURCE_PROOF_PASSED', String(proof?.status));
check('proof_not_production_ready', proof?.productionReady === false, String(proof?.productionReady));
check('proof_public_launch_false', proof?.publicLaunchAllowed === false, String(proof?.publicLaunchAllowed));

for (const [file, tokens] of [
  ['apps/api/src/legal/legal-privacy-proof-boundary.ts', ['LEGAL_PRIVACY_BOUNDARY_SOURCE_ONLY', 'popiaPrivacyNoticeRequired', 'cpaRefundTermsRequired', 'marketingConsentSeparateRequired', 'legal_review_required_before_public_launch']],
  ['manifests/legal/legal-privacy-proof-v1.json', ['kingsmen.legal-privacy-proof.v1', 'foundation_built_pending_legal_review_and_publication_proof', 'Terms of Service', 'Privacy Notice', 'Refund and Payment Policy']],
  ['docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md', ['Production ready: **false**', 'Public launch allowed: **false**', 'Terms of Service', 'Privacy Notice', 'Refund and Payment Policy', 'Data Subject Request Path']],
  ['scripts/proof/prove-legal-privacy-boundary.mjs', ['LEGAL_PRIVACY_SOURCE_PROOF_PASSED', 'providerRuntimeProofPending: true']],
  ['package.json', ['legal:prove', 'legal:validate']],
  ['.github/workflows/kingsmen-source-guard.yml', ['npm run legal:prove', 'npm run legal:validate']],
  ['docs/launch/KINGSMEN_LAUNCH_READINESS.md', ['legal + privacy + consent + refund proof', 'npm run legal:validate']],
  ['manifests/launch/kingsmen-launch-readiness-v1.json', ['legal-privacy-proof-v1', 'foundation_built_pending_legal_review_and_publication_proof']],
  ['scripts/validators/validate-kingsmen-launch-readiness.mjs', ['legal:validate', 'LEGAL_PRIVACY_PUBLICATION_PROOF_REQUIRED']]
]) {
  const content = read(file) ?? '';
  for (const token of tokens) {
    check(`token:${file}:${token}`, content.includes(token), token);
  }
}

const manifest = json('manifests/legal/legal-privacy-proof-v1.json');
for (const [field, expected] of [
  ['productionReady', false],
  ['publicLaunchAllowed', false],
  ['finalLegalAdviceProvidedByCode', false],
  ['attorneyOrFounderReviewRequired', true],
  ['publishedPoliciesRequired', true],
  ['consentCaptureRequired', true],
  ['refundHumanReviewRequired', true],
  ['personalDataCollectionBeforePrivacyNoticeAllowed', false],
  ['paymentBeforeRefundNoticeAllowed', false]
]) {
  check(`manifest_flag:${field}`, manifest?.[field] === expected, String(manifest?.[field]));
}

for (const [file, blocked] of [
  ['apps/api/src/legal/legal-privacy-proof-boundary.ts', ['productionReady: true', 'publicLaunchAllowed: true', 'finalLegalAdviceProvidedByCode: true']],
  ['manifests/legal/legal-privacy-proof-v1.json', ['"productionReady": true', '"publicLaunchAllowed": true', '"finalLegalAdviceProvidedByCode": true']],
  ['docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md', ['Production ready: **true**', 'Public launch allowed: **true**']]
]) {
  const content = read(file) ?? '';
  for (const token of blocked) {
    check(`blocked_token_absent:${file}:${token}`, !content.includes(token), token);
  }
}

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Legal + Privacy + Consent + Refund Proof',
  status: failed.length === 0 ? 'LEGAL_PRIVACY_PROOF_VALIDATED' : 'LEGAL_PRIVACY_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  LEGAL_PRIVACY_PUBLICATION_PROOF_REQUIRED: true,
  failed_checks: failed.map(({ name, detail }) => ({ name, detail })),
  checks,
  generated_at: new Date().toISOString(),
  next_action: failed.length === 0
    ? 'Publish policy surfaces and capture legal/founder review plus consent/refund smoke proof before public launch.'
    : 'Repair legal privacy proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
