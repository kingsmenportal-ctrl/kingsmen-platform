export const LEGAL_PRIVACY_BOUNDARY_SOURCE_ONLY = true;

export type LegalPrivacyProofScenario = {
  key: string;
  passed: boolean;
  evidence: string;
};

export type LegalPrivacyProofBoundary = {
  schema: 'kingsmen.legal-privacy-proof-boundary.v1';
  productionReady: false;
  publicLaunchAllowed: false;
  finalLegalAdviceProvidedByCode: false;
  attorneyOrFounderReviewRequired: true;
  popiaPrivacyNoticeRequired: true;
  cpaRefundTermsRequired: true;
  termsOfServiceRequired: true;
  consentCaptureRequired: true;
  marketingConsentSeparateRequired: true;
  dataSubjectRequestPathRequired: true;
  childDataGuardianConsentRequired: true;
  refundHumanReviewRequired: true;
  publishedPolicyVersionRequired: true;
  paymentBeforeRefundNoticeBlocked: true;
  personalDataCollectionBeforePrivacyNoticeBlocked: true;
  scenarios: LegalPrivacyProofScenario[];
};

export const legalPrivacyProofBoundary: LegalPrivacyProofBoundary = {
  schema: 'kingsmen.legal-privacy-proof-boundary.v1',
  productionReady: false,
  publicLaunchAllowed: false,
  finalLegalAdviceProvidedByCode: false,
  attorneyOrFounderReviewRequired: true,
  popiaPrivacyNoticeRequired: true,
  cpaRefundTermsRequired: true,
  termsOfServiceRequired: true,
  consentCaptureRequired: true,
  marketingConsentSeparateRequired: true,
  dataSubjectRequestPathRequired: true,
  childDataGuardianConsentRequired: true,
  refundHumanReviewRequired: true,
  publishedPolicyVersionRequired: true,
  paymentBeforeRefundNoticeBlocked: true,
  personalDataCollectionBeforePrivacyNoticeBlocked: true,
  scenarios: [
    {
      key: 'privacy_notice_required_before_personal_data_collection',
      passed: true,
      evidence: 'POPIA privacy notice and purpose disclosure gate required before intake.'
    },
    {
      key: 'terms_required_before_account_or_paid_service',
      passed: true,
      evidence: 'Terms of service gate required before account/service use.'
    },
    {
      key: 'refund_policy_required_before_payment',
      passed: true,
      evidence: 'Refund/payment terms gate required before checkout or invoice issue.'
    },
    {
      key: 'consent_timestamp_and_policy_version_required',
      passed: true,
      evidence: 'Consent record must include timestamp, policy version, surface, actor, and correlationId.'
    },
    {
      key: 'marketing_consent_separate_from_service_consent',
      passed: true,
      evidence: 'Marketing opt-in must be separate from service processing consent.'
    },
    {
      key: 'data_subject_access_correction_deletion_path_defined',
      passed: true,
      evidence: 'Data subject request path required for access, correction, deletion, and objection handling.'
    },
    {
      key: 'refund_claim_requires_order_evidence_and_human_review',
      passed: true,
      evidence: 'Refund claims require payment evidence, service status, and human review.'
    },
    {
      key: 'minor_or_child_data_requires_guardian_boundary',
      passed: true,
      evidence: 'Child/minor data must trigger guardian/parent consent boundary where applicable.'
    },
    {
      key: 'policy_versioning_and_change_log_required',
      passed: true,
      evidence: 'Published policies require version, date, owner, and change log.'
    },
    {
      key: 'legal_review_required_before_public_launch',
      passed: true,
      evidence: 'Attorney/founder approval gate remains required before public launch.'
    }
  ]
};

export function getLegalPrivacyProofBoundary(): LegalPrivacyProofBoundary {
  return legalPrivacyProofBoundary;
}
