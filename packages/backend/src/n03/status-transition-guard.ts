const CANDIDATE_BLOCKED_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_document",
  "verify_outcome",
  "publish_success_story",
  "share_identity_with_partner",
  "change_source_confidence"
]);

const PROOF_REQUIRED_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_document",
  "verify_outcome",
  "publish_success_story"
]);

const CONSENT_REQUIRED_ACTIONS = new Set([
  "publish_success_story",
  "share_identity_with_partner"
]);

const FOUNDER_APPROVAL_REQUIRED_ACTIONS = new Set([
  "publish_success_story",
  "share_identity_with_partner",
  "change_source_confidence"
]);

export function assertN03StatusTransitionAllowed(input: {
  action: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  proofId?: string;
  consentId?: string;
  auditId?: string;
  founderApproved?: boolean;
  providerSignal?: "webhook_verified" | "manual_finance_review" | "return_url_only" | "none";
}) {
  if (!input.auditId) {
    throw new Error(`Audit required for status transition: ${input.action}`);
  }

  if (input.actorType === "candidate" && CANDIDATE_BLOCKED_ACTIONS.has(input.action)) {
    throw new Error(`Candidate blocked from status transition: ${input.action}`);
  }

  if (input.action === "mark_paid" && input.providerSignal !== "webhook_verified" && input.providerSignal !== "manual_finance_review") {
    throw new Error("Payment cannot be marked paid from return_url/browser alone");
  }

  if (PROOF_REQUIRED_ACTIONS.has(input.action) && !input.proofId) {
    throw new Error(`Proof required for status transition: ${input.action}`);
  }

  if (CONSENT_REQUIRED_ACTIONS.has(input.action) && !input.consentId) {
    throw new Error(`Consent required for status transition: ${input.action}`);
  }

  if (FOUNDER_APPROVAL_REQUIRED_ACTIONS.has(input.action) && input.founderApproved !== true) {
    throw new Error(`Founder approval required for status transition: ${input.action}`);
  }

  return true;
}