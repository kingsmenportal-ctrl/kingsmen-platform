export type N03ProofRequirement = {
  action:
    | "mark_paid"
    | "mark_submitted"
    | "verify_document"
    | "verify_outcome"
    | "publish_success_story"
    | "share_identity_with_partner"
    | "change_source_confidence";
  proofRequired: boolean;
  consentRequired: boolean;
  founderApprovalRequired: boolean;
  candidateAllowed: false;
};