const CANDIDATE_FORBIDDEN_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_document",
  "verify_outcome",
  "publish_success_story",
  "share_identity_with_partner",
  "change_source_confidence"
]);

export function assertN03TruthAuthority(input: { actorType: string; action: string; proofPresent?: boolean; founderApproved?: boolean }) {
  if (input.actorType === "candidate" && CANDIDATE_FORBIDDEN_ACTIONS.has(input.action)) {
    throw new Error(`Candidate authority blocked for action: ${input.action}`);
  }

  if (["mark_paid", "mark_submitted", "verify_outcome", "publish_success_story"].includes(input.action) && input.proofPresent !== true) {
    throw new Error(`Proof required for truth action: ${input.action}`);
  }

  if (["publish_success_story", "share_identity_with_partner"].includes(input.action) && input.founderApproved !== true) {
    throw new Error(`Founder approval required for action: ${input.action}`);
  }

  return true;
}