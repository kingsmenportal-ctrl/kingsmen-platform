const FORBIDDEN_CANDIDATE_AUTH_ACTIONS = new Set([
  "mark_paid",
  "mark_submitted",
  "verify_outcome",
  "change_source_confidence",
  "share_identity_with_partner",
  "publish_success_story"
]);

export function assertN04OwnDataBoundary(input: {
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  action: string;
  candidateId: string;
  ownerCandidateId?: string;
}) {
  if (input.actorType === "candidate" && input.ownerCandidateId && input.candidateId !== input.ownerCandidateId) {
    throw new Error("N04 candidate can only access own data");
  }

  if (input.actorType === "candidate" && FORBIDDEN_CANDIDATE_AUTH_ACTIONS.has(input.action)) {
    throw new Error(`N04 candidate auth cannot perform truth-authority action: ${input.action}`);
  }

  return true;
}