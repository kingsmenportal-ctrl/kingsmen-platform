import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/legal/legal-privacy-proof-latest.json');

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

const requiredFiles = [
  'apps/api/src/legal/legal-privacy-proof-boundary.ts',
  'manifests/legal/legal-privacy-proof-v1.json',
  'docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md'
];

for (const file of requiredFiles) {
  check(`file_exists:${file}`, existsSync(join(repoRoot, file)), file);
}

const boundary = read('apps/api/src/legal/legal-privacy-proof-boundary.ts') ?? '';
const manifest = json('manifests/legal/legal-privacy-proof-v1.json');
const docs = read('docs/legal/KINGSMEN_LEGAL_PRIVACY_CONSENT_REFUND_PROOF.md') ?? '';

check('manifest_schema', manifest?.schema === 'kingsmen.legal-privacy-proof.v1', manifest?.schema);
check('manifest_status', manifest?.status === 'foundation_built_pending_legal_review_and_publication_proof', manifest?.status);
check('manifest_production_false', manifest?.productionReady === false, String(manifest?.productionReady));
check('manifest_public_launch_false', manifest?.publicLaunchAllowed === false, String(manifest?.publicLaunchAllowed));
check('manifest_not_final_legal_advice', manifest?.finalLegalAdviceProvidedByCode === false, String(manifest?.finalLegalAdviceProvidedByCode));
check('manifest_legal_review_required', manifest?.attorneyOrFounderReviewRequired === true, String(manifest?.attorneyOrFounderReviewRequired));

for (const token of [
  'LEGAL_PRIVACY_BOUNDARY_SOURCE_ONLY',
  'popiaPrivacyNoticeRequired',
  'cpaRefundTermsRequired',
  'termsOfServiceRequired',
  'consentCaptureRequired',
  'marketingConsentSeparateRequired',
  'dataSubjectRequestPathRequired',
  'childDataGuardianConsentRequired',
  'refundHumanReviewRequired',
  'paymentBeforeRefundNoticeBlocked',
  'personalDataCollectionBeforePrivacyNoticeBlocked'
]) {
  check(`boundary_token:${token}`, boundary.includes(token), token);
}

for (const scenario of [
  'privacy_notice_required_before_personal_data_collection',
  'terms_required_before_account_or_paid_service',
  'refund_policy_required_before_payment',
  'consent_timestamp_and_policy_version_required',
  'marketing_consent_separate_from_service_consent',
  'data_subject_access_correction_deletion_path_defined',
  'refund_claim_requires_order_evidence_and_human_review',
  'minor_or_child_data_requires_guardian_boundary',
  'policy_versioning_and_change_log_required',
  'legal_review_required_before_public_launch'
]) {
  check(`scenario:${scenario}`, boundary.includes(scenario) && JSON.stringify(manifest).includes(scenario), scenario);
}

for (const token of [
  'Terms of Service',
  'Privacy Notice',
  'Consent Notice',
  'Refund and Payment Policy',
  'Data Subject Request Path',
  'Support and Complaint Path',
  'Production ready: **false**',
  'Public launch allowed: **false**',
  'npm run legal:validate'
]) {
  check(`docs_token:${token}`, docs.includes(token), token);
}

for (const [field, expected] of [
  ['publishedPoliciesRequired', true],
  ['popiaPrivacyNoticeRequired', true],
  ['cpaRefundTermsRequired', true],
  ['termsOfServiceRequired', true],
  ['consentCaptureRequired', true],
  ['marketingConsentSeparateRequired', true],
  ['dataSubjectRequestPathRequired', true],
  ['refundHumanReviewRequired', true],
  ['personalDataCollectionBeforePrivacyNoticeAllowed', false],
  ['paymentBeforeRefundNoticeAllowed', false]
]) {
  check(`manifest_flag:${field}`, manifest?.[field] === expected, String(manifest?.[field]));
}

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: 'kingsmen.legal-privacy-proof-report.v1',
  module: 'Legal + Privacy + Consent + Refund Proof',
  status: failed.length === 0 ? 'LEGAL_PRIVACY_SOURCE_PROOF_PASSED' : 'LEGAL_PRIVACY_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  finalLegalAdviceProvidedByCode: false,
  attorneyOrFounderReviewRequired: true,
  publishedPoliciesRequired: true,
  providerRuntimeProofPending: true,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
  nextAction: failed.length === 0
    ? 'Publish/version policies, capture founder/legal review, consent smoke proof, refund display proof, and data-subject request proof before launch.'
    : 'Repair legal/privacy source proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
